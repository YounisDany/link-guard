import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { analyzeUrl, getTrustedDomainInfo } from '@/lib/url-analyzer';
import { analyzeSite, SiteAnalysis } from '@/lib/site-analyzer';

export async function POST(request: NextRequest) {
  try {
    const session = verifySession(request);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const trimmedUrl = url.trim();

    // Validate URL format
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      return NextResponse.json(
        { error: 'URL must start with http:// or https://' },
        { status: 400 }
      );
    }

    // Check if URL already scanned by this user (cache check)
    const existingScan = await db.scannedUrl.findFirst({
      where: {
        userId: session.userId,
        originalUrl: trimmedUrl,
      },
      include: {
        features: true,
        result: true,
      },
    });

    // Trusted-source check is deterministic from URL — derive once, reuse for both cache and fresh paths.
    const trustedInfo = getTrustedDomainInfo(trimmedUrl);
    const trustedSource = trustedInfo.trusted
      ? {
          type: trustedInfo.type as string,
          matchedDomain: trustedInfo.matchedDomain as string,
          label: trustedInfo.label as string,
        }
      : null;

    if (existingScan && existingScan.result) {
      // Parse siteAnalysis from cached result
      let siteAnalysis: SiteAnalysis | null = null;
      if (existingScan.result.siteAnalysis) {
        try {
          siteAnalysis = JSON.parse(existingScan.result.siteAnalysis) as SiteAnalysis;
        } catch {
          siteAnalysis = null;
        }
      }

      // For trusted domains, force the cached verdict to safe (the cache may pre-date the trust check).
      const cachedIsMalicious = trustedSource ? false : existingScan.result.isMalicious;
      const cachedThreatType = trustedSource ? null : existingScan.result.threatType;
      const cachedConfidenceScore = trustedSource ? 0 : existingScan.result.confidenceScore;
      const cachedRiskLevel = trustedSource ? 'LOW' : existingScan.result.riskLevel;

      return NextResponse.json({
        success: true,
        result: {
          id: existingScan.id,
          originalUrl: existingScan.originalUrl,
          domain: existingScan.domain,
          status: existingScan.status,
          createdAt: existingScan.createdAt,
          isMalicious: cachedIsMalicious,
          threatType: cachedThreatType,
          confidenceScore: cachedConfidenceScore,
          riskLevel: cachedRiskLevel,
          details: existingScan.result.details ? JSON.parse(existingScan.result.details) : [],
          recommendations: existingScan.result.recommendations ? JSON.parse(existingScan.result.recommendations) : [],
          features: existingScan.features
            ? {
                urlLength: existingScan.features.urlLength,
                domainLength: existingScan.features.domainLength,
                pathLength: existingScan.features.pathLength,
                pathDepth: existingScan.features.pathDepth,
                numDots: existingScan.features.numDots,
                numHyphens: existingScan.features.numHyphens,
                numUnderscores: existingScan.features.numUnderscores,
                numAtSymbols: existingScan.features.numAtSymbols,
                numSpecialChars: existingScan.features.numSpecialChars,
                hasIpAddress: existingScan.features.hasIpAddress,
                hasHttps: existingScan.features.hasHttps,
                numSubdomains: existingScan.features.numSubdomains,
                entropy: existingScan.features.entropy,
                numQueryParams: existingScan.features.numQueryParams,
                hasSuspiciousWords: existingScan.features.hasSuspiciousWords,
                numDigits: existingScan.features.numDigits,
                numRedirects: existingScan.features.numRedirects,
              }
            : null,
          processingTimeMs: existingScan.result.processingTimeMs,
          siteAnalysis: trustedSource ? null : siteAnalysis,
          trustedSource,
        },
        cached: true,
      });
    }

    // Step 1: Run URL heuristic analysis
    const analysisResult = analyzeUrl(trimmedUrl);

    // Step 2: Run deep site analysis — skipped entirely for trusted domains
    // (forces 100% safe verdict, avoids unnecessary outbound fetch).
    let siteAnalysis: SiteAnalysis | null = null;
    if (!trustedSource) {
      try {
        siteAnalysis = await analyzeSite(trimmedUrl);
      } catch (err) {
        console.error('Site analysis failed, continuing with URL-only analysis:', err);
      }
    }

    // Determine final risk level and malicious status using enhanced data if available
    let finalRiskLevel = analysisResult.riskLevel;
    let finalIsMalicious = analysisResult.isMalicious;
    let finalConfidenceScore = analysisResult.confidenceScore;
    let finalThreatType = analysisResult.threatType;
    let allDetails = [...analysisResult.details];
    let allRecommendations = [...analysisResult.recommendations];

    if (siteAnalysis) {
      // Use the enhanced overall risk level
      finalRiskLevel = siteAnalysis.overallRiskLevel;
      finalIsMalicious = finalRiskLevel === 'HIGH' || finalRiskLevel === 'CRITICAL';
      // Confidence based on combined analysis (higher confidence when both agree)
      const urlScore = analysisResult.confidenceScore;
      const siteSafetyScore = siteAnalysis.overallScore;
      finalConfidenceScore = Math.round((urlScore + (100 - siteSafetyScore)) / 2);
      finalConfidenceScore = Math.min(100, Math.max(0, finalConfidenceScore));

      // Merge threat types
      if (analysisResult.threatType && siteAnalysis.reputation.blacklisted) {
        finalThreatType = `${analysisResult.threatType} + ${siteAnalysis.reputation.blacklistSources[0] || 'Blacklisted'}`;
      } else if (siteAnalysis.reputation.blacklisted) {
        finalThreatType = 'Blacklisted Domain';
      }

      // Merge details with site analysis summary
      allDetails = [...analysisResult.details, ...siteAnalysis.summary];

      // Merge recommendations
      allRecommendations = [
        ...analysisResult.recommendations,
        ...siteAnalysis.recommendations,
      ];
    }

    // Trusted domains: hard-pin the final verdict to safe regardless of any other signals.
    if (trustedSource) {
      finalRiskLevel = 'LOW';
      finalIsMalicious = false;
      finalConfidenceScore = 0;
      finalThreatType = null;
    }

    // Extract domain and path info for storage
    let parsedDomain = '';
    let parsedPath = '';
    let parsedQueryParams = '';
    let protocol = 'https';
    try {
      const parsedUrl = new URL(trimmedUrl);
      parsedDomain = parsedUrl.hostname;
      parsedPath = parsedUrl.pathname || null;
      parsedQueryParams = parsedUrl.search || null;
      protocol = parsedUrl.protocol.replace(':', '');
    } catch {
      parsedDomain = trimmedUrl.replace(/https?:\/\//, '').split('/')[0];
    }

    // Save to database
    const scannedUrl = await db.scannedUrl.create({
      data: {
        originalUrl: trimmedUrl,
        domain: parsedDomain,
        protocol,
        path: parsedPath,
        queryParams: parsedQueryParams,
        userId: session.userId,
        status: 'COMPLETED',
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
            isMalicious: finalIsMalicious,
            threatType: finalThreatType,
            confidenceScore: finalConfidenceScore,
            riskLevel: finalRiskLevel,
            details: JSON.stringify(allDetails),
            recommendations: JSON.stringify(allRecommendations),
            processingTimeMs: analysisResult.processingTimeMs,
            siteAnalysis: siteAnalysis ? JSON.stringify(siteAnalysis) : null,
          },
        },
      },
      include: {
        features: true,
        result: true,
      },
    });

    // Log action
    await db.systemLog.create({
      data: {
        userId: session.userId,
        action: 'SCAN_URL',
        details: `Scanned URL: ${trimmedUrl} | Risk: ${finalRiskLevel} | Deep Analysis: ${siteAnalysis ? 'Yes' : 'No'}`,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      },
    });

    return NextResponse.json({
      success: true,
      result: {
        id: scannedUrl.id,
        originalUrl: scannedUrl.originalUrl,
        domain: scannedUrl.domain,
        status: scannedUrl.status,
        createdAt: scannedUrl.createdAt,
        isMalicious: finalIsMalicious,
        threatType: finalThreatType,
        confidenceScore: finalConfidenceScore,
        riskLevel: finalRiskLevel,
        details: allDetails,
        recommendations: allRecommendations,
        features: analysisResult.features,
        processingTimeMs: analysisResult.processingTimeMs,
        siteAnalysis,
        trustedSource,
      },
      cached: false,
    });
  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
