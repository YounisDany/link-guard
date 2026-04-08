import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = verifySession(request);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const scans = await db.scannedUrl.findMany({
      where: { userId: session.userId },
      include: {
        result: true,
        features: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedScans = scans.map((scan) => ({
      id: scan.id,
      originalUrl: scan.originalUrl,
      domain: scan.domain,
      protocol: scan.protocol,
      status: scan.status,
      createdAt: scan.createdAt,
      isMalicious: scan.result?.isMalicious ?? false,
      threatType: scan.result?.threatType ?? null,
      confidenceScore: scan.result?.confidenceScore ?? 0,
      riskLevel: scan.result?.riskLevel ?? 'LOW',
      details: scan.result?.details ? JSON.parse(scan.result.details) : [],
      recommendations: scan.result?.recommendations ? JSON.parse(scan.result.recommendations) : [],
      features: scan.features
        ? {
            urlLength: scan.features.urlLength,
            domainLength: scan.features.domainLength,
            pathLength: scan.features.pathLength,
            pathDepth: scan.features.pathDepth,
            numDots: scan.features.numDots,
            numHyphens: scan.features.numHyphens,
            numUnderscores: scan.features.numUnderscores,
            numAtSymbols: scan.features.numAtSymbols,
            numSpecialChars: scan.features.numSpecialChars,
            hasIpAddress: scan.features.hasIpAddress,
            hasHttps: scan.features.hasHttps,
            numSubdomains: scan.features.numSubdomains,
            entropy: scan.features.entropy,
            numQueryParams: scan.features.numQueryParams,
            hasSuspiciousWords: scan.features.hasSuspiciousWords,
            numDigits: scan.features.numDigits,
            numRedirects: scan.features.numRedirects,
          }
        : null,
      processingTimeMs: scan.result?.processingTimeMs ?? 0,
    }));

    return NextResponse.json({ scans: formattedScans });
  } catch (error) {
    console.error('Get scans error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
