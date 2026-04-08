import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = verifySession(request);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // User stats
    const totalScans = await db.scannedUrl.count({
      where: { userId: session.userId },
    });

    const maliciousCount = await db.scannedUrl.count({
      where: {
        userId: session.userId,
        result: { isMalicious: true },
      },
    });

    const safeCount = await db.scannedUrl.count({
      where: {
        userId: session.userId,
        result: { riskLevel: 'LOW' },
      },
    });

    const suspiciousCount = totalScans - maliciousCount - safeCount;

    // Recent scans - last 7 days daily counts
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentScans = await db.scannedUrl.findMany({
      where: {
        userId: session.userId,
        createdAt: { gte: sevenDaysAgo },
      },
      include: {
        result: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const dailyCounts: Record<string, { total: number; safe: number; suspicious: number; malicious: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      dailyCounts[key] = { total: 0, safe: 0, suspicious: 0, malicious: 0 };
    }

    for (const scan of recentScans) {
      const key = scan.createdAt.toISOString().split('T')[0];
      if (dailyCounts[key]) {
        dailyCounts[key].total += 1;
        const riskLevel = scan.result?.riskLevel ?? 'LOW';
        if (riskLevel === 'LOW') {
          dailyCounts[key].safe += 1;
        } else if (riskLevel === 'MEDIUM') {
          dailyCounts[key].suspicious += 1;
        } else {
          dailyCounts[key].malicious += 1;
        }
      }
    }

    const recentScansFormatted = Object.entries(dailyCounts).map(([date, counts]) => ({
      date,
      ...counts,
    }));

    const stats: Record<string, unknown> = {
      totalScans,
      maliciousCount,
      safeCount,
      suspiciousCount: Math.max(0, suspiciousCount),
      recentScans: recentScansFormatted,
    };

    // Admin-only system-wide stats
    if (session.role === 'ADMIN') {
      const totalUsers = await db.user.count();
      const activeUsers = await db.user.count({ where: { isActive: true } });

      // Users who scanned today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const activeToday = await db.scannedUrl.groupBy({
        by: ['userId'],
        where: {
          createdAt: { gte: today },
        },
      });

      const totalSystemScans = await db.scannedUrl.count();
      const totalMaliciousSystem = await db.scannedUrl.count({
        where: {
          result: { isMalicious: true },
        },
      });

      stats.systemStats = {
        totalUsers,
        activeUsers,
        activeUsersToday: activeToday.length,
        totalSystemScans,
        totalMaliciousSystem,
      };
    }

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
