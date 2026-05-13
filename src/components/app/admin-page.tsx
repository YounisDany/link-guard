'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import {
  Users,
  Shield,
  Activity,
  Database,
  Loader2,
  ChevronDown,
  UserCog,
  UserX,
  Trash2,
  RefreshCw,
  Search,
  Download,
  ExternalLink,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ScanLine,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface AdminUser {
  id: string
  username: string
  email: string
  fullName: string | null
  role: string
  isActive: boolean
  avatar: string | null
  createdAt: string
  updatedAt: string
  _count: { scans: number }
}

interface SystemStats {
  totalScans: number
  maliciousCount: number
  safeCount: number
  suspiciousCount: number
  systemStats?: {
    totalUsers: number
    activeUsers: number
    activeUsersToday: number
    totalSystemScans: number
    totalMaliciousSystem: number
  }
}

interface AdminScanRow {
  id: string
  originalUrl: string
  domain: string
  createdAt: string
  user: { id: string; username: string; email: string } | null
  result: { isMalicious: boolean; riskLevel: string; confidenceScore: number; threatType: string | null } | null
}

interface ReportData {
  totals: { total: number; safe: number; suspicious: number; malicious: number }
  dailyBreakdown: { day: string; total: number; safe: number; suspicious: number; malicious: number }[]
  topDomains: { domain: string; total: number; malicious: number }[]
  topThreats: { type: string; count: number }[]
  topUsers: { id: string; username: string; email: string; _count: { scans: number } }[]
}

export function AdminPage() {
  const { setCurrentView } = useAppStore()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [isSeeding, setIsSeeding] = useState(false)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const limit = 10

  const [scans, setScans] = useState<AdminScanRow[]>([])
  const [scansTotal, setScansTotal] = useState(0)
  const [scansPage, setScansPage] = useState(1)
  const [scansQuery, setScansQuery] = useState('')
  const [scansVerdict, setScansVerdict] = useState<string>('all')
  const [isLoadingScans, setIsLoadingScans] = useState(false)

  const [report, setReport] = useState<ReportData | null>(null)
  const [isLoadingReport, setIsLoadingReport] = useState(false)

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/users?page=${page}&limit=${limit}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
        setTotalUsers(data.total)
      } else if (res.status === 403) {
        toast.error('Admin access required')
      }
    } catch {
      toast.error('Failed to load users')
    }
  }, [page])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
      }
    } catch {
      // silent
    }
  }, [])

  const fetchScans = useCallback(async () => {
    setIsLoadingScans(true)
    try {
      const params = new URLSearchParams({
        page: String(scansPage),
        limit: '20',
      })
      if (scansQuery.trim()) params.set('q', scansQuery.trim())
      if (scansVerdict !== 'all') params.set('verdict', scansVerdict)
      const res = await fetch(`/api/admin/scans?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setScans(data.scans)
        setScansTotal(data.total)
      } else if (res.status === 403) {
        toast.error('Admin access required')
      }
    } catch {
      toast.error('Failed to load scans')
    } finally {
      setIsLoadingScans(false)
    }
  }, [scansPage, scansQuery, scansVerdict])

  const fetchReport = useCallback(async () => {
    setIsLoadingReport(true)
    try {
      const res = await fetch('/api/admin/reports')
      if (res.ok) {
        const data = await res.json()
        setReport(data)
      }
    } catch {
      toast.error('Failed to load reports')
    } finally {
      setIsLoadingReport(false)
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchUsers(), fetchStats()]).finally(() => setIsLoading(false))
  }, [fetchUsers, fetchStats])

  useEffect(() => {
    fetchScans()
  }, [fetchScans])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const totalPages = Math.max(1, Math.ceil(totalUsers / limit))

  const handleSeedData = async () => {
    setIsSeeding(true)
    try {
      const res = await fetch('/api/admin/seed', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Demo data seeded successfully')
        fetchUsers()
        fetchStats()
      } else {
        toast.error(data.error || 'Failed to seed data')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setIsSeeding(false)
    }
  }

  const handleRoleChange = async (userId: string, role: string) => {
    setUpdatingUserId(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (res.ok) {
        toast.success('User role updated')
        fetchUsers()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update role')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    setUpdatingUserId(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })
      if (res.ok) {
        toast.success(isActive ? 'User deactivated' : 'User activated')
        fetchUsers()
        fetchStats()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update user')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    setUpdatingUserId(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('User deleted')
        fetchUsers()
        fetchStats()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete user')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setUpdatingUserId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    )
  }

  const systemStats = stats?.systemStats

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-4 md:p-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
          <p className="text-slate-500">Manage users and view system statistics</p>
        </div>
        <Button
          onClick={handleSeedData}
          disabled={isSeeding}
          className="btn-teal-gradient gap-2 border-0 text-white hover:text-white"
        >
          <Database className="h-4 w-4" />
          {isSeeding ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Seeding...
            </>
          ) : (
            'Seed Demo Data'
          )}
        </Button>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">المستخدمون</TabsTrigger>
          <TabsTrigger value="scans">الفحوصات</TabsTrigger>
          <TabsTrigger value="reports">التقارير</TabsTrigger>
          <TabsTrigger value="stats">إحصائيات النظام</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* Stats Row */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-teal-50 p-2">
                    <Users className="h-5 w-5 text-teal-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total Users</p>
                    <p className="text-xl font-bold text-slate-900">{totalUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-50 p-2">
                    <Activity className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Active Today</p>
                    <p className="text-xl font-bold text-slate-900">
                      {systemStats?.activeUsersToday || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-amber-50 p-2">
                    <RefreshCw className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Active Users</p>
                    <p className="text-xl font-bold text-slate-900">
                      {systemStats?.activeUsers || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Username</TableHead>
                      <TableHead className="hidden text-xs sm:table-cell">Email</TableHead>
                      <TableHead className="text-xs">Role</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="hidden text-xs md:table-cell">Scans</TableHead>
                      <TableHead className="hidden text-xs lg:table-cell">Created</TableHead>
                      <TableHead className="text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length > 0 ? (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium text-slate-900">{user.username}</p>
                              {user.fullName && (
                                <p className="text-xs text-slate-400">{user.fullName}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden text-sm text-slate-500 sm:table-cell">
                            {user.email}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={user.role}
                              onValueChange={(val) => handleRoleChange(user.id, val)}
                              disabled={updatingUserId === user.id}
                            >
                              <SelectTrigger className="h-8 w-[100px] border-0 bg-transparent p-0 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USER">USER</SelectItem>
                                <SelectItem value="ADMIN">ADMIN</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={`border-0 text-xs ${
                                user.isActive
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden text-sm text-slate-500 md:table-cell">
                            {user._count.scans}
                          </TableCell>
                          <TableCell className="hidden text-xs text-slate-500 lg:table-cell whitespace-nowrap">
                            {new Date(user.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 ${
                                  user.isActive
                                    ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
                                    : 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50'
                                }`}
                                onClick={() => handleToggleActive(user.id, user.isActive)}
                                disabled={updatingUserId === user.id}
                                title={user.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {user.isActive ? (
                                  <UserX className="h-4 w-4" />
                                ) : (
                                  <UserCog className="h-4 w-4" />
                                )}
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                    disabled={updatingUserId === user.id}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete user &quot;{user.username}&quot;? This
                                      will also delete all their scan data.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteUser(user.id)}
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12 text-center text-slate-400">
                          No users found. Seed demo data to get started!
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* System Stats Tab */}
        <TabsContent value="stats" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-teal-50 p-2">
                    <Shield className="h-5 w-5 text-teal-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total Users</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {systemStats?.totalUsers || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-50 p-2">
                    <Users className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Active Users</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {systemStats?.activeUsers || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-amber-50 p-2">
                    <Activity className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Active Today</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {systemStats?.activeUsersToday || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-slate-50 p-2">
                    <Shield className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total System Scans</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {systemStats?.totalSystemScans || stats?.totalScans || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-red-50 p-2">
                    <Shield className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Malicious URLs Found</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {systemStats?.totalMaliciousSystem || stats?.maliciousCount || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-50 p-2">
                    <Shield className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Safe URLs</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {stats?.safeCount || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* All Scans Tab */}
        <TabsContent value="scans" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base">جميع فحوصات النظام</CardTitle>
                  <p className="mt-1 text-xs text-slate-500">
                    اطّلع على كل رابط فحصه أي مستخدم. {scansTotal} نتيجة.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentView('scanner')}
                    className="gap-1"
                  >
                    <ScanLine className="h-4 w-4" />
                    افحص رابط
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open('/api/admin/export', '_blank')}
                    className="gap-1"
                  >
                    <Download className="h-4 w-4" />
                    تصدير CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute right-2 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="ابحث في الرابط، النطاق، اسم المستخدم أو البريد..."
                    value={scansQuery}
                    onChange={(e) => {
                      setScansQuery(e.target.value)
                      setScansPage(1)
                    }}
                    className="pr-8 text-sm"
                  />
                </div>
                <Select
                  value={scansVerdict}
                  onValueChange={(v) => {
                    setScansVerdict(v)
                    setScansPage(1)
                  }}
                >
                  <SelectTrigger className="sm:w-40 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الأحكام</SelectItem>
                    <SelectItem value="safe">آمن</SelectItem>
                    <SelectItem value="suspicious">مشبوه</SelectItem>
                    <SelectItem value="malicious">خبيث</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">الرابط</TableHead>
                      <TableHead className="text-xs">المستخدم</TableHead>
                      <TableHead className="text-xs">الحكم</TableHead>
                      <TableHead className="hidden text-xs md:table-cell">المستوى</TableHead>
                      <TableHead className="hidden text-xs lg:table-cell">التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingScans ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center">
                          <Loader2 className="mx-auto h-5 w-5 animate-spin text-teal-500" />
                        </TableCell>
                      </TableRow>
                    ) : scans.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-sm text-slate-500">
                          لا توجد فحوصات مطابقة.
                        </TableCell>
                      </TableRow>
                    ) : (
                      scans.map((s) => {
                        const verdict = s.result?.isMalicious
                          ? 'malicious'
                          : s.result?.riskLevel === 'MEDIUM' || s.result?.riskLevel === 'HIGH'
                            ? 'suspicious'
                            : 'safe'
                        return (
                          <TableRow key={s.id}>
                            <TableCell className="max-w-[280px] truncate font-mono text-xs" dir="ltr" title={s.originalUrl}>
                              {s.originalUrl}
                            </TableCell>
                            <TableCell className="text-xs">
                              {s.user ? (
                                <div>
                                  <div className="font-medium text-slate-900">{s.user.username}</div>
                                  <div className="text-[10px] text-slate-500">{s.user.email}</div>
                                </div>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {verdict === 'malicious' ? (
                                <Badge variant="destructive" className="gap-1 text-[10px]">
                                  <XCircle className="h-3 w-3" />
                                  خبيث
                                </Badge>
                              ) : verdict === 'suspicious' ? (
                                <Badge className="gap-1 bg-amber-500 text-[10px] text-white hover:bg-amber-500">
                                  <AlertTriangle className="h-3 w-3" />
                                  مشبوه
                                </Badge>
                              ) : (
                                <Badge className="gap-1 bg-emerald-500 text-[10px] text-white hover:bg-emerald-500">
                                  <CheckCircle2 className="h-3 w-3" />
                                  آمن
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="hidden text-xs md:table-cell">
                              <span className="font-mono">{s.result?.riskLevel || '—'}</span>
                              {s.result?.confidenceScore != null && (
                                <span className="ml-1 text-slate-400">({Math.round(s.result.confidenceScore)})</span>
                              )}
                            </TableCell>
                            <TableCell className="hidden text-xs text-slate-500 lg:table-cell">
                              {new Date(s.createdAt).toLocaleString('ar-SA')}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {scansTotal > 20 && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-500">
                    صفحة {scansPage} من {Math.max(1, Math.ceil(scansTotal / 20))}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={scansPage === 1}
                      onClick={() => setScansPage(scansPage - 1)}
                    >
                      السابق
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={scansPage >= Math.ceil(scansTotal / 20)}
                      onClick={() => setScansPage(scansPage + 1)}
                    >
                      التالي
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          {isLoadingReport || !report ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid gap-3 sm:grid-cols-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-slate-50 p-2">
                        <TrendingUp className="h-5 w-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">إجمالي (30 يوم)</p>
                        <p className="text-xl font-bold text-slate-900">{report.totals.total}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-emerald-50 p-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">آمنة</p>
                        <p className="text-xl font-bold text-emerald-700">{report.totals.safe}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-amber-50 p-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">مشبوهة</p>
                        <p className="text-xl font-bold text-amber-700">{report.totals.suspicious}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-red-50 p-2">
                        <XCircle className="h-5 w-5 text-red-500" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">خبيثة</p>
                        <p className="text-xl font-bold text-red-700">{report.totals.malicious}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Daily chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">الفحوصات اليومية (آخر 30 يوم)</CardTitle>
                </CardHeader>
                <CardContent>
                  <DailyBars data={report.dailyBreakdown} />
                  <div className="mt-3 flex gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="h-3 w-3 rounded bg-emerald-400" /> آمن
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-3 w-3 rounded bg-amber-400" /> مشبوه
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-3 w-3 rounded bg-red-500" /> خبيث
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">أكثر النطاقات فحصاً</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">النطاق</TableHead>
                          <TableHead className="text-xs">الفحوصات</TableHead>
                          <TableHead className="text-xs">منها خبيثة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.topDomains.map((d) => (
                          <TableRow key={d.domain}>
                            <TableCell className="font-mono text-xs" dir="ltr">{d.domain}</TableCell>
                            <TableCell className="text-xs font-semibold">{d.total}</TableCell>
                            <TableCell className="text-xs font-semibold text-red-600">{d.malicious}</TableCell>
                          </TableRow>
                        ))}
                        {report.topDomains.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="py-6 text-center text-xs text-slate-500">
                              لا بيانات
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">أبرز أنواع التهديدات</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">نوع التهديد</TableHead>
                          <TableHead className="text-xs">مرات الظهور</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.topThreats.map((t) => (
                          <TableRow key={t.type}>
                            <TableCell className="text-xs">{t.type}</TableCell>
                            <TableCell className="text-xs font-semibold">{t.count}</TableCell>
                          </TableRow>
                        ))}
                        {report.topThreats.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={2} className="py-6 text-center text-xs text-slate-500">
                              لم تُرصد تهديدات
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">أكثر المستخدمين نشاطاً</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">اسم المستخدم</TableHead>
                        <TableHead className="text-xs">البريد</TableHead>
                        <TableHead className="text-xs">عدد الفحوصات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.topUsers.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="text-xs font-medium">{u.username}</TableCell>
                          <TableCell className="text-xs" dir="ltr">{u.email}</TableCell>
                          <TableCell className="text-xs font-semibold">{u._count.scans}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}

function DailyBars({ data }: { data: { day: string; total: number; safe: number; suspicious: number; malicious: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.total))
  return (
    <div className="flex h-40 items-end gap-1">
      {data.map((d) => {
        const safeH = (d.safe / max) * 100
        const susH = (d.suspicious / max) * 100
        const malH = (d.malicious / max) * 100
        return (
          <div
            key={d.day}
            className="group relative flex h-full flex-1 flex-col-reverse overflow-hidden rounded-sm bg-slate-100"
            title={`${d.day}\nآمن: ${d.safe} | مشبوه: ${d.suspicious} | خبيث: ${d.malicious}`}
          >
            {malH > 0 && <div style={{ height: `${malH}%` }} className="w-full bg-red-500" />}
            {susH > 0 && <div style={{ height: `${susH}%` }} className="w-full bg-amber-400" />}
            {safeH > 0 && <div style={{ height: `${safeH}%` }} className="w-full bg-emerald-400" />}
          </div>
        )
      })}
    </div>
  )
}
