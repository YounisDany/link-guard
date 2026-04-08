'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  AlertOctagon,
  Info,
  Clock,
  Globe,
  Loader2,
  Lock,
  Code,
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
  Clipboard,
  SquareArrowOutUpRight,
  Link2,
  Award,
  Tag,
  ArrowRight,
  Bug,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAppStore } from '@/lib/store'
import type { SiteAnalysis } from '@/lib/site-analyzer'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScanDetail {
  id: string
  originalUrl: string
  domain: string
  protocol: string
  path: string | null
  queryParams: string | null
  status: string
  createdAt: string
  updatedAt: string
  isMalicious: boolean
  threatType: string | null
  confidenceScore: number
  riskLevel: string
  details: string[]
  recommendations: string[]
  features: Record<string, unknown> | null
  processingTimeMs: number
  siteAnalysis: SiteAnalysis | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

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

const RISK_CONFIG: Record<string, { icon: React.ElementType; label: string; bg: string; text: string; border: string }> = {
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
    <Card className="border-slate-200 hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div style={{ backgroundColor: `${getScoreColor(score) === 'emerald' ? '#10b981' : getScoreColor(score) === 'amber' ? '#f59e0b' : '#ef4444'}15` }}>
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
  )
}

// ─── Comprehensive Analysis Tabs ──────────────────────────────────────────────

function DetailOverviewTab({ sa }: { sa: SiteAnalysis }) {
  return (
    <div className="space-y-6">
      {/* Score Cards Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <ScoreCard
          title="Permissions"
          icon={Eye}
          score={100 - sa.permissionScore}
          description="Lower is better — fewer permissions requested"
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
              <p className="mt-1 text-sm text-slate-600">
                {sa.description || 'No description available'}
              </p>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-slate-400">Content Type</p>
              <p className="mt-1 text-sm font-medium text-slate-700">{sa.contentType || 'unknown'}</p>
            </div>
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

function DetailSecurityTab({ sa }: { sa: SiteAnalysis }) {
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
                  <th className="pb-2 text-left text-xs font-medium text-slate-400">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {permissionEntries.map(([key, val]) => {
                  const config = PERMISSION_CONFIG[key]
                  const Icon = config?.icon || Lock
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
                      <td className="py-2.5">
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
                  <th className="pb-2 text-left text-xs font-medium text-slate-400">Value</th>
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
                    <td className="max-w-xs py-2.5">
                      <span className="break-all font-mono text-xs text-slate-500">
                        {val.value || '—'}
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

function DetailScriptsTab({ sa }: { sa: SiteAnalysis }) {
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
          {/* Script flags */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2">
              {sa.scripts.hasEvalUsage ? (
                <XCircle className="h-4 w-4 shrink-0 text-red-500" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              )}
              <span className="text-xs text-slate-600">eval() usage</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2">
              {sa.scripts.hasDocumentWrite ? (
                <XCircle className="h-4 w-4 shrink-0 text-red-500" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              )}
              <span className="text-xs text-slate-600">document.write()</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2">
              {sa.scripts.hasObfuscatedCode ? (
                <XCircle className="h-4 w-4 shrink-0 text-red-500" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              )}
              <span className="text-xs text-slate-600">Obfuscated code</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2">
              {sa.scripts.hasUnsafePatterns ? (
                <XCircle className="h-4 w-4 shrink-0 text-red-500" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              )}
              <span className="text-xs text-slate-600">Unsafe patterns</span>
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
            <div className="flex flex-wrap gap-1.5">
              {sa.scripts.thirdPartyDomains.map((domain) => (
                <Badge key={domain} variant="outline" className="border-slate-200 text-xs font-mono">
                  {domain}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Script List - Full detail */}
      {sa.scripts.scripts.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Server className="h-4 w-4 text-teal-500" />
              All Detected Scripts
              <Badge variant="secondary" className="ml-auto text-xs">
                {sa.scripts.scripts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {sa.scripts.scripts.map((script, idx) => {
                const catStyle = scriptCategories[script.category] || scriptCategories.unknown
                return (
                  <div
                    key={idx}
                    className={`rounded-lg p-3 ${script.isSuspicious ? 'bg-red-50 border border-red-100' : 'bg-slate-50'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {script.isSuspicious ? (
                          <AlertOctagon className="h-4 w-4 text-red-500" />
                        ) : script.type === 'external' ? (
                          <Link2 className="h-4 w-4 text-slate-400" />
                        ) : (
                          <Code className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={`text-xs ${catStyle.bg} ${catStyle.color} border-transparent`}>
                            {script.category}
                          </Badge>
                          <Badge variant="outline" className="border-transparent text-xs text-slate-400">
                            {script.type}
                          </Badge>
                          <span className="text-xs text-slate-400">{(script.size / 1024).toFixed(1)}KB</span>
                          {script.isSuspicious && (
                            <Badge variant="outline" className="border-red-200 bg-red-50 text-red-600 text-xs">
                              Suspicious
                            </Badge>
                          )}
                        </div>
                        <p className="break-all text-xs font-mono text-slate-500">
                          {script.src || 'inline script'}
                        </p>
                        {script.content && (
                          <p className="line-clamp-2 text-xs text-slate-400">{script.content.slice(0, 200)}</p>
                        )}
                        {script.reasons.length > 0 && (
                          <div className="space-y-0.5">
                            {script.reasons.map((reason, rIdx) => (
                              <p key={rIdx} className="text-xs text-red-500 flex items-center gap-1">
                                <Bug className="h-2.5 w-2.5 shrink-0" />
                                {reason}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
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

function DetailContentTab({ sa }: { sa: SiteAnalysis }) {
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
          {/* Additional content info */}
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-400">Language</p>
              <p className="mt-1 text-sm font-medium text-slate-700">{(sa.content.language || 'unknown').toUpperCase()}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-400">Frameworks</p>
              <p className="mt-1 text-sm font-medium text-slate-700">{sa.content.frameworks.length || 0}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-400">Open Graph Tags</p>
              <p className="mt-1 text-sm font-medium text-slate-700">{sa.content.openGraphTags}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-400">Structured Data</p>
              <Badge
                variant="outline"
                className={`mt-1 text-xs ${sa.content.structuredData ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-400'}`}
              >
                {sa.content.structuredData ? 'Found' : 'Not Found'}
              </Badge>
            </div>
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
                <ul className="space-y-1.5">
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
            {sa.reputation.sslCertificate.issuer && (
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-400">SSL Issuer</p>
                <p className="mt-1 text-sm font-medium text-slate-700">{sa.reputation.sslCertificate.issuer}</p>
              </div>
            )}
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

function DetailReportTab({ sa }: { sa: SiteAnalysis }) {
  return (
    <div className="space-y-6">
      {/* Overall Risk Summary */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <ShieldAlert className="h-4 w-4 text-teal-500" />
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
    </div>
  )
}

function ComprehensiveAnalysis({ sa }: { sa: SiteAnalysis }) {
  return (
    <div className="space-y-6">
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
          <DetailOverviewTab sa={sa} />
        </TabsContent>
        <TabsContent value="security">
          <DetailSecurityTab sa={sa} />
        </TabsContent>
        <TabsContent value="scripts">
          <DetailScriptsTab sa={sa} />
        </TabsContent>
        <TabsContent value="content">
          <DetailContentTab sa={sa} />
        </TabsContent>
        <TabsContent value="report">
          <DetailReportTab sa={sa} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Main Detail Page ─────────────────────────────────────────────────────────

export function ScanDetailPage() {
  const { selectedScanId, setCurrentView } = useAppStore()
  const [scan, setScan] = useState<ScanDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!selectedScanId) return

    async function fetchScan() {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/scans/${selectedScanId}`)
        if (res.ok) {
          const data = await res.json()
          setScan(data.scan)
        } else {
          toast.error('Failed to load scan details')
          setCurrentView('history')
        }
      } catch {
        toast.error('Network error')
        setCurrentView('history')
      } finally {
        setIsLoading(false)
      }
    }
    fetchScan()
  }, [selectedScanId, setCurrentView])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    )
  }

  if (!scan) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <p className="text-slate-500">Scan not found</p>
        <Button variant="outline" onClick={() => setCurrentView('history')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to History
        </Button>
      </div>
    )
  }

  const config = RISK_CONFIG[scan.riskLevel] || RISK_CONFIG.LOW
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-4 md:p-6"
    >
      {/* Back button */}
      <Button
        variant="ghost"
        className="gap-2 text-slate-500 hover:text-slate-700"
        onClick={() => setCurrentView('history')}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to History
      </Button>

      {/* Result Banner */}
      <div className={`rounded-xl border p-6 ${config.bg} ${config.border}`}>
        <div className="flex items-center gap-4">
          <div className={`rounded-full p-3 ${config.bg}`}>
            <Icon className={`h-8 w-8 ${config.text}`} />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${config.text}`}>{config.label}</h2>
            <p className="text-sm text-slate-500">
              Confidence: <span className="font-semibold text-slate-700">{(scan.confidenceScore * 100).toFixed(0)}%</span>
              {scan.threatType && <> &middot; Threat: <span className="font-semibold text-slate-700">{scan.threatType}</span></>}
            </p>
          </div>
        </div>
      </div>

      {/* URL Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Globe className="h-4 w-4 text-teal-500" />
            URL Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-400">Full URL</p>
              <p className="break-all text-sm font-medium text-slate-900">{scan.originalUrl}</p>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-slate-400">Protocol</p>
                <p className="text-sm font-medium text-slate-700">{scan.protocol}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Domain</p>
                <p className="text-sm font-medium text-slate-700">{scan.domain}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Path</p>
                <p className="text-sm font-medium text-slate-700">{scan.path || '/'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Query Params</p>
                <p className="text-sm font-medium text-slate-700">{scan.queryParams || 'None'}</p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400">Scanned</p>
                  <p className="text-sm font-medium text-slate-700">
                    {new Date(scan.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400">Processing Time</p>
                  <p className="text-sm font-medium text-slate-700">{scan.processingTimeMs}ms</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={`border-0 ${config.bg} ${config.text}`}
                >
                  {scan.riskLevel}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Info className="h-4 w-4 text-teal-500" />
            Feature Breakdown (17 Features)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scan.features
                  ? Object.entries(scan.features).map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell className="text-sm text-slate-600">
                          {featureLabels[key] || key}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium text-slate-700">
                          {typeof value === 'boolean'
                            ? value
                              ? 'Yes'
                              : 'No'
                            : typeof value === 'number'
                            ? value.toFixed(2)
                            : String(value)}
                        </TableCell>
                      </TableRow>
                    ))
                  : (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-slate-400">
                          No features available
                        </TableCell>
                      </TableRow>
                    )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Details & Recommendations */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Analysis Details</CardTitle>
          </CardHeader>
          <CardContent>
            {scan.details && scan.details.length > 0 ? (
              <ul className="space-y-2">
                {scan.details.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                    {d}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">No additional details</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            {scan.recommendations && scan.recommendations.length > 0 ? (
              <ul className="space-y-2">
                {scan.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="mt-0.5 shrink-0 text-teal-500">&#10132;</span>
                    {r}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-emerald-600">This URL appears safe to visit.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comprehensive Analysis - Only shown when siteAnalysis exists */}
      {scan.siteAnalysis && (
        <ComprehensiveAnalysis sa={scan.siteAnalysis} />
      )}
    </motion.div>
  )
}
