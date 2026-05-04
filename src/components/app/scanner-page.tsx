'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Clipboard,
  X,
  RotateCcw,
  CheckCircle,
  Loader2,
  ExternalLink,
  AlertTriangle,
  Info,
  ArrowRight,
  Lock,
  Code,
  Globe,
  Eye,
  Server,
  FileText,
  CheckCircle2,
  XCircle,
  Cookie,
  MapPin,
  Bell,
  Camera,
  Mic,
  Maximize,
  CreditCard,
  SquareArrowOutUpRight,
  Link2,
  Award,
  Tag,
  AlertOctagon,
  Bug,
  BadgeCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore } from '@/lib/store'
import type { SiteAnalysis } from '@/lib/site-analyzer'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScanResult {
  id: string
  originalUrl: string
  domain: string
  status: string
  createdAt: string
  isMalicious: boolean
  threatType: string | null
  confidenceScore: number
  riskLevel: string
  details: string[]
  recommendations: string[]
  features: Record<string, unknown> | null
  processingTimeMs: number
  cached: boolean
  siteAnalysis: SiteAnalysis | null
  trustedSource?: {
    type: string
    matchedDomain: string
    label: string
  } | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SCAN_STEPS = [
  'URL structure parsed',
  'Domain analysis complete',
  'Fetching website content...',
  'Analyzing permissions & headers',
  'Scanning scripts & code',
  'Evaluating reputation & trust',
  'Classifying website type',
  'Generating comprehensive report',
]

const featureLabels: Record<string, string> = {
  urlLength: 'URL Length',
  domainLength: 'Domain Length',
  pathLength: 'Path Length',
  pathDepth: 'Path Depth',
  numDots: 'Number of Dots',
  numHyphens: 'Number of Hyphens',
  numUnderscores: 'Number of Underscores',
  numAtSymbols: 'Number of @ Symbols',
  numSpecialChars: 'Special Characters',
  hasIpAddress: 'Uses IP Address',
  hasHttps: 'Uses HTTPS',
  numSubdomains: 'Subdomain Count',
  entropy: 'URL Entropy',
  numQueryParams: 'Query Parameters',
  hasSuspiciousWords: 'Suspicious Words',
  numDigits: 'Number of Digits',
  numRedirects: 'Redirect Count',
}

const PERMISSION_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
  cookies: { label: 'Cookies', icon: Cookie },
  geolocation: { label: 'Geolocation', icon: MapPin },
  notifications: { label: 'Notifications', icon: Bell },
  camera: { label: 'Camera', icon: Camera },
  microphone: { label: 'Microphone', icon: Mic },
  clipboard: { label: 'Clipboard', icon: Clipboard },
  fullscreen: { label: 'Fullscreen', icon: Maximize },
  payment: { label: 'Payment', icon: CreditCard },
  popup: { label: 'Popups', icon: SquareArrowOutUpRight },
  thirdPartyCookies: { label: '3rd Party Cookies', icon: Link2 },
}

const HEADER_LABELS: Record<string, string> = {
  contentSecurityPolicy: 'Content-Security-Policy',
  xFrameOptions: 'X-Frame-Options',
  xContentTypeOptions: 'X-Content-Type-Options',
  xXSSProtection: 'X-XSS-Protection',
  strictTransportSecurity: 'Strict-Transport-Security',
  referrerPolicy: 'Referrer-Policy',
  permissionsPolicy: 'Permissions-Policy',
}

const CONTENT_ITEMS: { key: keyof SiteAnalysis['content']; label: string }[] = [
  { key: 'hasLoginForm', label: 'Login Form' },
  { key: 'hasRegistrationForm', label: 'Registration Form' },
  { key: 'hasPaymentForm', label: 'Payment Form' },
  { key: 'hasSearchForm', label: 'Search Functionality' },
  { key: 'hasSocialLinks', label: 'Social Media Links' },
  { key: 'hasContactInfo', label: 'Contact Information' },
  { key: 'hasPrivacyPolicy', label: 'Privacy Policy' },
  { key: 'hasTermsOfService', label: 'Terms of Service' },
]

// ─── Helper Components ────────────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score > 70) return 'emerald'
  if (score >= 40) return 'amber'
  return 'red'
}

function getScoreLabel(score: number): string {
  if (score > 85) return 'Excellent'
  if (score > 70) return 'Good'
  if (score >= 55) return 'Fair'
  if (score >= 40) return 'Moderate'
  if (score >= 20) return 'Poor'
  return 'Critical'
}

function getScoreBgClass(score: number): string {
  if (score > 70) return 'bg-emerald-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

function getScoreTextClass(score: number): string {
  if (score > 70) return 'text-emerald-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-red-600'
}

function getScoreBadgeClass(score: number): string {
  if (score > 70) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (score >= 40) return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-red-50 text-red-700 border-red-200'
}

function ColoredProgress({ value, score }: { value: number; score: number }) {
  const color = getScoreColor(score)
  const bgMap: Record<string, string> = {
    emerald: 'bg-emerald-100',
    amber: 'bg-amber-100',
    red: 'bg-red-100',
  }
  const fillMap: Record<string, string> = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  }

  return (
    <div className={`h-2 w-full overflow-hidden rounded-full ${bgMap[color]}`}>
      <div
        className={`h-full rounded-full transition-all duration-700 ${fillMap[color]}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

function ScoreCard({
  title,
  icon: Icon,
  score,
  description,
}: {
  title: string
  icon: React.ElementType
  score: number
  description?: string
}) {
  const label = getScoreLabel(score)
  const textClass = getScoreTextClass(score)
  const badgeClass = getScoreBadgeClass(score)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-slate-200 hover:shadow-md transition-shadow">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`rounded-lg p-1.5 ${getScoreBgClass(score)} bg-opacity-10`} style={{ backgroundColor: `${getScoreColor(score) === 'emerald' ? '#10b981' : getScoreColor(score) === 'amber' ? '#f59e0b' : '#ef4444'}15` }}>
                <Icon className="h-4 w-4" style={{ color: getScoreColor(score) === 'emerald' ? '#10b981' : getScoreColor(score) === 'amber' ? '#f59e0b' : '#ef4444' }} />
              </div>
              <span className="text-sm font-medium text-slate-700">{title}</span>
            </div>
            <Badge variant="outline" className={`text-xs border ${badgeClass}`}>
              {label}
            </Badge>
          </div>
          <div className="flex items-end gap-1">
            <span className={`text-2xl font-bold ${textClass}`}>{score}</span>
            <span className="text-sm text-slate-400 mb-0.5">/100</span>
          </div>
          <ColoredProgress value={score} score={score} />
          {description && (
            <p className="text-xs text-slate-400">{description}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function RiskGauge({ score, riskLevel }: { score: number; riskLevel: string }) {
  const percentage = score * 100
  const colorMap: Record<string, string> = {
    LOW: '#10b981',
    MEDIUM: '#f59e0b',
    HIGH: '#f97316',
    CRITICAL: '#ef4444',
  }
  const color = colorMap[riskLevel] || colorMap.LOW

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="120" viewBox="0 0 200 120">
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(percentage / 100) * 251.2} 251.2`}
          style={{ transition: 'stroke-dasharray 1s ease-out, stroke 0.5s ease' }}
        />
        <text x="100" y="85" textAnchor="middle" className="text-2xl font-bold" fill={color}>
          {percentage.toFixed(0)}%
        </text>
        <text x="100" y="105" textAnchor="middle" className="text-xs" fill="#94a3b8">
          Risk Score
        </text>
      </svg>
      <Badge
        variant="secondary"
        className="mt-1 border-0 text-sm font-semibold"
        style={{ backgroundColor: `${color}15`, color }}
      >
        {riskLevel}
      </Badge>
    </div>
  )
}

function TrustedSourceBadge({
  source,
}: {
  source: NonNullable<ScanResult['trustedSource']>
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 rounded-xl border-2 border-emerald-300 bg-emerald-50 p-5"
      dir="rtl"
    >
      <div className="rounded-full bg-emerald-100 p-3">
        <BadgeCheck className="h-8 w-8 text-emerald-600" />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-bold text-emerald-700">{source.label}</h3>
        <p className="mt-1 text-sm text-emerald-600">
          هذا الرابط ضمن قائمة المصادر الموثوقة — آمن للزيارة 100%.
        </p>
        <p className="mt-1 font-mono text-xs text-emerald-500/80">
          {source.matchedDomain}
        </p>
      </div>
    </motion.div>
  )
}

function ResultBanner({
  riskLevel,
  confidenceScore,
}: {
  riskLevel: string
  confidenceScore: number
}) {
  const config: Record<string, { icon: React.ElementType; label: string; bg: string; text: string; border: string }> = {
    LOW: {
      icon: ShieldCheck,
      label: 'SAFE',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
    },
    MEDIUM: {
      icon: AlertTriangle,
      label: 'SUSPICIOUS',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
    },
    HIGH: {
      icon: ShieldAlert,
      label: 'DANGEROUS',
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
    },
    CRITICAL: {
      icon: ShieldX,
      label: 'MALICIOUS',
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
    },
  }

  const c = config[riskLevel] || config.LOW
  const Icon = c.icon

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-xl border p-6 ${c.bg} ${c.border}`}
    >
      <div className="flex items-center gap-4">
        <div className={`rounded-full p-3 ${c.bg}`}>
          <Icon className={`h-8 w-8 ${c.text}`} />
        </div>
        <div>
          <h3 className={`text-xl font-bold ${c.text}`}>{c.label}</h3>
          <p className="text-sm text-slate-500">
            Confidence Score:{' '}
            <span className="font-semibold text-slate-700">
              {(confidenceScore * 100).toFixed(0)}%
            </span>
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Comprehensive Analysis Tabs ──────────────────────────────────────────────

function OverviewTab({ sa }: { sa: SiteAnalysis }) {
  return (
    <div className="space-y-6">
      {/* Score Cards Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <ScoreCard
          title="Permissions"
          icon={Shield}
          score={100 - sa.permissionScore}
          description="Lower is better - fewer permissions requested"
        />
        <ScoreCard
          title="Security Headers"
          icon={Lock}
          score={sa.securityHeaderScore}
          description="HTTP security headers present"
        />
        <ScoreCard
          title="Script Safety"
          icon={Code}
          score={sa.scriptSafetyScore}
          description="Scripts on the page are safe"
        />
        <ScoreCard
          title="Reputation"
          icon={Award}
          score={sa.reputationScore}
          description="Domain trustworthiness"
        />
        <ScoreCard
          title="Content"
          icon={FileText}
          score={sa.content.hasPrivacyPolicy && sa.content.hasTermsOfService ? 85 : sa.content.hasPrivacyPolicy || sa.content.hasTermsOfService ? 60 : 35}
          description="Page content indicators"
        />
        <ScoreCard
          title="Overall"
          icon={Globe}
          score={sa.overallScore}
          description="Combined analysis score"
        />
      </div>

      {/* Website Information */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Globe className="h-4 w-4 text-teal-500" />
            Website Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase text-slate-400">Website Title</p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {sa.title || 'Not available'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-400">Description</p>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                {sa.description || 'No description available'}
              </p>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-slate-400">Status Code</p>
              <Badge variant="outline" className={`mt-1 ${sa.statusCode >= 200 && sa.statusCode < 300 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : sa.statusCode >= 300 && sa.statusCode < 400 ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                {sa.statusCode || 'N/A'}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-slate-400">Response Time</p>
              <p className="mt-1 text-sm font-medium text-slate-700">{sa.responseTimeMs}ms</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Language</p>
              <p className="mt-1 text-sm font-medium text-slate-700">{(sa.content.language || 'unknown').toUpperCase()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Risk Level</p>
              <Badge variant="outline" className={`mt-1 ${sa.overallRiskLevel === 'LOW' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : sa.overallRiskLevel === 'MEDIUM' ? 'border-amber-200 bg-amber-50 text-amber-700' : sa.overallRiskLevel === 'HIGH' ? 'border-orange-200 bg-orange-50 text-orange-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                {sa.overallRiskLevel}
              </Badge>
            </div>
          </div>
          {sa.content.frameworks.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-medium uppercase text-slate-400">Detected Frameworks</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {sa.content.frameworks.map((fw) => (
                    <Badge key={fw} variant="secondary" className="bg-teal-50 text-teal-700 border-teal-200 text-xs">
                      {fw}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
          <Separator />
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase text-slate-400">Classification</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge className="bg-teal-500 text-white border-0 text-xs">
                  {sa.classification.primaryType}
                </Badge>
                {sa.classification.secondaryTypes.map((t) => (
                  <Badge key={t} variant="outline" className="border-slate-200 text-slate-600 text-xs">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-400">Confidence</p>
              <div className="mt-2 flex items-center gap-2">
                <ColoredProgress value={sa.classification.confidence} score={sa.classification.confidence} />
                <span className="text-sm font-medium text-slate-600">{sa.classification.confidence}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SecurityTab({ sa }: { sa: SiteAnalysis }) {
  const permissionEntries = Object.entries(sa.permissions) as [string, { detected: boolean; details: string }][]
  const headerEntries = Object.entries(sa.securityHeaders) as [string, { present: boolean; value: string | null }][]
  const presentHeaders = headerEntries.filter(([, v]) => v.present).length

  return (
    <div className="space-y-6">
      {/* Permissions Analysis */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Eye className="h-4 w-4 text-teal-500" />
              Permissions Analysis
            </CardTitle>
            <Badge
              variant="outline"
              className={
                sa.permissionScore < 30
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 text-xs'
                  : sa.permissionScore <= 60
                  ? 'border-amber-200 bg-amber-50 text-amber-700 text-xs'
                  : 'border-red-200 bg-red-50 text-red-700 text-xs'
              }
            >
              {sa.permissionScore < 30 ? 'Minimal' : sa.permissionScore <= 60 ? 'Moderate' : 'Extensive'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-2 text-left text-xs font-medium text-slate-400">Permission</th>
                  <th className="pb-2 text-left text-xs font-medium text-slate-400">Status</th>
                  <th className="hidden pb-2 text-left text-xs font-medium text-slate-400 sm:table-cell">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {permissionEntries.map(([key, val]) => {
                  const config = PERMISSION_CONFIG[key]
                  const Icon = config?.icon || Shield
                  return (
                    <tr key={key}>
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-slate-700">{config?.label || key}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4">
                        {val.detected ? (
                          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 text-xs">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Detected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Not Found
                          </Badge>
                        )}
                      </td>
                      <td className="hidden py-2.5 sm:table-cell">
                        <span className="text-xs text-slate-500">{val.details}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Security Headers */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Lock className="h-4 w-4 text-teal-500" />
              Security Headers
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{presentHeaders}/{headerEntries.length}</span>
              <ColoredProgress value={sa.securityHeaderScore} score={sa.securityHeaderScore} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-2 text-left text-xs font-medium text-slate-400">Header</th>
                  <th className="pb-2 text-left text-xs font-medium text-slate-400">Status</th>
                  <th className="hidden pb-2 text-left text-xs font-medium text-slate-400 sm:table-cell">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {headerEntries.map(([key, val]) => (
                  <tr key={key}>
                    <td className="py-2.5 pr-4">
                      <span className="font-mono text-xs text-slate-700">{HEADER_LABELS[key] || key}</span>
                    </td>
                    <td className="py-2.5 pr-4">
                      {val.present ? (
                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Present
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 text-xs">
                          <XCircle className="mr-1 h-3 w-3" />
                          Missing
                        </Badge>
                      )}
                    </td>
                    <td className="hidden max-w-xs truncate py-2.5 sm:table-cell">
                      <span className="font-mono text-xs text-slate-500">
                        {val.value ? (val.value.length > 60 ? val.value.slice(0, 60) + '...' : val.value) : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ScriptsTab({ sa }: { sa: SiteAnalysis }) {
  const scriptCategories: Record<string, { color: string; bg: string }> = {
    analytics: { color: 'text-blue-600', bg: 'bg-blue-50' },
    advertising: { color: 'text-purple-600', bg: 'bg-purple-50' },
    social: { color: 'text-pink-600', bg: 'bg-pink-50' },
    tracking: { color: 'text-orange-600', bg: 'bg-orange-50' },
    essential: { color: 'text-slate-600', bg: 'bg-slate-50' },
    suspicious: { color: 'text-red-600', bg: 'bg-red-50' },
    unknown: { color: 'text-slate-400', bg: 'bg-slate-50' },
  }

  return (
    <div className="space-y-6">
      {/* Script Summary */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Code className="h-4 w-4 text-teal-500" />
            Script Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-400">Total Scripts</p>
              <p className="mt-1 text-xl font-bold text-slate-800">{sa.scripts.totalScripts}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-400">Inline</p>
              <p className="mt-1 text-xl font-bold text-slate-800">{sa.scripts.inlineScripts}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-400">External</p>
              <p className="mt-1 text-xl font-bold text-slate-800">{sa.scripts.externalScripts}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-400">Suspicious</p>
              <p className={`mt-1 text-xl font-bold ${sa.scripts.suspiciousScripts > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {sa.scripts.suspiciousScripts}
              </p>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Script Safety Score</span>
              <span className={`text-sm font-bold ${getScoreTextClass(sa.scriptSafetyScore)}`}>
                {sa.scriptSafetyScore}/100
              </span>
            </div>
            <div className="mt-1.5">
              <ColoredProgress value={sa.scriptSafetyScore} score={sa.scriptSafetyScore} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Third-Party Domains */}
      {sa.scripts.thirdPartyDomains.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Link2 className="h-4 w-4 text-teal-500" />
              Third-Party Domains
              <Badge variant="secondary" className="ml-auto text-xs">
                {sa.scripts.thirdPartyDomains.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
              {sa.scripts.thirdPartyDomains.map((domain) => (
                <Badge key={domain} variant="outline" className="border-slate-200 text-xs font-mono">
                  {domain}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Script List */}
      {sa.scripts.scripts.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Server className="h-4 w-4 text-teal-500" />
              Detected Scripts
              <Badge variant="secondary" className="ml-auto text-xs">
                {sa.scripts.scripts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {sa.scripts.scripts.map((script, idx) => {
                const catStyle = scriptCategories[script.category] || scriptCategories.unknown
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 rounded-lg p-3 ${script.isSuspicious ? 'bg-red-50 border border-red-100' : 'bg-slate-50'}`}
                  >
                    <div className="mt-0.5">
                      {script.isSuspicious ? (
                        <AlertOctagon className="h-4 w-4 text-red-500" />
                      ) : script.type === 'external' ? (
                        <ExternalLink className="h-4 w-4 text-slate-400" />
                      ) : (
                        <Code className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-xs ${catStyle.bg} ${catStyle.color} border-transparent`}>
                          {script.category}
                        </Badge>
                        <Badge variant="outline" className="border-transparent text-xs text-slate-400">
                          {script.type}
                        </Badge>
                        <span className="text-xs text-slate-400">{(script.size / 1024).toFixed(1)}KB</span>
                      </div>
                      <p className="mt-1 truncate text-xs font-mono text-slate-500">
                        {script.src || 'inline script'}
                      </p>
                      {script.reasons.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {script.reasons.map((reason, rIdx) => (
                            <p key={rIdx} className="text-xs text-red-500 flex items-center gap-1">
                              <Bug className="h-2.5 w-2.5" />
                              {reason}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Indicators */}
      {sa.scripts.riskIndicators.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <AlertOctagon className="h-4 w-4 text-red-500" />
              Script Risk Indicators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {sa.scripts.riskIndicators.map((indicator, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                  <Bug className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                  {indicator}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ContentTab({ sa }: { sa: SiteAnalysis }) {
  const popularityColorMap: Record<string, string> = {
    'Very High': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'High': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Medium': 'bg-amber-50 text-amber-700 border-amber-200',
    'Low': 'bg-orange-50 text-orange-700 border-orange-200',
    'Very Low': 'bg-red-50 text-red-700 border-red-200',
  }
  const tldColorMap: Record<string, string> = {
    'Trusted': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Neutral': 'bg-slate-50 text-slate-700 border-slate-200',
    'Suspicious': 'bg-amber-50 text-amber-700 border-amber-200',
    'Risky': 'bg-red-50 text-red-700 border-red-200',
  }

  return (
    <div className="space-y-6">
      {/* Content Analysis Checklist */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4 text-teal-500" />
            Content Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CONTENT_ITEMS.map(({ key, label }) => {
              const detected = sa.content[key] as boolean
              return (
                <div key={key} className="flex items-center gap-2.5 rounded-lg bg-slate-50 p-3">
                  {detected ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-slate-300" />
                  )}
                  <span className={`text-sm ${detected ? 'text-slate-700' : 'text-slate-400'}`}>
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Classification & Reputation - Two Columns */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Classification */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Tag className="h-4 w-4 text-teal-500" />
              Website Classification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-slate-400">Primary Type</p>
              <Badge className="mt-1.5 bg-teal-500 text-white border-0 text-sm">
                {sa.classification.primaryType}
              </Badge>
            </div>
            {sa.classification.secondaryTypes.length > 0 && (
              <div>
                <p className="text-xs text-slate-400">Secondary Types</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {sa.classification.secondaryTypes.map((t) => (
                    <Badge key={t} variant="outline" className="border-slate-200 text-xs text-slate-600">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">Confidence</p>
                <span className="text-sm font-medium text-slate-600">{sa.classification.confidence}%</span>
              </div>
              <div className="mt-1.5">
                <ColoredProgress value={sa.classification.confidence} score={sa.classification.confidence} />
              </div>
            </div>
            {sa.classification.indicators.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 mb-2">Classification Indicators</p>
                <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                  {sa.classification.indicators.map((indicator, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-xs text-slate-600">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-500" />
                      {indicator}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reputation */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Award className="h-4 w-4 text-teal-500" />
              Reputation & Trust
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-400">Domain Age</p>
                <p className="mt-1 text-sm font-medium text-slate-700">{sa.reputation.domainAge || 'Unknown'}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-400">SSL Certificate</p>
                <Badge
                  variant="outline"
                  className={`mt-1 text-xs ${sa.reputation.sslCertificate.valid ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}
                >
                  {sa.reputation.sslCertificate.valid ? 'Valid' : 'Invalid'}
                </Badge>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-400">Popularity</p>
                <Badge
                  variant="outline"
                  className={`mt-1 text-xs ${popularityColorMap[sa.reputation.domainPopularity] || 'bg-slate-50 text-slate-700 border-slate-200'}`}
                >
                  {sa.reputation.domainPopularity}
                </Badge>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-400">TLD Reputation</p>
                <Badge
                  variant="outline"
                  className={`mt-1 text-xs ${tldColorMap[sa.reputation.tldReputation] || 'bg-slate-50 text-slate-700 border-slate-200'}`}
                >
                  {sa.reputation.tldReputation}
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
              <span className="text-xs text-slate-400">Blacklist Status</span>
              {sa.reputation.blacklisted ? (
                <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 text-xs">
                  <AlertOctagon className="mr-1 h-3 w-3" />
                  Blacklisted
                </Badge>
              ) : (
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Clean
                </Badge>
              )}
            </div>
            {sa.reputation.blacklistSources.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 mb-1">Blacklist Sources</p>
                <div className="flex flex-wrap gap-1">
                  {sa.reputation.blacklistSources.map((source) => (
                    <Badge key={source} variant="outline" className="border-red-200 bg-red-50 text-red-600 text-xs">
                      {source}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">Reputation Score</p>
                <span className={`text-sm font-bold ${getScoreTextClass(sa.reputationScore)}`}>
                  {sa.reputationScore}/100
                </span>
              </div>
              <div className="mt-1.5">
                <ColoredProgress value={sa.reputationScore} score={sa.reputationScore} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ReportTab({ sa }: { sa: SiteAnalysis }) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Info className="h-4 w-4 text-teal-500" />
            Analysis Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sa.summary.length > 0 ? (
            <ul className="space-y-2">
              {sa.summary.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">No summary available.</p>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <ArrowRight className="h-4 w-4 text-teal-500" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sa.recommendations.length > 0 ? (
            <ul className="space-y-2">
              {sa.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-500" />
                  {rec}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-emerald-600">No additional recommendations.</p>
          )}
        </CardContent>
      </Card>

      {/* Overall Risk Summary */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Shield className="h-4 w-4 text-teal-500" />
            Overall Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Overall Score</p>
              <p className={`mt-1 text-3xl font-bold ${getScoreTextClass(sa.overallScore)}`}>
                {sa.overallScore}<span className="text-lg text-slate-400">/100</span>
              </p>
            </div>
            <Badge
              variant="outline"
              className={`text-sm px-3 py-1 ${
                sa.overallRiskLevel === 'LOW'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : sa.overallRiskLevel === 'MEDIUM'
                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : sa.overallRiskLevel === 'HIGH'
                  ? 'border-orange-200 bg-orange-50 text-orange-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {sa.overallRiskLevel}
            </Badge>
          </div>
          <ColoredProgress value={sa.overallScore} score={sa.overallScore} />
        </CardContent>
      </Card>
    </div>
  )
}

function ComprehensiveAnalysis({ sa }: { sa: SiteAnalysis }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-lg font-bold text-slate-900">Comprehensive Site Analysis</h2>
        <p className="mt-1 text-sm text-slate-500">
          Deep analysis of website security, scripts, content, and reputation
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">
            <Globe className="mr-1 h-3.5 w-3.5 hidden sm:inline-block" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs sm:text-sm">
            <Lock className="mr-1 h-3.5 w-3.5 hidden sm:inline-block" />
            Security
          </TabsTrigger>
          <TabsTrigger value="scripts" className="text-xs sm:text-sm">
            <Code className="mr-1 h-3.5 w-3.5 hidden sm:inline-block" />
            Scripts
          </TabsTrigger>
          <TabsTrigger value="content" className="text-xs sm:text-sm">
            <FileText className="mr-1 h-3.5 w-3.5 hidden sm:inline-block" />
            Content
          </TabsTrigger>
          <TabsTrigger value="report" className="text-xs sm:text-sm">
            <Info className="mr-1 h-3.5 w-3.5 hidden sm:inline-block" />
            Report
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <OverviewTab sa={sa} />
        </TabsContent>
        <TabsContent value="security">
          <SecurityTab sa={sa} />
        </TabsContent>
        <TabsContent value="scripts">
          <ScriptsTab sa={sa} />
        </TabsContent>
        <TabsContent value="content">
          <ContentTab sa={sa} />
        </TabsContent>
        <TabsContent value="report">
          <ReportTab sa={sa} />
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}

// ─── Main Scanner Page ────────────────────────────────────────────────────────

export function ScannerPage() {
  const [url, setUrl] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [scanStep, setScanStep] = useState(0)
  const [result, setResult] = useState<ScanResult | null>(null)
  const { setCurrentView } = useAppStore()

  const simulateScanSteps = useCallback(() => {
    let step = 0
    setScanStep(0)
    const interval = setInterval(() => {
      step += 1
      setScanStep(step)
      if (step >= SCAN_STEPS.length) {
        clearInterval(interval)
      }
    }, 600)
    return interval
  }, [])

  const handleScan = async () => {
    const trimmedUrl = url.trim()
    if (!trimmedUrl) {
      toast.error('Please enter a URL to scan')
      return
    }

    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      toast.error('URL must start with http:// or https://')
      return
    }

    setIsScanning(true)
    setResult(null)
    const stepInterval = simulateScanSteps()

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmedUrl }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Scan failed')
        clearInterval(stepInterval)
        setIsScanning(false)
        return
      }

      // Wait for step animation to finish
      await new Promise((resolve) => setTimeout(resolve, 3200))
      clearInterval(stepInterval)
      setResult(data.result)
      if (data.cached) {
        toast.info('Result loaded from cache')
      }
    } catch {
      toast.error('Network error. Please try again.')
      clearInterval(stepInterval)
    } finally {
      setIsScanning(false)
    }
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setUrl(text)
      toast.success('URL pasted from clipboard')
    } catch {
      toast.error('Unable to access clipboard')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isScanning) {
      handleScan()
    }
  }

  const handleScanAnother = () => {
    setResult(null)
    setUrl('')
    setScanStep(0)
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Scan Any URL for Threats</h1>
        <p className="mt-1 text-slate-500">
          Enter a URL to analyze it for potential security threats
        </p>
      </div>

      {/* URL Input */}
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="https://example.com/some/path"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isScanning}
                className="h-12 pl-10 pr-10 text-base"
              />
              {url && (
                <button
                  onClick={() => setUrl('')}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              onClick={handleScan}
              disabled={isScanning || !url.trim()}
              className="btn-teal-gradient h-12 shrink-0 border-0 px-8 text-white hover:text-white"
            >
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Scan Now
                </>
              )}
            </Button>
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="ghost" size="sm" className="text-xs text-slate-500" onClick={handlePaste}>
              <Clipboard className="mr-1.5 h-3 w-3" />
              Paste from Clipboard
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-slate-500"
              onClick={() => setUrl('')}
            >
              <RotateCcw className="mr-1.5 h-3 w-3" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scanning Progress */}
      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-12 w-12 animate-spin-slow rounded-full border-4 border-teal-100 border-t-teal-500" />
                    <Shield className="absolute top-1/2 left-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-teal-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">Analyzing URL...</p>
                    <div className="mt-2 space-y-1.5">
                      {SCAN_STEPS.map((step, index) => (
                        <div key={step} className="flex items-center gap-2">
                          {index < scanStep ? (
                            <CheckCircle className="h-4 w-4 text-emerald-500 animate-check-appear" />
                          ) : index === scanStep ? (
                            <Loader2 className="h-4 w-4 animate-spin text-teal-500" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border border-slate-200" />
                          )}
                          <span
                            className={`text-xs ${
                              index <= scanStep ? 'text-slate-700' : 'text-slate-400'
                            }`}
                          >
                            {step}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result && !isScanning && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Trusted Source Badge (shown only for trusted Saudi/Gulf/global domains) */}
            {result.trustedSource && <TrustedSourceBadge source={result.trustedSource} />}

            {/* Result Banner */}
            <ResultBanner riskLevel={result.riskLevel} confidenceScore={result.confidenceScore} />

            {/* Gauge & URL Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
                  <RiskGauge score={result.confidenceScore} riskLevel={result.riskLevel} />
                  <div className="flex-1 space-y-3 text-center md:text-left">
                    <div>
                      <p className="text-xs font-medium uppercase text-slate-400">Scanned URL</p>
                      <p className="mt-1 break-all text-sm font-medium text-slate-900">
                        {result.originalUrl}
                      </p>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <p className="text-xs text-slate-400">Domain</p>
                        <p className="text-sm font-medium text-slate-700">{result.domain}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Threat Type</p>
                        <p className="text-sm font-medium text-slate-700">
                          {result.threatType || 'None'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Processing Time</p>
                        <p className="text-sm font-medium text-slate-700">
                          {result.processingTimeMs}ms
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Scanned At</p>
                        <p className="text-sm font-medium text-slate-700">
                          {new Date(result.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Analysis Cards */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* URL Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <Info className="h-4 w-4 text-teal-500" />
                    URL Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.features
                    ? Object.entries(result.features)
                        .slice(0, 8)
                        .map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">
                              {featureLabels[key] || key}
                            </span>
                            <span className="font-medium text-slate-700">
                              {typeof value === 'boolean'
                                ? value
                                  ? 'Yes'
                                  : 'No'
                                : typeof value === 'number'
                                ? value.toFixed(2)
                                : String(value)}
                            </span>
                          </div>
                        ))
                    : 'No features available'}
                </CardContent>
              </Card>

              {/* Domain Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <Search className="h-4 w-4 text-teal-500" />
                    Domain Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Domain</span>
                    <span className="font-medium text-slate-700">{result.domain}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">HTTPS</span>
                    <Badge
                      variant="secondary"
                      className={`border-0 text-xs ${
                        result.features?.hasHttps
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {result.features?.hasHttps ? 'Secure' : 'Not Secure'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Subdomains</span>
                    <span className="font-medium text-slate-700">
                      {String(result.features?.numSubdomains || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Domain Length</span>
                    <span className="font-medium text-slate-700">
                      {String(result.features?.domainLength || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">IP Address</span>
                    <Badge
                      variant="secondary"
                      className={`border-0 text-xs ${
                        result.features?.hasIpAddress
                          ? 'bg-red-100 text-red-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {result.features?.hasIpAddress ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Threat Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <ShieldAlert className="h-4 w-4 text-teal-500" />
                    Threat Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-400">Threat Type</p>
                    <p className="text-sm font-medium text-slate-700">
                      {result.threatType || 'No threat detected'}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Details</p>
                    {result.details && result.details.length > 0 ? (
                      <ul className="space-y-1">
                        {result.details.slice(0, 4).map((d, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-teal-500" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-400">No additional details</p>
                    )}
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Recommendations</p>
                    {result.recommendations && result.recommendations.length > 0 ? (
                      <ul className="space-y-1">
                        {result.recommendations.slice(0, 3).map((r, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                            <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-teal-500" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-emerald-600">This URL appears safe to visit.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Comprehensive Analysis - Only shown when siteAnalysis exists */}
            {result.siteAnalysis && (
              <ComprehensiveAnalysis sa={result.siteAnalysis} />
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={handleScanAnother} variant="outline" className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Scan Another URL
              </Button>
              <Button
                onClick={() => setCurrentView('history')}
                className="btn-teal-gradient gap-2 border-0 text-white hover:text-white"
              >
                <ExternalLink className="h-4 w-4" />
                View in History
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
