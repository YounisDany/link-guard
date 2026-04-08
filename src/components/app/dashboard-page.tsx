'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Activity,
  TrendingUp,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { useAppStore } from '@/lib/store'

interface ScanRecord {
  id: string
  originalUrl: string
  domain: string
  riskLevel: string
  confidenceScore: number
  createdAt: string
}

interface DashboardStats {
  totalScans: number
  maliciousCount: number
  safeCount: number
  suspiciousCount: number
  recentScans: {
    date: string
    total: number
    safe: number
    suspicious: number
    malicious: number
  }[]
}

const RISK_COLORS: Record<string, string> = {
  LOW: 'bg-emerald-100 text-emerald-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
}

function getRiskBadge(level: string) {
  return RISK_COLORS[level] || RISK_COLORS.LOW
}

export function DashboardPage() {
  const { setCurrentView, setSelectedScanId } = useAppStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentScans, setRecentScans] = useState<ScanRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, scansRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/scans'),
        ])

        if (statsRes.ok) {
          const data = await statsRes.json()
          setStats(data.stats)
        }

        if (scansRes.ok) {
          const data = await scansRes.json()
          setRecentScans(data.scans.slice(0, 5))
        }
      } catch {
        // Error handled silently
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const detectionRate =
    stats && stats.totalScans > 0
      ? (((stats.maliciousCount + stats.suspiciousCount) / stats.totalScans) * 100).toFixed(1)
      : '0'

  const riskDistribution = [
    { name: 'Safe', value: stats?.safeCount || 0, color: '#10b981' },
    { name: 'Suspicious', value: stats?.suspiciousCount || 0, color: '#f59e0b' },
    { name: 'High Risk', value: 0, color: '#f97316' },
    { name: 'Critical', value: stats?.maliciousCount || 0, color: '#ef4444' },
  ]

  const chartData = (stats?.recentScans || []).map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    safe: d.safe,
    suspicious: d.suspicious,
    malicious: d.malicious,
  }))

  const statCards = [
    {
      title: 'Total Scans',
      value: stats?.totalScans || 0,
      icon: Activity,
      trend: '+12% this week',
      color: 'text-teal-500',
      bg: 'bg-teal-50',
    },
    {
      title: 'Threats Detected',
      value: (stats?.maliciousCount || 0) + (stats?.suspiciousCount || 0),
      icon: ShieldAlert,
      trend: `${stats ? ((stats.maliciousCount / Math.max(stats.totalScans, 1)) * 100).toFixed(0) : 0}% of scans`,
      color: 'text-red-500',
      bg: 'bg-red-50',
    },
    {
      title: 'Safe URLs',
      value: stats?.safeCount || 0,
      icon: ShieldCheck,
      trend: `${stats ? ((stats.safeCount / Math.max(stats.totalScans, 1)) * 100).toFixed(0) : 0}% of scans`,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Detection Rate',
      value: `${detectionRate}%`,
      icon: TrendingUp,
      trend: 'Threats caught',
      color: 'text-amber-500',
      bg: 'bg-amber-50',
    },
  ]

  const handleViewScan = (scanId: string) => {
    setSelectedScanId(scanId)
    setCurrentView('scanDetail')
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Overview of your URL scanning activity</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {isLoading ? (
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="mb-3 h-4 w-24" />
                  <Skeleton className="mb-2 h-8 w-16" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ) : (
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500">{card.title}</p>
                    <div className={`rounded-lg ${card.bg} p-2`}>
                      <card.icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                  </div>
                  <p className="mt-3 text-2xl font-bold text-slate-900">{card.value}</p>
                  <p className="mt-1 text-xs text-slate-400">{card.trend}</p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Threat Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Threat Detection Trends</CardTitle>
            <p className="text-sm text-slate-500">Daily scan results over the last 7 days</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="safe"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.15}
                    name="Safe"
                  />
                  <Area
                    type="monotone"
                    dataKey="suspicious"
                    stackId="1"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.15}
                    name="Suspicious"
                  />
                  <Area
                    type="monotone"
                    dataKey="malicious"
                    stackId="1"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.15}
                    name="Malicious"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-slate-400">
                No data yet. Start scanning URLs!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Risk Distribution</CardTitle>
            <p className="text-sm text-slate-500">Breakdown of scan results by risk level</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : stats && stats.totalScans > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {riskDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-slate-400">
                No data yet. Start scanning URLs!
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Scans */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Recent Scans</CardTitle>
            <p className="text-sm text-slate-500">Your most recent URL scans</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-teal-600 hover:text-teal-700"
            onClick={() => setCurrentView('history')}
          >
            View All
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentScans.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-medium text-slate-500">URL</TableHead>
                    <TableHead className="text-xs font-medium text-slate-500">Risk Level</TableHead>
                    <TableHead className="text-xs font-medium text-slate-500">Confidence</TableHead>
                    <TableHead className="text-xs font-medium text-slate-500">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentScans.map((scan) => (
                    <TableRow
                      key={scan.id}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => handleViewScan(scan.id)}
                    >
                      <TableCell className="max-w-[250px]">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {scan.originalUrl}
                        </p>
                        <p className="truncate text-xs text-slate-400">{scan.domain}</p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`border-0 text-xs ${getRiskBadge(scan.riskLevel)}`}
                        >
                          {scan.riskLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${
                                scan.confidenceScore > 0.7
                                  ? 'bg-emerald-500'
                                  : scan.confidenceScore > 0.4
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              }`}
                              style={{
                                width: `${scan.confidenceScore * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">
                            {(scan.confidenceScore * 100).toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {new Date(scan.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Shield className="mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm text-slate-500">No scans yet. Start by scanning a URL!</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 text-teal-600 hover:bg-teal-50"
                onClick={() => setCurrentView('scanner')}
              >
                Scan a URL
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
