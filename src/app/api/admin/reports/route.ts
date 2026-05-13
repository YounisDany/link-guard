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

    const now = new Date();
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - 29);
    start.setUTCHours(0, 0, 0, 0);

    // Daily breakdown of scans by verdict (last 30 days)
    const scans = await db.scannedUrl.findMany({
      where: { createdAt: { gte: start } },
      select: {
        createdAt: true,
        domain: true,
        result: { select: { isMalicious: true, riskLevel: true, threatType: true } },
      },
    });

    const dayBuckets = new Map<
      string,
      { day: string; total: number; safe: number; suspicious: number; malicious: number }
    >();
    for (let i = 0; i < 30; i++) {
      const d = new Date(start);
      d.setUTCDate(d.getUTCDate() + i);
      const key = d.toISOString().slice(0, 10);
      dayBuckets.set(key, { day: key, total: 0, safe: 0, suspicious: 0, malicious: 0 });
    }

    const domainCount = new Map<string, { domain: string; total: number; malicious: number }>();
    const threatCount = new Map<string, number>();
    let totalMalicious = 0;
    let totalSuspicious = 0;
    let totalSafe = 0;

    for (const s of scans) {
      const key = s.createdAt.toISOString().slice(0, 10);
      const bucket = dayBuckets.get(key);
      const isMalicious = !!s.result?.isMalicious;
      const level = s.result?.riskLevel || 'LOW';
      const isSuspicious = !isMalicious && (level === 'MEDIUM' || level === 'HIGH');
      if (bucket) {
        bucket.total++;
        if (isMalicious) bucket.malicious++;
        else if (isSuspicious) bucket.suspicious++;
        else bucket.safe++;
      }
      if (isMalicious) totalMalicious++;
      else if (isSuspicious) totalSuspicious++;
      else totalSafe++;

      const host = s.domain || 'unknown';
      const dc = domainCount.get(host) || { domain: host, total: 0, malicious: 0 };
      dc.total++;
      if (isMalicious) dc.malicious++;
      domainCount.set(host, dc);

      if (s.result?.threatType) {
        threatCount.set(s.result.threatType, (threatCount.get(s.result.threatType) || 0) + 1);
      }
    }

    const dailyBreakdown = Array.from(dayBuckets.values());
    const topDomains = Array.from(domainCount.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 15);
    const topThreats = Array.from(threatCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([type, count]) => ({ type, count }));

    // Top scanners (users)
    const topUsers = await db.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        _count: { select: { scans: true } },
      },
      orderBy: { scans: { _count: 'desc' } },
      take: 10,
    });

    return NextResponse.json({
      range: { from: start.toISOString(), to: now.toISOString() },
      totals: {
        total: totalMalicious + totalSuspicious + totalSafe,
        safe: totalSafe,
        suspicious: totalSuspicious,
        malicious: totalMalicious,
      },
      dailyBreakdown,
      topDomains,
      topThreats,
      topUsers,
    });
  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
