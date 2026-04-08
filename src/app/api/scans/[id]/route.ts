import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { SiteAnalysis } from '@/lib/site-analyzer';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = verifySession(request);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;

    const scan = await db.scannedUrl.findFirst({
      where: {
        id,
        userId: session.userId,
      },
      include: {
        result: true,
        features: true,
      },
    });

    if (!scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    // Parse siteAnalysis JSON
    let siteAnalysis: SiteAnalysis | null = null;
    if (scan.result?.siteAnalysis) {
      try {
        siteAnalysis = JSON.parse(scan.result.siteAnalysis) as SiteAnalysis;
      } catch {
        siteAnalysis = null;
      }
    }

    return NextResponse.json({
      scan: {
        id: scan.id,
        originalUrl: scan.originalUrl,
        domain: scan.domain,
        protocol: scan.protocol,
        path: scan.path,
        queryParams: scan.queryParams,
        status: scan.status,
        createdAt: scan.createdAt,
        updatedAt: scan.updatedAt,
        isMalicious: scan.result?.isMalicious ?? false,
        threatType: scan.result?.threatType ?? null,
        confidenceScore: scan.result?.confidenceScore ?? 0,
        riskLevel: scan.result?.riskLevel ?? 'LOW',
        details: scan.result?.details ? JSON.parse(scan.result.details) : [],
        recommendations: scan.result?.recommendations ? JSON.parse(scan.result.recommendations) : [],
        features: scan.features ?? null,
        processingTimeMs: scan.result?.processingTimeMs ?? 0,
        siteAnalysis,
      },
    });
  } catch (error) {
    console.error('Get scan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = verifySession(request);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;

    // Check ownership
    const scan = await db.scannedUrl.findFirst({
      where: {
        id,
        userId: session.userId,
      },
    });

    if (!scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    // Delete result and features first (they depend on the scan)
    await db.urlFeatures.deleteMany({ where: { urlId: id } });
    await db.scanResult.deleteMany({ where: { urlId: id } });
    await db.scannedUrl.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete scan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
