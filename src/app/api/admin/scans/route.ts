import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = verifySession(request);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;
    const q = (searchParams.get('q') || '').trim();
    const verdict = searchParams.get('verdict') || ''; // safe | suspicious | malicious

    const where: any = {};
    if (q) {
      where.OR = [
        { originalUrl: { contains: q, mode: 'insensitive' } },
        { domain: { contains: q, mode: 'insensitive' } },
        { user: { username: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }
    if (verdict === 'malicious') {
      where.result = { isMalicious: true };
    } else if (verdict === 'safe') {
      where.result = { isMalicious: false, riskLevel: { in: ['LOW'] } };
    } else if (verdict === 'suspicious') {
      where.result = { isMalicious: false, riskLevel: { in: ['MEDIUM', 'HIGH'] } };
    }

    const [scans, total] = await Promise.all([
      db.scannedUrl.findMany({
        where,
        select: {
          id: true,
          originalUrl: true,
          domain: true,
          createdAt: true,
          user: { select: { id: true, username: true, email: true } },
          result: { select: { isMalicious: true, riskLevel: true, confidenceScore: true, threatType: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.scannedUrl.count({ where }),
    ]);

    return NextResponse.json({ scans, total, page, limit });
  } catch (error) {
    console.error('List scans error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
