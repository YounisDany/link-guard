import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession, hashPassword } from '@/lib/auth';
import { analyzeUrl } from '@/lib/url-analyzer';

// Sample URLs with varied results
const SAMPLE_SCANS = [
  // Safe URLs
  { url: 'https://www.google.com', expectedLevel: 'LOW' },
  { url: 'https://github.com/openai', expectedLevel: 'LOW' },
  { url: 'https://stackoverflow.com/questions/12345', expectedLevel: 'LOW' },
  { url: 'https://www.microsoft.com/en-us/windows', expectedLevel: 'LOW' },
  { url: 'https://developer.mozilla.org/en-US/docs/Web', expectedLevel: 'LOW' },

  // Suspicious URLs
  { url: 'http://secure-login-verify-account.xyz/redirect', expectedLevel: 'MEDIUM' },
  { url: 'http://g00gle.com/search?q=free+stuff', expectedLevel: 'MEDIUM' },
  { url: 'http://amaz0n-deals.tk/special-offer?id=123', expectedLevel: 'MEDIUM' },
  { url: 'http://login-paypal-secure.netlify.app/signin', expectedLevel: 'MEDIUM' },
  { url: 'https://www.goog1e.com/account/verify', expectedLevel: 'MEDIUM' },

  // Malicious URLs
  { url: 'http://192.168.1.1:8080/login.php@paypal.com/secure', expectedLevel: 'CRITICAL' },
  { url: 'http://free-iphone-6-now.tk/claim?prize=winner', expectedLevel: 'HIGH' },
  { url: 'http://secure-banking-update.xyz/login/verify/account?redirect=true@bankofamerica.com', expectedLevel: 'CRITICAL' },
  { url: 'http://amaz0n-secure-login.tk/update-password/credential?alert=urgent', expectedLevel: 'CRITICAL' },
];

const DEMO_USERS = [
  {
    username: 'admin',
    email: 'admin@linkguard.com',
    password: 'admin123',
    fullName: 'System Administrator',
    role: 'ADMIN',
  },
  {
    username: 'security_analyst',
    email: 'analyst@linkguard.com',
    password: 'analyst123',
    fullName: 'Security Analyst',
    role: 'USER',
  },
  {
    username: 'demo_user',
    email: 'demo@linkguard.com',
    password: 'demo123',
    fullName: 'Demo User',
    role: 'USER',
  },
];

async function createScanForUser(userId: string, url: string, daysAgo: number) {
  const analysisResult = analyzeUrl(url);

  let parsedDomain = '';
  let parsedPath = '';
  let parsedQueryParams = '';
  let protocol = 'https';
  try {
    const parsedUrl = new URL(url);
    parsedDomain = parsedUrl.hostname;
    parsedPath = parsedUrl.pathname || null;
    parsedQueryParams = parsedUrl.search || null;
    protocol = parsedUrl.protocol.replace(':', '');
  } catch {
    parsedDomain = url.replace(/https?:\/\//, '').split('/')[0];
  }

  // Offset the createdAt
  const createdAt = new Date();
  createdAt.setDate(createdAt.getDate() - daysAgo);
  createdAt.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);

  const scan = await db.scannedUrl.create({
    data: {
      originalUrl: url,
      domain: parsedDomain,
      protocol,
      path: parsedPath,
      queryParams: parsedQueryParams,
      userId,
      status: 'COMPLETED',
      createdAt,
      features: {
        create: {
          urlLength: analysisResult.features.urlLength,
          domainLength: analysisResult.features.domainLength,
          pathLength: analysisResult.features.pathLength,
          pathDepth: analysisResult.features.pathDepth,
          numDots: analysisResult.features.numDots,
          numHyphens: analysisResult.features.numHyphens,
          numUnderscores: analysisResult.features.numUnderscores,
          numAtSymbols: analysisResult.features.numAtSymbols,
          numSpecialChars: analysisResult.features.numSpecialChars,
          hasIpAddress: analysisResult.features.hasIpAddress,
          hasHttps: analysisResult.features.hasHttps,
          numSubdomains: analysisResult.features.numSubdomains,
          entropy: analysisResult.features.entropy,
          numQueryParams: analysisResult.features.numQueryParams,
          hasSuspiciousWords: analysisResult.features.hasSuspiciousWords,
          numDigits: analysisResult.features.numDigits,
          numRedirects: analysisResult.features.numRedirects,
        },
      },
      result: {
        create: {
          isMalicious: analysisResult.isMalicious,
          threatType: analysisResult.threatType,
          confidenceScore: analysisResult.confidenceScore,
          riskLevel: analysisResult.riskLevel,
          details: JSON.stringify(analysisResult.details),
          recommendations: JSON.stringify(analysisResult.recommendations),
          processingTimeMs: analysisResult.processingTimeMs,
          createdAt,
        },
      },
    },
  });

  return scan;
}

export async function POST(request: NextRequest) {
  try {
    const session = verifySession(request);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    let seeded = 0;

    // Create demo users
    for (const demoUser of DEMO_USERS) {
      const existing = await db.user.findFirst({
        where: {
          OR: [{ username: demoUser.username }, { email: demoUser.email }],
        },
      });

      if (!existing) {
        const hashedPassword = await hashPassword(demoUser.password);
        await db.user.create({
          data: {
            username: demoUser.username,
            email: demoUser.email,
            password: hashedPassword,
            fullName: demoUser.fullName,
            role: demoUser.role,
          },
        });
        seeded += 1;
      }
    }

    // Get all user IDs for distributing scans
    const users = await db.user.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    if (users.length > 0) {
      // Distribute scans across users
      for (let i = 0; i < SAMPLE_SCANS.length; i++) {
        const sample = SAMPLE_SCANS[i];
        const user = users[i % users.length];
        const daysAgo = Math.floor(i * 0.5); // Spread over last week

        // Check if this URL already exists for this user
        const existing = await db.scannedUrl.findFirst({
          where: {
            userId: user.id,
            originalUrl: sample.url,
          },
        });

        if (!existing) {
          await createScanForUser(user.id, sample.url, daysAgo);
          seeded += 1;
        }
      }
    }

    // Create system logs for the seed action
    await db.systemLog.create({
      data: {
        userId: session.userId,
        action: 'SEED_DATA',
        details: `Admin seeded demo data. Total records created: ${seeded}`,
      },
    });

    return NextResponse.json({
      success: true,
      seeded,
      message: `Seeded ${seeded} new records (users and scan histories)`,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
