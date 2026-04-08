export interface AnalysisResult {
  isMalicious: boolean;
  threatType: string | null;
  confidenceScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: string[];
  recommendations: string[];
  features: {
    urlLength: number;
    domainLength: number;
    pathLength: number;
    pathDepth: number;
    numDots: number;
    numHyphens: number;
    numUnderscores: number;
    numAtSymbols: number;
    numSpecialChars: number;
    hasIpAddress: boolean;
    hasHttps: boolean;
    numSubdomains: number;
    entropy: number;
    numQueryParams: number;
    hasSuspiciousWords: boolean;
    numDigits: number;
    numRedirects: number;
  };
  processingTimeMs: number;
}

// Known safe domains that get a score reduction
const KNOWN_SAFE_DOMAINS = [
  'google.com', 'github.com', 'stackoverflow.com', 'microsoft.com',
  'apple.com', 'amazon.com', 'facebook.com', 'twitter.com', 'x.com',
  'linkedin.com', 'youtube.com', 'wikipedia.org', 'reddit.com',
  'netflix.com', 'spotify.com', 'dropbox.com', 'slack.com',
  'docs.google.com', 'mail.google.com', 'drive.google.com',
  'developer.mozilla.org', 'npmjs.com', 'pypi.org',
  'cloudflare.com', 'vercel.com', 'nextjs.org', 'react.dev',
];

const SUSPICIOUS_KEYWORDS = [
  'login', 'account', 'verify', 'secure', 'update', 'banking',
  'paypal', 'sign-in', 'signin', 'confirm', 'reset', 'password',
  'credential', 'suspended', 'unusual', 'restore', 'recover',
  'wallet', 'crypto', 'prize', 'winner', 'free', 'gift',
  'urgent', 'alert', 'notification', 'validate', 'authenticate',
];

const IP_ADDRESS_REGEX = /\b(\d{1,3}\.){3}\d{1,3}\b/;

export function analyzeUrl(url: string): AnalysisResult {
  const startTime = performance.now();

  const features = extractFeatures(url);
  const scoring = calculateRiskScore(features, url);

  const processingTimeMs = Math.round(performance.now() - startTime);

  return {
    isMalicious: scoring.score >= 51,
    threatType: scoring.threatType,
    confidenceScore: Math.min(scoring.score, 100),
    riskLevel: getRiskLevel(scoring.score),
    details: scoring.details,
    recommendations: scoring.recommendations,
    features,
    processingTimeMs,
  };
}

function extractFeatures(url: string): AnalysisResult['features'] {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    // Fallback for malformed URLs
    return {
      urlLength: url.length,
      domainLength: url.length,
      pathLength: 0,
      pathDepth: 0,
      numDots: (url.match(/\./g) || []).length,
      numHyphens: (url.match(/-/g) || []).length,
      numUnderscores: (url.match(/_/g) || []).length,
      numAtSymbols: (url.match(/@/g) || []).length,
      numSpecialChars: 0,
      hasIpAddress: IP_ADDRESS_REGEX.test(url),
      hasHttps: url.startsWith('https'),
      numSubdomains: 1,
      entropy: calculateEntropy(url),
      numQueryParams: 0,
      hasSuspiciousWords: hasSuspiciousKeywords(url),
      numDigits: (url.match(/\d/g) || []).length,
      numRedirects: (url.match(/\/(redirect|goto|link|url|next|away|out|jump)\b/i) || []).length,
    };
  }

  const hostname = parsed.hostname;
  const pathname = parsed.pathname;

  // Count subdomains
  const domainParts = hostname.replace(/^www\./, '').split('.');
  const numSubdomains = Math.max(1, domainParts.length - 1);

  // Extract domain (without subdomains)
  let domain: string;
  if (numSubdomains > 1) {
    domain = domainParts.slice(-2).join('.');
  } else {
    domain = hostname.replace(/^www\./, '');
  }

  // Count special characters (everything that's not alphanumeric, dot, hyphen, underscore, slash, colon, question mark, equals, ampersand)
  const specialChars = url.replace(/[a-zA-Z0-9.\-_\/:?=,&%~]/g, '');
  const numSpecialChars = specialChars.length;

  // Count query parameters
  const numQueryParams = parsed.search ? parsed.searchParams.size : 0;

  // Count redirects in path
  const redirectPatterns = /(redirect|goto|link|url|next|away|out|jump)/i;
  const pathMatches = pathname.match(redirectPatterns);
  const numRedirects = pathMatches ? pathMatches.length : 0;

  return {
    urlLength: url.length,
    domainLength: hostname.length,
    pathLength: pathname.length,
    pathDepth: pathname.split('/').filter(Boolean).length,
    numDots: (url.match(/\./g) || []).length,
    numHyphens: (url.match(/-/g) || []).length,
    numUnderscores: (url.match(/_/g) || []).length,
    numAtSymbols: (url.match(/@/g) || []).length,
    numSpecialChars,
    hasIpAddress: IP_ADDRESS_REGEX.test(hostname),
    hasHttps: parsed.protocol === 'https:',
    numSubdomains,
    entropy: calculateEntropy(hostname + pathname),
    numQueryParams,
    hasSuspiciousWords: hasSuspiciousKeywords(url),
    numDigits: (url.match(/\d/g) || []).length,
    numRedirects,
  };
}

function calculateRiskScore(
  features: AnalysisResult['features'],
  fullUrl: string
): { score: number; details: string[]; recommendations: string[]; threatType: string | null } {
  let score = 0;
  const details: string[] = [];
  const recommendations: string[] = [];
  const threatTypes: string[] = [];

  // URL length scoring
  if (features.urlLength > 100) {
    score += 25;
    details.push(`Excessively long URL (${features.urlLength} characters) — commonly used in phishing`);
    threatTypes.push('Long URL obfuscation');
  } else if (features.urlLength > 75) {
    score += 15;
    details.push(`URL is longer than average (${features.urlLength} characters)`);
  }

  // Domain length scoring
  if (features.domainLength > 20) {
    score += 10;
    details.push(`Long domain name (${features.domainLength} characters) may be suspicious`);
    threatTypes.push('Suspicious domain');
  }

  // Path depth scoring
  if (features.pathDepth > 5) {
    score += 10;
    details.push(`Deep path nesting (${features.pathDepth} levels) can hide malicious intent`);
  }

  // Dots scoring
  if (features.numDots > 4) {
    score += 10;
    details.push(`Excessive dots (${features.numDots}) in URL — may indicate subdomain spoofing`);
    threatTypes.push('Subdomain spoofing');
  }

  // Hyphens scoring
  if (features.numHyphens > 3) {
    score += 8;
    details.push(`Multiple hyphens (${features.numHyphens}) — often used to mimic legitimate domains`);
  }

  // @ symbol — URL obfuscation
  if (features.numAtSymbols > 0) {
    score += 20;
    details.push(`@ symbol detected — possible URL obfuscation technique`);
    recommendations.push('The @ symbol can redirect to a different host than what appears in the URL');
    threatTypes.push('URL obfuscation');
  }

  // IP address
  if (features.hasIpAddress) {
    score += 25;
    details.push('URL uses raw IP address instead of domain name — highly suspicious');
    recommendations.push('Legitimate services rarely use raw IP addresses in links');
    threatTypes.push('IP-based phishing');
  }

  // HTTPS check
  if (!features.hasHttps) {
    score += 10;
    details.push('URL does not use HTTPS — data transmitted may not be encrypted');
    recommendations.push('Always verify links use HTTPS before entering credentials');
  }

  // Subdomains
  if (features.numSubdomains > 3) {
    score += 15;
    details.push(`Multiple subdomains (${features.numSubdomains}) — may be spoofing a legitimate domain`);
    threatTypes.push('Subdomain spoofing');
  }

  // Entropy
  if (features.entropy > 3.5) {
    score += 15;
    details.push(`High URL entropy (${features.entropy.toFixed(2)}) — indicates random/generated strings`);
    threatTypes.push('Random URL pattern');
  }

  // Suspicious keywords
  if (features.hasSuspiciousWords) {
    score += 20;
    const found = SUSPICIOUS_KEYWORDS.filter((kw) =>
      fullUrl.toLowerCase().includes(kw)
    );
    details.push(`Contains sensitive keywords: ${found.join(', ')}`);
    recommendations.push('Be cautious of URLs containing words like "login", "verify", "secure", etc.');
    threatTypes.push('Credential harvesting');
  }

  // Digits in URL
  if (features.numDigits > 8) {
    score += 5;
    details.push(`High number of digits (${features.numDigits}) in URL`);
  }

  // Special characters
  if (features.numSpecialChars > 3) {
    score += 10;
    details.push(`Excessive special characters (${features.numSpecialChars}) — may indicate encoding tricks`);
    threatTypes.push('Character encoding abuse');
  }

  // Redirect patterns
  if (features.numRedirects > 0) {
    score += 12;
    details.push(`URL contains redirect pattern — destination may be different from expected`);
    recommendations.push('Redirect URLs can hide the true destination of the link');
    threatTypes.push('Redirect abuse');
  }

  // Known safe domain reduction
  let parsedHostname: string;
  try {
    parsedHostname = new URL(fullUrl).hostname.replace(/^www\./, '');
  } catch {
    parsedHostname = '';
  }

  const isKnownSafe = KNOWN_SAFE_DOMAINS.some(
    (safeDomain) => parsedHostname === safeDomain || parsedHostname.endsWith('.' + safeDomain)
  );

  if (isKnownSafe && score > 0) {
    score = Math.max(0, score - 30);
    details.push('Domain belongs to a known safe/trusted provider (score reduced)');
  }

  // Determine threat type
  let threatType: string | null = null;
  if (threatTypes.length > 0) {
    // Prioritize the most specific threats
    if (threatTypes.includes('IP-based phishing')) {
      threatType = 'IP-based Phishing';
    } else if (threatTypes.includes('Credential harvesting')) {
      threatType = 'Credential Harvesting';
    } else if (threatTypes.includes('URL obfuscation')) {
      threatType = 'URL Obfuscation';
    } else if (threatTypes.includes('Redirect abuse')) {
      threatType = 'Redirect Abuse';
    } else if (threatTypes.includes('Subdomain spoofing')) {
      threatType = 'Subdomain Spoofing';
    } else if (threatTypes.includes('Long URL obfuscation')) {
      threatType = 'Long URL Obfuscation';
    } else {
      threatType = threatTypes[0];
    }
  }

  // Add general recommendations
  if (score >= 51) {
    recommendations.push('Do NOT click this link or enter any personal information');
    recommendations.push('Report this URL to your IT security team');
  } else if (score >= 26) {
    recommendations.push('Exercise caution before interacting with this URL');
    recommendations.push('Verify the URL manually by typing it directly in your browser');
  } else if (recommendations.length === 0) {
    recommendations.push('This URL appears to be safe based on heuristic analysis');
    recommendations.push('Always remain vigilant and verify unexpected links');
  }

  return { score: Math.min(score, 100), details, recommendations, threatType };
}

function calculateEntropy(str: string): number {
  if (!str || str.length === 0) return 0;

  const charFreq = new Map<string, number>();
  for (const char of str) {
    charFreq.set(char, (charFreq.get(char) || 0) + 1);
  }

  let entropy = 0;
  const len = str.length;
  for (const count of charFreq.values()) {
    const probability = count / len;
    entropy -= probability * Math.log2(probability);
  }

  return entropy;
}

function hasSuspiciousKeywords(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return SUSPICIOUS_KEYWORDS.some((keyword) => lowerUrl.includes(keyword));
}

export function getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (score <= 25) return 'LOW';
  if (score <= 50) return 'MEDIUM';
  if (score <= 75) return 'HIGH';
  return 'CRITICAL';
}

/**
 * Returns raw scoring data from URL heuristic analysis for use by the enhanced site analyzer.
 */
export function getUrlAnalysisScore(url: string): {
  score: number;
  details: string[];
  recommendations: string[];
  threatType: string | null;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  features: AnalysisResult['features'];
} {
  const features = extractFeatures(url);
  const scoring = calculateRiskScore(features, url);
  return {
    score: scoring.score,
    details: scoring.details,
    recommendations: scoring.recommendations,
    threatType: scoring.threatType,
    riskLevel: getRiskLevel(scoring.score),
    features,
  };
}

export { KNOWN_SAFE_DOMAINS };
