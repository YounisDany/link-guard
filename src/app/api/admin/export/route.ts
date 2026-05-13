import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = verifySession(request);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const scans = await db.scannedUrl.findMany({
    select: {
      id: true,
      originalUrl: true,
      domain: true,
      createdAt: true,
      user: { select: { username: true, email: true } },
      result: { select: { isMalicious: true, riskLevel: true, confidenceScore: true, threatType: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 10000,
  });

  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = 'id,url,domain,user,email,verdict,risk_level,confidence,threat_type,created_at\n';
  const body = scans
    .map((s) => {
      const verdict = s.result?.isMalicious
        ? 'malicious'
        : s.result?.riskLevel === 'MEDIUM' || s.result?.riskLevel === 'HIGH'
          ? 'suspicious'
          : 'safe';
      return [
        s.id,
        esc(s.originalUrl),
        esc(s.domain),
        esc(s.user?.username),
        esc(s.user?.email),
        verdict,
        s.result?.riskLevel ?? '',
        s.result?.confidenceScore ?? '',
        esc(s.result?.threatType),
        s.createdAt.toISOString(),
      ].join(',');
    })
    .join('\n');

  return new NextResponse('﻿' + header + body, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="link-guard-scans.csv"',
    },
  });
}
