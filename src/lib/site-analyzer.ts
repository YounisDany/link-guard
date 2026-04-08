import { getUrlAnalysisScore, KNOWN_SAFE_DOMAINS } from './url-analyzer';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SiteAnalysis {
  // Website Content
  title: string | null;
  description: string | null;
  contentType: string;
  statusCode: number;
  responseTimeMs: number;

  // Permissions Analysis
  permissions: {
    cookies: { detected: boolean; details: string };
    geolocation: { detected: boolean; details: string };
    notifications: { detected: boolean; details: string };
    camera: { detected: boolean; details: string };
    microphone: { detected: boolean; details: string };
    clipboard: { detected: boolean; details: string };
    fullscreen: { detected: boolean; details: string };
    payment: { detected: boolean; details: string };
    popup: { detected: boolean; details: string };
    thirdPartyCookies: { detected: boolean; details: string };
  };
  permissionScore: number; // 0-100 (100 = most dangerous)

  // Security Headers
  securityHeaders: {
    contentSecurityPolicy: { present: boolean; value: string | null };
    xFrameOptions: { present: boolean; value: string | null };
    xContentTypeOptions: { present: boolean; value: string | null };
    xXSSProtection: { present: boolean; value: string | null };
    strictTransportSecurity: { present: boolean; value: string | null };
    referrerPolicy: { present: boolean; value: string | null };
    permissionsPolicy: { present: boolean; value: string | null };
  };
  securityHeaderScore: number; // 0-100 (100 = fully secure)

  // Script Analysis
  scripts: {
    totalScripts: number;
    inlineScripts: number;
    externalScripts: number;
    scripts: Array<{
      type: 'inline' | 'external';
      src: string | null;
      content: string | null;
      size: number;
      isSuspicious: boolean;
      reasons: string[];
      category: 'analytics' | 'advertising' | 'social' | 'tracking' | 'essential' | 'unknown' | 'suspicious';
    }>;
    suspiciousScripts: number;
    thirdPartyDomains: string[];
    hasObfuscatedCode: boolean;
    hasEvalUsage: boolean;
    hasDocumentWrite: boolean;
    hasUnsafePatterns: boolean;
    riskIndicators: string[];
  };
  scriptSafetyScore: number; // 0-100 (100 = safest)

  // Website Classification
  classification: {
    primaryType: string;
    secondaryTypes: string[];
    confidence: number;
    indicators: string[];
  };

  // Reputation Analysis
  reputation: {
    domainAge: string;
    sslCertificate: { valid: boolean; protocol: string; issuer: string | null };
    domainPopularity: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
    tldReputation: 'Trusted' | 'Neutral' | 'Suspicious' | 'Risky';
    backlinkEstimate: string;
    trafficEstimate: string;
    blacklisted: boolean;
    blacklistSources: string[];
  };
  reputationScore: number; // 0-100 (100 = most reputable)

  // Content Analysis
  content: {
    hasLoginForm: boolean;
    hasRegistrationForm: boolean;
    hasPaymentForm: boolean;
    hasSearchForm: boolean;
    hasSocialLinks: boolean;
    hasContactInfo: boolean;
    hasPrivacyPolicy: boolean;
    hasTermsOfService: boolean;
    language: string;
    frameworks: string[];
    metaRobots: string | null;
    openGraphTags: number;
    structuredData: boolean;
  };

  // Overall Assessment
  overallScore: number; // 0-100 (weighted average, 100 = safest)
  overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  summary: string[];
  recommendations: string[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const POPULAR_DOMAINS = [
  { domain: 'google.com', popularity: 100, category: 'technology' },
  { domain: 'youtube.com', popularity: 98, category: 'entertainment' },
  { domain: 'facebook.com', popularity: 97, category: 'social' },
  { domain: 'amazon.com', popularity: 96, category: 'e-commerce' },
  { domain: 'twitter.com', popularity: 95, category: 'social' },
  { domain: 'linkedin.com', popularity: 93, category: 'social' },
  { domain: 'netflix.com', popularity: 92, category: 'entertainment' },
  { domain: 'microsoft.com', popularity: 94, category: 'technology' },
  { domain: 'apple.com', popularity: 93, category: 'technology' },
  { domain: 'github.com', popularity: 90, category: 'technology' },
  { domain: 'stackoverflow.com', popularity: 88, category: 'technology' },
  { domain: 'wikipedia.org', popularity: 91, category: 'education' },
  { domain: 'reddit.com', popularity: 89, category: 'social' },
  { domain: 'instagram.com', popularity: 92, category: 'social' },
  { domain: 'spotify.com', popularity: 87, category: 'entertainment' },
  { domain: 'whatsapp.com', popularity: 90, category: 'social' },
  { domain: 'telegram.org', popularity: 85, category: 'social' },
  { domain: 'twitch.tv', popularity: 84, category: 'entertainment' },
  { domain: 'yahoo.com', popularity: 86, category: 'technology' },
  { domain: 'paypal.com', popularity: 88, category: 'finance' },
  { domain: 'ebay.com', popularity: 85, category: 'e-commerce' },
  { domain: 'stripe.com', popularity: 82, category: 'finance' },
  { domain: 'cloudflare.com', popularity: 83, category: 'technology' },
  { domain: 'vercel.com', popularity: 78, category: 'technology' },
  { domain: 'netlify.com', popularity: 75, category: 'technology' },
  { domain: 'medium.com', popularity: 80, category: 'blog' },
  { domain: 'wordpress.org', popularity: 82, category: 'technology' },
  { domain: 'shopify.com', popularity: 81, category: 'e-commerce' },
  { domain: 'dropbox.com', popularity: 79, category: 'technology' },
  { domain: 'slack.com', popularity: 80, category: 'technology' },
  { domain: 'zoom.us', popularity: 84, category: 'technology' },
  { domain: 'trello.com', popularity: 72, category: 'technology' },
  { domain: 'notion.so', popularity: 77, category: 'technology' },
  { domain: 'figma.com', popularity: 76, category: 'technology' },
  { domain: 'docs.google.com', popularity: 90, category: 'technology' },
  { domain: 'drive.google.com', popularity: 90, category: 'technology' },
  { domain: 'mail.google.com', popularity: 90, category: 'technology' },
  { domain: 'maps.google.com', popularity: 88, category: 'technology' },
  { domain: 'outlook.com', popularity: 85, category: 'technology' },
  { domain: 'office.com', popularity: 84, category: 'technology' },
  { domain: 'npmjs.com', popularity: 78, category: 'technology' },
  { domain: 'pypi.org', popularity: 75, category: 'technology' },
  { domain: 'mozilla.org', popularity: 80, category: 'technology' },
  { domain: 'w3schools.com', popularity: 78, category: 'education' },
  { domain: 'mozilla.org', popularity: 80, category: 'technology' },
  { domain: 'adobe.com', popularity: 86, category: 'technology' },
  { domain: 'salesforce.com', popularity: 80, category: 'technology' },
  { domain: 'hubspot.com', popularity: 78, category: 'technology' },
];

const SUSPICIOUS_TLDS = ['tk', 'ml', 'ga', 'cf', 'gq', 'pp.ua'];

const TRUSTED_TLDS = ['gov', 'edu', 'mil', 'int'];

const SUSPICIOUS_KEYWORDS_IN_HTML = [
  'free bitcoin',
  'click here to verify',
  'your account has been suspended',
  'congratulations you won',
  'limited time offer',
  'verify your identity',
  'act now',
  'you have been selected',
  'urgent action required',
  'confirm your account immediately',
  'your password expires',
  'winner notification',
  'claim your prize',
  'risk-free investment',
  '100% guaranteed',
];

// ─── Main Entry Point ────────────────────────────────────────────────────────

export async function analyzeSite(url: string): Promise<SiteAnalysis> {
  // Fetch website content
  const fetchResult = await fetchWebsiteContent(url);

  const html = fetchResult.html;
  const headers = fetchResult.headers;
  const statusCode = fetchResult.statusCode;
  const responseTimeMs = fetchResult.responseTimeMs;

  // Extract domain from URL
  let hostname = '';
  let protocol = 'http';
  try {
    const parsed = new URL(url);
    hostname = parsed.hostname.replace(/^www\./, '');
    protocol = parsed.protocol.replace(':', '');
  } catch {
    hostname = url.replace(/https?:\/\//, '').split('/')[0];
  }

  // Run all analyses
  const title = html ? extractTitle(html) : null;
  const description = html ? extractMetaDescription(html) : null;
  const contentType = headers['content-type'] || 'unknown';
  const securityHeaders = analyzeSecurityHeaders(headers);
  const securityHeaderScore = calculateSecurityHeaderScore(securityHeaders);
  const permissions = html ? analyzePermissions(html, headers) : buildEmptyPermissions();
  const permissionScore = calculatePermissionScore(permissions);
  const scriptAnalysis = html ? analyzeScripts(html, hostname) : buildEmptyScripts();
  const scriptSafetyScore = calculateScriptSafetyScore(scriptAnalysis);
  const classification = html ? classifyWebsite(html, url, hostname) : classifyByDomain(url, hostname);
  const reputation = analyzeReputation(url, hostname, protocol);
  const reputationScore = calculateReputationScore(reputation, hostname);
  const content = html ? analyzeContent(html) : buildEmptyContent();

  // Get URL heuristic score
  const urlAnalysis = getUrlAnalysisScore(url);
  const urlAnalysisScore = 100 - urlAnalysis.score; // Invert: lower risk = higher safety

  // Calculate content score
  const contentScore = calculateContentScore(content, classification, hostname);

  // Calculate overall score (weighted average, 100 = safest)
  const overallScore = Math.round(
    urlAnalysisScore * 0.25 +
    (100 - permissionScore) * 0.10 +
    securityHeaderScore * 0.15 +
    scriptSafetyScore * 0.20 +
    reputationScore * 0.20 +
    contentScore * 0.10
  );

  // Determine overall risk level (inverted: lower score = higher risk)
  const overallRiskLevel = getOverallRiskLevel(overallScore);

  // Generate summary and recommendations
  const summary = generateSummary(
    urlAnalysis,
    permissions,
    securityHeaders,
    scriptAnalysis,
    classification,
    reputation,
    content,
    html,
    statusCode,
    responseTimeMs,
    title
  );

  const recommendations = generateRecommendations(
    securityHeaders,
    permissions,
    scriptAnalysis,
    content,
    reputation,
    overallRiskLevel
  );

  return {
    title,
    description,
    contentType,
    statusCode,
    responseTimeMs,
    permissions,
    permissionScore,
    securityHeaders,
    securityHeaderScore,
    scripts: scriptAnalysis,
    scriptSafetyScore,
    classification,
    reputation,
    reputationScore,
    content,
    overallScore,
    overallRiskLevel,
    summary,
    recommendations,
  };
}

// ─── Website Fetching ────────────────────────────────────────────────────────

async function fetchWebsiteContent(
  url: string
): Promise<{
  html: string | null;
  headers: Record<string, string>;
  statusCode: number;
  responseTimeMs: number;
}> {
  const startTime = Date.now();
  const headers: Record<string, string> = {};

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const responseTimeMs = Date.now() - startTime;

    // Collect response headers
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const contentType = headers['content-type'] || '';
    const isHtml =
      contentType.includes('text/html') ||
      contentType.includes('application/xhtml');

    if (!isHtml) {
      return { html: null, headers, statusCode: response.status, responseTimeMs };
    }

    // Limit HTML size to 2MB to avoid memory issues
    const html = await response.text();
    const truncated = html.length > 2_000_000 ? html.slice(0, 2_000_000) : html;

    return { html: truncated, headers, statusCode: response.status, responseTimeMs };
  } catch (error: unknown) {
    const responseTimeMs = Date.now() - startTime;
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { html: null, headers, statusCode: 0, responseTimeMs };
    }
    return { html: null, headers, statusCode: 0, responseTimeMs };
  }
}

// ─── HTML Extraction Helpers ─────────────────────────────────────────────────

function extractTitle(html: string): string | null {
  // Match <title>...</title>
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    const title = titleMatch[1].trim().replace(/\s+/g, ' ');
    return title.length > 200 ? title.slice(0, 200) : title;
  }
  return null;
}

function extractMetaDescription(html: string): string | null {
  const descMatch = html.match(
    /<meta[^>]*name\s*=\s*["']description["'][^>]*content\s*=\s*["']([^"']*)["'][^>]*\/?>/i
  ) || html.match(
    /<meta[^>]*content\s*=\s*["']([^"']*)["'][^>]*name\s*=\s*["']description["'][^>]*\/?>/i
  );
  if (descMatch && descMatch[1]) {
    const desc = descMatch[1].trim().replace(/\s+/g, ' ');
    return desc.length > 500 ? desc.slice(0, 500) : desc;
  }
  return null;
}

function extractMetaRobots(html: string): string | null {
  const match = html.match(
    /<meta[^>]*name\s*=\s*["']robots["'][^>]*content\s*=\s*["']([^"']*)["'][^>]*\/?>/i
  ) || html.match(
    /<meta[^>]*content\s*=\s*["']([^"']*)["'][^>]*name\s*=\s*["']robots["'][^>]*\/?>/i
  );
  return match ? match[1].trim() : null;
}

function extractLanguage(html: string): string {
  const langMatch = html.match(/<html[^>]*lang\s*=\s*["']([^"']+)["']/i);
  if (langMatch) return langMatch[1].split('-')[0].toLowerCase();
  return 'en';
}

// ─── Security Headers Analysis ───────────────────────────────────────────────

function analyzeSecurityHeaders(
  headers: Record<string, string>
): SiteAnalysis['securityHeaders'] {
  const toLower = (obj: Record<string, string>) => {
    const result: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj)) {
      result[k.toLowerCase()] = v;
    }
    return result;
  };
  const h = toLower(headers);

  return {
    contentSecurityPolicy: {
      present: !!h['content-security-policy'],
      value: h['content-security-policy'] || null,
    },
    xFrameOptions: {
      present: !!h['x-frame-options'],
      value: h['x-frame-options'] || null,
    },
    xContentTypeOptions: {
      present: !!h['x-content-type-options'],
      value: h['x-content-type-options'] || null,
    },
    xXSSProtection: {
      present: !!h['x-xss-protection'],
      value: h['x-xss-protection'] || null,
    },
    strictTransportSecurity: {
      present: !!h['strict-transport-security'],
      value: h['strict-transport-security'] || null,
    },
    referrerPolicy: {
      present: !!h['referrer-policy'],
      value: h['referrer-policy'] || null,
    },
    permissionsPolicy: {
      present: !!h['permissions-policy'],
      value: h['permissions-policy'] || null,
    },
  };
}

function calculateSecurityHeaderScore(
  sh: SiteAnalysis['securityHeaders']
): number {
  // Each header contributes roughly equally to the score
  // CSP is worth more
  const weights: Record<keyof SiteAnalysis['securityHeaders'], number> = {
    contentSecurityPolicy: 20,
    xFrameOptions: 15,
    xContentTypeOptions: 12,
    xXSSProtection: 10,
    strictTransportSecurity: 18,
    referrerPolicy: 10,
    permissionsPolicy: 15,
  };

  let score = 0;
  for (const [key, info] of Object.entries(sh)) {
    if (info.present) {
      score += weights[key as keyof typeof sh];
    }
  }
  return Math.min(100, score);
}

// ─── Permissions Analysis ────────────────────────────────────────────────────

function analyzePermissions(
  html: string,
  headers: Record<string, string>
): SiteAnalysis['permissions'] {
  const lowerHtml = html.toLowerCase();

  const cookies = {
    detected:
      /document\.cookie/i.test(html) ||
      /set-cookie/i.test(Object.keys(headers).join(' ')) ||
      /cookie/i.test(lowerHtml) &&
        (documentCookiePatterns().some((p) => p.test(html))),
    details: '',
  };
  if (cookies.detected) {
    const sources: string[] = [];
    if (/document\.cookie/i.test(html)) sources.push('document.cookie access');
    if (/set-cookie/i.test(Object.keys(headers).join(' '))) sources.push('Set-Cookie response header');
    if (/cookie/i.test(lowerHtml)) sources.push('cookie-related references in code');
    cookies.details = `Cookie usage detected: ${sources.join(', ')}`;
  } else {
    cookies.details = 'No cookie usage detected';
  }

  const geolocation = detectPermission(lowerHtml, [
    /navigator\.geolocation/i,
    /geolocation\s*api/i,
  ], 'Geolocation API access');

  const notifications = detectPermission(lowerHtml, [
    /notification\.requestpermission/i,
    /new\s+notification\s*\(/i,
    /notificationpermission/i,
  ], 'Browser notification request');

  const camera = detectPermission(lowerHtml, [
    /getusermedia[^)]*video/i,
    /navigator\.mediadevices[^)]*video/i,
    /mediadevices\.getusermedia/i,
  ], 'Camera access request');

  const microphone = detectPermission(lowerHtml, [
    /getusermedia[^)]*audio/i,
    /navigator\.mediadevices[^)]*audio/i,
  ], 'Microphone access request');

  const clipboard = detectPermission(lowerHtml, [
    /navigator\.clipboard/i,
    /document\.execcommand\s*\(\s*['"]copy['"]\s*\)/i,
    /document\.execcommand\s*\(\s*['"]paste['"]\s*\)/i,
    /document\.execcommand\s*\(\s*['"]cut['"]\s*\)/i,
  ], 'Clipboard read/write access');

  const fullscreen = detectPermission(lowerHtml, [
    /requestfullscreen/i,
    /exitfullscreen/i,
    /webkitrequestfullscreen/i,
  ], 'Fullscreen mode request');

  const payment = detectPermission(lowerHtml, [
    /new\s+paymentrequest\s*\(/i,
    /paymentrequest\s+api/i,
    /payment\s+method/i,
  ], 'Payment API usage');

  const popup = detectPermission(lowerHtml, [
    /window\.open\s*\(/i,
    /window\.open\s*\n/i,
  ], 'Popup window opening');

  const thirdPartyCookies = detectPermission(lowerHtml, [
    /third.?party.?cookie/i,
    /cross.?domain.?cookie/i,
    /cookie\s*domain/i,
  ], 'Third-party cookie patterns');

  return { cookies, geolocation, notifications, camera, microphone, clipboard, fullscreen, payment, popup, thirdPartyCookies };
}

function documentCookiePatterns(): RegExp[] {
  return [/document\.cookie/i];
}

function detectPermission(
  lowerHtml: string,
  patterns: RegExp[],
  desc: string
): { detected: boolean; details: string } {
  const matched = patterns.filter((p) => p.test(lowerHtml));
  return {
    detected: matched.length > 0,
    details: matched.length > 0 ? `${desc} detected in page source` : `No ${desc.toLowerCase()} detected`,
  };
}

function calculatePermissionScore(
  perms: SiteAnalysis['permissions']
): number {
  // Each sensitive permission adds to danger score
  const weights = {
    cookies: 10,
    geolocation: 15,
    notifications: 5,
    camera: 20,
    microphone: 20,
    clipboard: 15,
    fullscreen: 5,
    payment: 15,
    popup: 10,
    thirdPartyCookies: 10,
  };

  let score = 0;
  for (const [key, info] of Object.entries(perms)) {
    if (info.detected) {
      score += weights[key as keyof typeof weights] || 10;
    }
  }
  return Math.min(100, score);
}

// ─── Script Analysis ─────────────────────────────────────────────────────────

interface ScriptInfo {
  type: 'inline' | 'external';
  src: string | null;
  content: string | null;
  size: number;
  isSuspicious: boolean;
  reasons: string[];
  category:
    | 'analytics'
    | 'advertising'
    | 'social'
    | 'tracking'
    | 'essential'
    | 'unknown'
    | 'suspicious';
}

function analyzeScripts(
  html: string,
  currentHostname: string
): SiteAnalysis['scripts'] {
  const scripts: ScriptInfo[] = [];
  const thirdPartyDomains = new Set<string>();
  let suspiciousScripts = 0;
  let hasObfuscatedCode = false;
  let hasEvalUsage = false;
  let hasDocumentWrite = false;
  const allRiskIndicators: string[] = [];

  // Extract all script tags
  const scriptTagRegex = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = scriptTagRegex.exec(html)) !== null) {
    const attrs = match[1];
    const content = match[2].trim();

    // Skip non-JS scripts (JSON-LD, import maps, etc.)
    const typeMatch = attrs.match(/type\s*=\s*["']([^"']+)["']/i);
    if (typeMatch) {
      const scriptType = typeMatch[1].toLowerCase();
      if (
        scriptType !== 'text/javascript' &&
        scriptType !== 'application/javascript' &&
        scriptType !== 'module' &&
        scriptType !== '' &&
        scriptType !== 'text/ecmascript'
      ) {
        continue;
      }
    }

    // Skip async/defer external-only scripts that have no inline content
    const srcMatch = attrs.match(/src\s*=\s*["']([^"']+)["']/i);

    if (srcMatch) {
      const src = srcMatch[1];
      const size = src.length;
      let scriptHostname = '';

      try {
        const scriptUrl = new URL(src, `https://${currentHostname}`);
        scriptHostname = scriptUrl.hostname.replace(/^www\./, '');
      } catch {
        scriptHostname = src.split('/')[0];
      }

      const isThirdParty = scriptHostname !== currentHostname && scriptHostname !== '';
      if (isThirdParty && scriptHostname) {
        thirdPartyDomains.add(scriptHostname);
      }

      const { category, isSuspicious, reasons } = categorizeScript(
        src,
        '',
        scriptHostname,
        isThirdParty,
        size
      );

      if (isSuspicious) suspiciousScripts++;
      if (reasons.some((r) => r.toLowerCase().includes('obfuscated'))) hasObfuscatedCode = true;

      scripts.push({
        type: 'external',
        src,
        content: null,
        size,
        isSuspicious,
        reasons,
        category,
      });
    } else if (content) {
      const size = content.length;
      const { category, isSuspicious, reasons } = categorizeScript(
        '',
        content,
        '',
        false,
        size
      );

      if (isSuspicious) suspiciousScripts++;
      if (/eval\s*\(/i.test(content)) hasEvalUsage = true;
      if (/document\.write\s*\(/i.test(content)) hasDocumentWrite = true;
      if (reasons.some((r) => r.toLowerCase().includes('obfuscated'))) hasObfuscatedCode = true;

      // Collect risk indicators
      for (const reason of reasons) {
        if (!allRiskIndicators.includes(reason)) {
          allRiskIndicators.push(reason);
        }
      }

      scripts.push({
        type: 'inline',
        src: null,
        content: content.length > 500 ? content.slice(0, 500) : content,
        size,
        isSuspicious,
        reasons,
        category,
      });
    }
  }

  const inlineScripts = scripts.filter((s) => s.type === 'inline').length;
  const externalScripts = scripts.filter((s) => s.type === 'external').length;
  const hasUnsafePatterns = hasEvalUsage || hasDocumentWrite || hasObfuscatedCode;

  return {
    totalScripts: scripts.length,
    inlineScripts,
    externalScripts,
    scripts,
    suspiciousScripts,
    thirdPartyDomains: Array.from(thirdPartyDomains),
    hasObfuscatedCode,
    hasEvalUsage,
    hasDocumentWrite,
    hasUnsafePatterns,
    riskIndicators: allRiskIndicators,
  };
}

function categorizeScript(
  src: string,
  content: string,
  hostname: string,
  isThirdParty: boolean,
  size: number
): {
  category: ScriptInfo['category'];
  isSuspicious: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  let category: ScriptInfo['category'] = 'unknown';
  const lowerSrc = src.toLowerCase();
  const lowerContent = content.toLowerCase();

  // Analytics
  const analyticsPatterns = [
    'google-analytics', 'gtag', 'ga.js', 'analytics.js',
    'matomo', 'hotjar', 'mixpanel', 'amplitude', 'segment',
    'plausible', 'umami', 'goatcounter', 'counter', 'statcounter',
  ];
  if (analyticsPatterns.some((p) => lowerSrc.includes(p) || lowerContent.includes(p))) {
    category = 'analytics';
  }

  // Advertising
  const adPatterns = [
    'doubleclick', 'googlesyndication', 'adsense', 'adwords',
    'facebook pixel', 'fbq(', 'adsbygoogle', 'amazon-adsystem',
    'taboola', 'outbrain', 'popads', 'propellerads',
  ];
  if (adPatterns.some((p) => lowerSrc.includes(p) || lowerContent.includes(p))) {
    category = 'advertising';
  }

  // Social
  const socialPatterns = [
    'facebook.com', 'twitter.com', 'linkedin.com',
    'sharethis', 'addthis', 'disqus', 'connect.facebook',
    'platform.twitter', 'assets.pinterest',
  ];
  if (socialPatterns.some((p) => lowerSrc.includes(p))) {
    category = 'social';
  }

  // Essential frameworks
  const essentialPatterns = [
    'react', 'vue', 'angular', 'jquery', 'bootstrap',
    'tailwind', 'next.js', 'nextjs', 'nuxt', 'svelte',
    'polyfill', 'core-js', 'babel', 'webpack',
  ];
  if (essentialPatterns.some((p) => lowerSrc.includes(p) || lowerContent.includes(p))) {
    if (category === 'unknown') category = 'essential';
  }

  // Tracking
  const trackingPatterns = [
    'fingerprint', 'canvas fingerprint', 'webgl fingerprint',
    'beacon', 'pixel', 'tracker', 'criteo', 'quantcast',
  ];
  if (trackingPatterns.some((p) => lowerSrc.includes(p) || lowerContent.includes(p))) {
    if (category === 'unknown') category = 'tracking';
  }

  // Suspicious pattern detection in content
  let isSuspicious = false;

  if (/eval\s*\(/i.test(content)) {
    isSuspicious = true;
    reasons.push('Uses eval() for dynamic code execution');
  }
  if (/document\.write\s*\(/i.test(content)) {
    isSuspicious = true;
    reasons.push('Uses document.write() for DOM injection');
  }
  if (/Function\s*\(/i.test(content)) {
    isSuspicious = true;
    reasons.push('Uses Function() constructor for dynamic functions');
  }
  if (/\batob\s*\(/i.test(content) || /\bbtoa\s*\(/i.test(content)) {
    isSuspicious = true;
    reasons.push('Uses base64 encoding/decoding (possible obfuscation)');
  }
  if (/String\.fromCharCode\s*\(/i.test(content)) {
    isSuspicious = true;
    reasons.push('Uses String.fromCharCode() (character code obfuscation)');
  }
  if (/\bescape\s*\(/i.test(content) || /\bunescape\s*\(/i.test(content)) {
    isSuspicious = true;
    reasons.push('Uses escape/unescape (URL encoding tricks)');
  }
  if (/\\x[0-9a-f]{2}/i.test(content) && content.length > 500) {
    isSuspicious = true;
    hasObfuscation(reasons);
  }
  if (/\\u[0-9a-f]{4}/i.test(content) && content.length > 500) {
    isSuspicious = true;
    reasons.push('Contains excessive unicode escape sequences');
  }
  if (/innerHTML\s*[\s]*[+=]/i.test(content)) {
    isSuspicious = true;
    reasons.push('Uses innerHTML assignment (potential XSS vector)');
  }
  if (/window\.location\s*[\s]*=/i.test(content)) {
    isSuspicious = true;
    reasons.push('Modifies window.location (potential redirect)');
  }
  if (/setTimeout\s*\(\s*["']/i.test(content)) {
    isSuspicious = true;
    reasons.push('Uses setTimeout with string argument (code injection risk)');
  }
  if (/setInterval\s*\(\s*["']/i.test(content)) {
    isSuspicious = true;
    reasons.push('Uses setInterval with string argument (code injection risk)');
  }
  if (size > 5000 && !src) {
    isSuspicious = true;
    reasons.push(`Large inline script (${size} chars) may contain hidden logic`);
  }

  // Check for suspicious TLDs
  if (hostname) {
    const domainParts = hostname.split('.');
    const tld = domainParts[domainParts.length - 1];
    if (SUSPICIOUS_TLDS.includes(tld)) {
      isSuspicious = true;
      category = 'suspicious';
      reasons.push(`Script loaded from suspicious TLD: .${tld}`);
    }
  }

  // Very long minified scripts from unknown third-party domains
  if (isThirdParty && size > 100000 && category === 'unknown') {
    isSuspicious = true;
    reasons.push('Large unknown third-party script');
  }

  if (isSuspicious && category === 'unknown') {
    category = 'suspicious';
  }

  return { category, isSuspicious, reasons };
}

function hasObfuscation(reasons: string[]): void {
  reasons.push('Contains excessive hex escape sequences (obfuscation)');
}

function calculateScriptSafetyScore(
  scripts: SiteAnalysis['scripts']
): number {
  let score = 100; // Start at safest

  // Deduct for suspicious scripts
  score -= scripts.suspiciousScripts * 15;

  // Deduct for unsafe patterns
  if (scripts.hasEvalUsage) score -= 15;
  if (scripts.hasDocumentWrite) score -= 15;
  if (scripts.hasObfuscatedCode) score -= 20;
  if (scripts.hasUnsafePatterns) score -= 10;

  // Deduct for third-party domains
  score -= scripts.thirdPartyDomains.length * 3;

  // Deduct for high script count (over 20 is unusual)
  if (scripts.totalScripts > 20) {
    score -= (scripts.totalScripts - 20) * 2;
  }

  // Cap deductions: no negative
  return Math.max(0, Math.min(100, score));
}

// ─── Website Classification ──────────────────────────────────────────────────

interface CategoryDef {
  name: string;
  keywords: string[];
  urlPatterns: RegExp[];
}

const CATEGORIES: CategoryDef[] = [
  {
    name: 'E-Commerce',
    keywords: [
      'cart', 'shop', 'buy', 'price', 'product', 'order', 'checkout',
      'add to cart', 'payment', 'shopping', 'store', 'purchase', 'deal',
      'discount', 'coupon', 'shipping', 'wishlist',
    ],
    urlPatterns: [/shop/i, /store/i, /cart/i, /buy/i, /ecommerce/i, /market/i],
  },
  {
    name: 'Social Media',
    keywords: [
      'share', 'follow', 'friend', 'post', 'comment', 'like', 'profile',
      'message', 'feed', 'timeline', 'follower', 'following', 'tweet',
      'retweet', 'status update',
    ],
    urlPatterns: [/social/i, /community/i, /forum/i, /group/i],
  },
  {
    name: 'News/Media',
    keywords: [
      'news', 'article', 'breaking', 'report', 'journalist', 'opinion',
      'editorial', 'press', 'headline', 'current affairs', 'featured',
    ],
    urlPatterns: [/news/i, /media/i, /press/i, /journal/i, /gazette/i],
  },
  {
    name: 'Banking/Finance',
    keywords: [
      'bank', 'loan', 'credit', 'mortgage', 'account balance', 'transfer',
      'investment', 'portfolio', 'interest rate', 'deposit', 'withdrawal',
      'insurance', 'trading', 'stock', 'forex',
    ],
    urlPatterns: [/bank/i, /finance/i, /credit/i, /loan/i, /invest/i, /trade/i],
  },
  {
    name: 'Government',
    keywords: [
      'government', 'ministry', 'official', 'citizen', 'public service',
      'legislation', 'policy', 'regulation', 'federal', 'state department',
    ],
    urlPatterns: [/\.gov/i, /government/i, /ministry/i],
  },
  {
    name: 'Education',
    keywords: [
      'university', 'school', 'course', 'learn', 'student', 'academic',
      'lecture', 'degree', 'curriculum', 'faculty', 'scholarship',
      'research', 'campus', 'education', 'training',
    ],
    urlPatterns: [/\.edu/i, /university/i, /school/i, /academy/i, /learn/i, /course/i],
  },
  {
    name: 'Technology',
    keywords: [
      'tech', 'software', 'developer', 'api', 'cloud', 'startup', 'code',
      'programming', 'open source', 'deploy', 'infrastructure', 'database',
      'algorithm', 'machine learning', 'artificial intelligence',
    ],
    urlPatterns: [/tech/i, /dev/i, /code/i, /software/i, /api/i, /cloud/i, /hack/i],
  },
  {
    name: 'Healthcare',
    keywords: [
      'health', 'medical', 'doctor', 'hospital', 'clinic', 'treatment',
      'patient', 'diagnosis', 'symptom', 'prescription', 'pharmacy',
      'wellness', 'dental', 'therapy',
    ],
    urlPatterns: [/health/i, /medical/i, /doctor/i, /hospital/i, /clinic/i],
  },
  {
    name: 'Entertainment',
    keywords: [
      'movie', 'music', 'game', 'video', 'stream', 'play', 'entertainment',
      'show', 'episode', 'season', 'album', 'song', 'concert', 'theater',
    ],
    urlPatterns: [/movie/i, /music/i, /game/i, /video/i, /stream/i, /play/i, /tv/i],
  },
  {
    name: 'Blog/Personal',
    keywords: [
      'blog', 'post', 'author', 'personal', 'portfolio', 'about me',
      'diary', 'journal', 'story', 'thoughts', 'writing',
    ],
    urlPatterns: [/blog/i, /diary/i, /journal/i, /portfolio/i],
  },
  {
    name: 'Phishing/Suspicious',
    keywords: [
      'login verify', 'secure account', 'confirm password', 'update suspend',
      'verify identity', 'account suspended', 'unusual activity',
      'restore access', 'recover account',
    ],
    urlPatterns: [/verify-account/i, /secure-login/i, /account-verify/i],
  },
  {
    name: 'Corporate',
    keywords: [
      'company', 'business', 'enterprise', 'about us', 'careers',
      'services', 'solutions', 'clients', 'partners', 'team',
      'leadership', 'investors', 'corporate',
    ],
    urlPatterns: [/corp/i, /enterprise/i, /business/i, /company/i],
  },
];

function classifyWebsite(
  html: string,
  url: string,
  hostname: string
): SiteAnalysis['classification'] {
  const scores = new Map<string, number>();
  const indicators = new Map<string, string[]>();

  const lowerHtml = html.toLowerCase();
  const lowerUrl = url.toLowerCase();
  const lowerHostname = hostname.toLowerCase();

  // Check each category
  for (const cat of CATEGORIES) {
    let catScore = 0;
    const catIndicators: string[] = [];

    // Check keywords in HTML content
    for (const kw of cat.keywords) {
      const regex = new RegExp(`\\b${escapeRegex(kw)}\\b`, 'i');
      if (regex.test(lowerHtml)) {
        catScore += 2;
        catIndicators.push(`Keyword "${kw}" found in page content`);
      }
    }

    // Check URL patterns
    for (const pattern of cat.urlPatterns) {
      if (pattern.test(lowerUrl)) {
        catScore += 3;
        catIndicators.push(`URL matches pattern: ${pattern.source}`);
      }
    }

    // Check title
    const title = extractTitle(html);
    if (title) {
      const lowerTitle = title.toLowerCase();
      for (const kw of cat.keywords) {
        if (lowerTitle.includes(kw.toLowerCase())) {
          catScore += 4;
          catIndicators.push(`Title contains "${kw}"`);
        }
      }
    }

    // Check meta description
    const desc = extractMetaDescription(html);
    if (desc) {
      const lowerDesc = desc.toLowerCase();
      for (const kw of cat.keywords) {
        if (lowerDesc.includes(kw.toLowerCase())) {
          catScore += 3;
          catIndicators.push(`Meta description contains "${kw}"`);
        }
      }
    }

    if (catScore > 0) {
      scores.set(cat.name, catScore);
      indicators.set(cat.name, catIndicators);
    }
  }

  // Special check for .gov and .edu TLDs
  const domainParts = lowerHostname.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (tld === 'gov' && (scores.get('Government') || 0) < 5) {
    scores.set('Government', 10);
    indicators.set('Government', ['Domain uses .gov TLD']);
  }
  if (tld === 'edu' && (scores.get('Education') || 0) < 5) {
    scores.set('Education', 10);
    indicators.set('Education', ['Domain uses .edu TLD']);
  }

  // Determine primary and secondary types
  const sorted = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);
  const primaryType = sorted.length > 0 ? sorted[0][0] : 'Other';
  const secondaryTypes = sorted.slice(1, 4).map(([name]) => name);
  const primaryIndicators = indicators.get(primaryType) || [];

  // Confidence based on score gap
  let confidence = 30;
  if (sorted.length > 0) {
    confidence = Math.min(95, 30 + sorted[0][1] * 3);
    if (sorted.length > 1 && sorted[0][1] > sorted[1][1] * 2) {
      confidence = Math.min(95, confidence + 10);
    }
  }

  return {
    primaryType,
    secondaryTypes,
    confidence,
    indicators: primaryIndicators,
  };
}

function classifyByDomain(
  url: string,
  hostname: string
): SiteAnalysis['classification'] {
  const domainParts = hostname.split('.');
  const tld = domainParts[domainParts.length - 1];

  if (tld === 'gov') return { primaryType: 'Government', secondaryTypes: [], confidence: 60, indicators: ['.gov TLD detected'] };
  if (tld === 'edu') return { primaryType: 'Education', secondaryTypes: [], confidence: 60, indicators: ['.edu TLD detected'] };
  if (tld === 'mil') return { primaryType: 'Government', secondaryTypes: [], confidence: 60, indicators: ['.mil TLD detected'] };

  return { primaryType: 'Other', secondaryTypes: [], confidence: 20, indicators: ['Could not classify — website could not be fetched'] };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Reputation Analysis ─────────────────────────────────────────────────────

function analyzeReputation(
  url: string,
  hostname: string,
  protocol: string
): SiteAnalysis['reputation'] {
  const domainParts = hostname.split('.');
  const tld = domainParts[domainParts.length - 1];

  // TLD Reputation
  let tldReputation: SiteAnalysis['reputation']['tldReputation'] = 'Neutral';
  if (TRUSTED_TLDS.includes(tld)) {
    tldReputation = 'Trusted';
  } else if (['info', 'biz', 'xyz', 'top', 'click', 'online', 'site', 'website', 'icu', 'buzz', 'club'].includes(tld)) {
    tldReputation = 'Suspicious';
  } else if (SUSPICIOUS_TLDS.includes(tld) || ['ru', 'cn'].includes(tld)) {
    tldReputation = 'Risky';
  }

  // Domain Age estimation (heuristic)
  const domainAge = estimateDomainAge(hostname, tld);

  // SSL Certificate
  const sslCertificate = {
    valid: protocol === 'https',
    protocol: protocol === 'https' ? 'TLS' : 'None',
    issuer: protocol === 'https' ? 'Standard SSL/TLS' : null,
  };

  // Domain Popularity
  const popularityEntry = POPULAR_DOMAINS.find(
    (d) => hostname === d.domain || hostname.endsWith('.' + d.domain)
  );
  let domainPopularity: SiteAnalysis['reputation']['domainPopularity'] = 'Very Low';
  if (popularityEntry) {
    if (popularityEntry.popularity >= 95) domainPopularity = 'Very High';
    else if (popularityEntry.popularity >= 85) domainPopularity = 'High';
    else if (popularityEntry.popularity >= 70) domainPopularity = 'Medium';
    else domainPopularity = 'Low';
  }

  // Backlink and traffic estimates
  const { backlinkEstimate, trafficEstimate } = estimateTrafficAndBacklinks(
    popularityEntry,
    domainPopularity
  );

  // Blacklist check
  const { blacklisted, blacklistSources } = checkBlacklists(url, hostname);

  return {
    domainAge,
    sslCertificate,
    domainPopularity,
    tldReputation,
    backlinkEstimate,
    trafficEstimate,
    blacklisted,
    blacklistSources,
  };
}

function estimateDomainAge(
  hostname: string,
  tld: string
): string {
  // Heuristic based on domain patterns
  const isKnownSafe = KNOWN_SAFE_DOMAINS.some(
    (d) => hostname === d || hostname.endsWith('.' + d)
  );
  if (isKnownSafe) return 'Well-established (5+ years)';

  const popularityEntry = POPULAR_DOMAINS.find(
    (d) => hostname === d.domain || hostname.endsWith('.' + d.domain)
  );
  if (popularityEntry && popularityEntry.popularity >= 80) {
    return 'Well-established (5+ years)';
  }

  if (TRUSTED_TLDS.includes(tld)) return 'Established (1-5 years)';

  if (SUSPICIOUS_TLDS.includes(tld)) return 'New (< 1 year)';

  // Check for patterns suggesting newer domains
  const domainParts = hostname.split('.');
  const mainDomain = domainParts[domainParts.length - 2] || '';
  if (/\d{4}/.test(mainDomain)) return 'Likely New (< 1 year)';
  if (mainDomain.length > 15) return 'Likely New (< 1 year)';
  if (/-{2,}/.test(mainDomain)) return 'Likely New (< 1 year)';

  return 'Estimated Established (1-5 years)';
}

function estimateTrafficAndBacklinks(
  popularityEntry: { popularity: number; category: string } | undefined,
  domainPopularity: string
): { backlinkEstimate: string; trafficEstimate: string } {
  if (!popularityEntry) {
    const estimates: Record<string, { backlink: string; traffic: string }> = {
      'Very Low': { backlink: '< 100', traffic: '< 1K monthly' },
      'Low': { backlink: '100 - 1K', traffic: '1K - 10K monthly' },
      'Medium': { backlink: '1K - 10K', traffic: '10K - 100K monthly' },
      'High': { backlink: '10K - 1M', traffic: '100K - 10M monthly' },
      'Very High': { backlink: '> 1M', traffic: '> 10M monthly' },
    };
    const est = estimates[domainPopularity] || estimates['Very Low'];
    return { backlinkEstimate: est.backlink, trafficEstimate: est.traffic };
  }

  const p = popularityEntry.popularity;
  if (p >= 95) return { backlinkEstimate: '> 10M', trafficEstimate: '> 100M monthly' };
  if (p >= 90) return { backlinkEstimate: '5M - 10M', trafficEstimate: '50M - 100M monthly' };
  if (p >= 85) return { backlinkEstimate: '1M - 5M', trafficEstimate: '10M - 50M monthly' };
  if (p >= 80) return { backlinkEstimate: '500K - 1M', trafficEstimate: '5M - 10M monthly' };
  if (p >= 75) return { backlinkEstimate: '100K - 500K', trafficEstimate: '1M - 5M monthly' };
  return { backlinkEstimate: '10K - 100K', trafficEstimate: '100K - 1M monthly' };
}

function checkBlacklists(
  url: string,
  hostname: string
): { blacklisted: boolean; blacklistSources: string[] } {
  const blacklistSources: string[] = [];
  const lowerUrl = url.toLowerCase();
  const lowerHostname = hostname.toLowerCase();

  // Check against known phishing patterns
  const phishingPatterns = [
    /secure-[a-z]+-account/i,
    /account-verify/i,
    /login-[a-z]+-secure/i,
    /update-payment-info/i,
    /confirm-identity/i,
  ];

  for (const pattern of phishingPatterns) {
    if (pattern.test(lowerUrl)) {
      blacklistSources.push('URL pattern match: phishing indicator');
      break;
    }
  }

  // Check for typosquatting (common brand names misspelled)
  const brands = ['google', 'facebook', 'amazon', 'paypal', 'microsoft', 'apple', 'netflix'];
  const domainParts = lowerHostname.split('.');
  const mainDomain = domainParts[domainParts.length - 2] || '';

  for (const brand of brands) {
    if (mainDomain.includes(brand) && mainDomain !== brand) {
      // Contains brand name but isn't exactly the brand domain
      const legitSubdomains = ['accounts', 'mail', 'drive', 'docs', 'play', 'store'];
      const isSubdomain = domainParts.length > 2 && legitSubdomains.includes(domainParts[0]);
      if (!isSubdomain && domainParts[domainParts.length - 1] !== brand) {
        blacklistSources.push(`Potential typosquatting of ${brand}.com`);
        break;
      }
    }
  }

  // Check for IP address usage
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(lowerHostname)) {
    blacklistSources.push('Domain is a raw IP address');
  }

  // Check suspicious TLDs
  const tld = domainParts[domainParts.length - 1];
  if (SUSPICIOUS_TLDS.includes(tld)) {
    blacklistSources.push(`Uses suspicious TLD: .${tld}`);
  }

  return {
    blacklisted: blacklistSources.length > 0,
    blacklistSources,
  };
}

function calculateReputationScore(
  reputation: SiteAnalysis['reputation'],
  hostname: string
): number {
  let score = 50; // Start at neutral

  // SSL (+15)
  if (reputation.sslCertificate.valid) score += 15;
  else score -= 15;

  // TLD reputation
  switch (reputation.tldReputation) {
    case 'Trusted': score += 15; break;
    case 'Neutral': score += 5; break;
    case 'Suspicious': score -= 10; break;
    case 'Risky': score -= 20; break;
  }

  // Domain popularity
  switch (reputation.domainPopularity) {
    case 'Very High': score += 20; break;
    case 'High': score += 15; break;
    case 'Medium': score += 5; break;
    case 'Low': score -= 5; break;
    case 'Very Low': score -= 10; break;
  }

  // Domain age
  if (reputation.domainAge.includes('5+')) score += 5;
  else if (reputation.domainAge.includes('New')) score -= 10;

  // Known safe domain
  const isKnownSafe = KNOWN_SAFE_DOMAINS.some(
    (d) => hostname === d || hostname.endsWith('.' + d)
  );
  if (isKnownSafe) score += 10;

  // Blacklisted
  if (reputation.blacklisted) score -= 20;

  return Math.max(0, Math.min(100, score));
}

// ─── Content Analysis ─────────────────────────────────────────────────────────

function analyzeContent(html: string): SiteAnalysis['content'] {
  const lowerHtml = html.toLowerCase();

  const hasLoginForm = /<form[^>]*>[\s\S]*?type\s*=\s*["']password["']/i.test(html);
  const hasRegistrationForm =
    /<form[^>]*>[\s\S]*?type\s*=\s*["']password["']/i.test(html) &&
    (/confirm/i.test(lowerHtml) || /register/i.test(lowerHtml) || /signup/i.test(lowerHtml));
  const hasPaymentForm =
    /credit\s*card|card\s*number|cvv|card\s*expiry/i.test(lowerHtml);
  const hasSearchForm =
    /<form[^>]*>[\s\S]*?(type\s*=\s*["']search["']|name\s*=\s*["'][^"']*search[^"']*["']|placeholder\s*=\s*["'][^"']*search[^"']*["'])/i.test(html);

  const hasSocialLinks =
    /facebook\.com|twitter\.com|x\.com|linkedin\.com|instagram\.com|youtube\.com/i.test(html);
  const hasContactInfo =
    /mailto:|tel:|phone|contact\s*us|customer\s*support/i.test(lowerHtml);
  const hasPrivacyPolicy =
    /privacy/i.test(lowerHtml) && /policy/i.test(lowerHtml);
  const hasTermsOfService =
    /terms/i.test(lowerHtml) && /service|use|condition/i.test(lowerHtml);

  const language = extractLanguage(html);

  // Framework detection
  const frameworks: string[] = [];
  if (/data-reactroot|__NEXT_DATA__|_reactRootContainer|react/i.test(html)) frameworks.push('React');
  if (/ng-[^=]*=|angular|ng-app|ng-version/i.test(html)) frameworks.push('Angular');
  if (/v-cloak|v-app|v-bind|vue/i.test(html)) frameworks.push('Vue.js');
  if (/\$\(|jquery|jquery\.min\.js/i.test(html)) frameworks.push('jQuery');
  if (/bootstrap/i.test(html)) frameworks.push('Bootstrap');
  if (/tailwindcss|tailwind/i.test(html)) frameworks.push('Tailwind CSS');
  if (/next\.js|nextjs|__next/i.test(html)) frameworks.push('Next.js');
  if (/nuxt/i.test(html)) frameworks.push('Nuxt.js');
  if (/svelte/i.test(html)) frameworks.push('Svelte');
  if (/wordpress|wp-content|wp-includes/i.test(html)) frameworks.push('WordPress');
  if (/drupal/i.test(html)) frameworks.push('Drupal');
  if (/shopify/i.test(html)) frameworks.push('Shopify');

  const metaRobots = extractMetaRobots(html);

  // Open Graph tags count
  const ogMatches = html.match(/property\s*=\s*["']og:/gi);
  const openGraphTags = ogMatches ? ogMatches.length : 0;

  // Structured data
  const structuredData = /<script[^>]*type\s*=\s*["']application\/ld\+json["']/i.test(html);

  return {
    hasLoginForm,
    hasRegistrationForm,
    hasPaymentForm,
    hasSearchForm,
    hasSocialLinks,
    hasContactInfo,
    hasPrivacyPolicy,
    hasTermsOfService,
    language,
    frameworks: [...new Set(frameworks)],
    metaRobots,
    openGraphTags,
    structuredData,
  };
}

function calculateContentScore(
  content: SiteAnalysis['content'],
  classification: SiteAnalysis['classification'],
  hostname: string
): number {
  let score = 50;

  // Trust indicators
  if (content.hasPrivacyPolicy) score += 10;
  if (content.hasTermsOfService) score += 10;
  if (content.hasContactInfo) score += 10;

  // Suspicious content indicators
  if (classification.primaryType === 'Phishing/Suspicious') score -= 30;

  // Legitimate classification boost
  const legitimateTypes = [
    'E-Commerce', 'Technology', 'Education', 'Government',
    'Corporate', 'News/Media', 'Healthcare', 'Social Media',
    'Entertainment', 'Blog/Personal',
  ];
  if (legitimateTypes.includes(classification.primaryType)) score += 20;

  // Known safe domain
  const isKnownSafe = KNOWN_SAFE_DOMAINS.some(
    (d) => hostname === d || hostname.endsWith('.' + d)
  );
  if (isKnownSafe) score += 10;

  // Red flags
  if (content.hasLoginForm && !content.hasPrivacyPolicy && !content.hasTermsOfService) {
    score -= 15;
  }

  // Structured data is a sign of quality
  if (content.structuredData) score += 5;

  // Open Graph tags
  if (content.openGraphTags >= 3) score += 5;

  return Math.max(0, Math.min(100, score));
}

// ─── Overall Scoring ─────────────────────────────────────────────────────────

function getOverallRiskLevel(
  score: number
): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  // score is safety-oriented: 100 = safest
  if (score >= 75) return 'LOW';
  if (score >= 50) return 'MEDIUM';
  if (score >= 25) return 'HIGH';
  return 'CRITICAL';
}

// ─── Summary Generation ──────────────────────────────────────────────────────

function generateSummary(
  urlAnalysis: ReturnType<typeof getUrlAnalysisScore>,
  permissions: SiteAnalysis['permissions'],
  securityHeaders: SiteAnalysis['securityHeaders'],
  scripts: SiteAnalysis['scripts'],
  classification: SiteAnalysis['classification'],
  reputation: SiteAnalysis['reputation'],
  content: SiteAnalysis['content'],
  html: string | null,
  statusCode: number,
  responseTimeMs: number,
  title: string | null,
): string[] {
  const summary: string[] = [];

  // Website fetch status
  if (!html) {
    summary.push('⚠️ Could not fetch website content — analysis is based on URL heuristics only');
  } else {
    summary.push(`✅ Successfully fetched website (${statusCode} OK, ${responseTimeMs}ms response time)`);
    if (title) {
      summary.push(`📄 Page title: "${title}"`);
    }
  }

  // Classification
  summary.push(
    `🏷️ Classified as: ${classification.primaryType}${classification.secondaryTypes.length > 0 ? ` (also: ${classification.secondaryTypes.join(', ')})` : ''} — ${Math.round(classification.confidence)}% confidence`
  );

  // SSL
  if (reputation.sslCertificate.valid) {
    summary.push('🔒 Website uses HTTPS (SSL/TLS encryption active)');
  } else {
    summary.push('❌ Website does NOT use HTTPS — data may be transmitted unencrypted');
  }

  // Security headers
  const presentHeaders = Object.values(securityHeaders).filter((h) => h.present).length;
  const totalHeaders = Object.keys(securityHeaders).length;
  if (presentHeaders >= 5) {
    summary.push(`🛡️ Strong security posture: ${presentHeaders}/${totalHeaders} security headers present`);
  } else if (presentHeaders >= 3) {
    summary.push(`⚠️ Moderate security: ${presentHeaders}/${totalHeaders} security headers present`);
  } else {
    summary.push(`❌ Weak security: only ${presentHeaders}/${totalHeaders} security headers present`);
  }

  // Scripts
  if (scripts.totalScripts > 0) {
    if (scripts.suspiciousScripts > 0) {
      summary.push(
        `🚨 ${scripts.suspiciousScripts} suspicious script(s) detected out of ${scripts.totalScripts} total — ${scripts.riskIndicators.length > 0 ? scripts.riskIndicators.slice(0, 3).join('; ') : 'includes potentially dangerous patterns'}`
      );
    } else {
      summary.push(`✅ ${scripts.totalScripts} scripts analyzed — no suspicious patterns detected`);
    }
    if (scripts.thirdPartyDomains.length > 0) {
      summary.push(`🌐 ${scripts.thirdPartyDomains.length} third-party domain(s) referenced`);
    }
  }

  // Permissions
  const requestedPerms = Object.entries(permissions).filter(([, v]) => v.detected);
  if (requestedPerms.length > 0) {
    summary.push(
      `🔑 ${requestedPerms.length} browser permission(s) requested: ${requestedPerms.map(([k]) => k).join(', ')}`
    );
  }

  // Reputation
  if (reputation.blacklisted) {
    summary.push(`🚫 Blacklist indicators found: ${reputation.blacklistSources.slice(0, 2).join('; ')}`);
  }
  if (reputation.domainPopularity === 'Very Low' || reputation.domainPopularity === 'Low') {
    summary.push(`📉 Domain has low visibility (${reputation.domainPopularity} popularity)`);
  }

  // Content signals
  if (content.hasLoginForm && !content.hasPrivacyPolicy) {
    summary.push('⚠️ Login form detected without a visible privacy policy');
  }
  if (content.hasPaymentForm) {
    summary.push('💳 Payment form detected on the page');
  }
  if (content.frameworks.length > 0) {
    summary.push(`⚙️ Technologies detected: ${content.frameworks.join(', ')}`);
  }

  return summary;
}

function generateRecommendations(
  securityHeaders: SiteAnalysis['securityHeaders'],
  permissions: SiteAnalysis['permissions'],
  scripts: SiteAnalysis['scripts'],
  content: SiteAnalysis['content'],
  reputation: SiteAnalysis['reputation'],
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
): string[] {
  const recs: string[] = [];

  // Security header recommendations
  if (!securityHeaders.contentSecurityPolicy.present) {
    recs.push('Add a Content-Security-Policy header to restrict resource loading and prevent XSS attacks');
  }
  if (!securityHeaders.strictTransportSecurity.present) {
    recs.push('Enable Strict-Transport-Security (HSTS) to enforce HTTPS connections');
  }
  if (!securityHeaders.xFrameOptions.present) {
    recs.push('Add X-Frame-Options header to prevent clickjacking attacks');
  }
  if (!securityHeaders.xContentTypeOptions.present) {
    recs.push('Add X-Content-Type-Options: nosniff to prevent MIME-type sniffing');
  }
  if (!securityHeaders.referrerPolicy.present) {
    recs.push('Set a Referrer-Policy header to control referrer information leakage');
  }
  if (!securityHeaders.permissionsPolicy.present) {
    recs.push('Implement Permissions-Policy header to control browser feature access');
  }

  // SSL
  if (!reputation.sslCertificate.valid) {
    recs.push('CRITICAL: Enable HTTPS to encrypt all communications and protect user data');
  }

  // Script safety
  if (scripts.hasEvalUsage) {
    recs.push('Remove or replace eval() usage — it allows arbitrary code execution and is a major XSS vector');
  }
  if (scripts.hasDocumentWrite) {
    recs.push('Replace document.write() with safer DOM manipulation methods');
  }
  if (scripts.hasObfuscatedCode) {
    recs.push('Investigate obfuscated code in scripts — it may hide malicious behavior');
  }

  // Suspicious TLD
  if (reputation.tldReputation === 'Risky' || reputation.tldReputation === 'Suspicious') {
    recs.push(`The domain uses a ${reputation.tldReputation.toLowerCase()} TLD — exercise extra caution`);
  }

  // Content recommendations
  if (!content.hasPrivacyPolicy) {
    recs.push('Add a privacy policy page to improve transparency and user trust');
  }
  if (!content.hasTermsOfService) {
    recs.push('Add terms of service to clarify usage terms and legal obligations');
  }

  // Permissions
  const sensitivePerms = ['camera', 'microphone', 'clipboard', 'payment'] as const;
  for (const perm of sensitivePerms) {
    if (permissions[perm].detected) {
      recs.push(`Review ${perm} permission requests — ensure they are necessary and clearly explained to users`);
    }
  }

  // Risk-level specific
  if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
    recs.push('Do NOT enter any personal information, credentials, or payment details on this website');
    recs.push('Report this website to relevant authorities if you believe it is malicious');
  }

  // Third-party scripts
  if (scripts.thirdPartyDomains.length > 10) {
    recs.push('Reduce third-party script dependencies to minimize attack surface and improve performance');
  }

  // Blacklist
  if (reputation.blacklisted) {
    recs.push('This domain has been flagged by blacklist indicators — avoid interaction');
  }

  // Limit to max 15 recommendations
  return recs.slice(0, 15);
}

// ─── Empty/Default Builders ──────────────────────────────────────────────────

function buildEmptyPermissions(): SiteAnalysis['permissions'] {
  return {
    cookies: { detected: false, details: 'Could not analyze — page not fetched' },
    geolocation: { detected: false, details: 'Could not analyze — page not fetched' },
    notifications: { detected: false, details: 'Could not analyze — page not fetched' },
    camera: { detected: false, details: 'Could not analyze — page not fetched' },
    microphone: { detected: false, details: 'Could not analyze — page not fetched' },
    clipboard: { detected: false, details: 'Could not analyze — page not fetched' },
    fullscreen: { detected: false, details: 'Could not analyze — page not fetched' },
    payment: { detected: false, details: 'Could not analyze — page not fetched' },
    popup: { detected: false, details: 'Could not analyze — page not fetched' },
    thirdPartyCookies: { detected: false, details: 'Could not analyze — page not fetched' },
  };
}

function buildEmptyScripts(): SiteAnalysis['scripts'] {
  return {
    totalScripts: 0,
    inlineScripts: 0,
    externalScripts: 0,
    scripts: [],
    suspiciousScripts: 0,
    thirdPartyDomains: [],
    hasObfuscatedCode: false,
    hasEvalUsage: false,
    hasDocumentWrite: false,
    hasUnsafePatterns: false,
    riskIndicators: [],
  };
}

function buildEmptyContent(): SiteAnalysis['content'] {
  return {
    hasLoginForm: false,
    hasRegistrationForm: false,
    hasPaymentForm: false,
    hasSearchForm: false,
    hasSocialLinks: false,
    hasContactInfo: false,
    hasPrivacyPolicy: false,
    hasTermsOfService: false,
    language: 'unknown',
    frameworks: [],
    metaRobots: null,
    openGraphTags: 0,
    structuredData: false,
  };
}
