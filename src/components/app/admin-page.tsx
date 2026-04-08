'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
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
} from 'lucide-react'
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

export function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [isSeeding, setIsSeeding] = useState(false)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const limit = 10

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

  useEffect(() => {
    Promise.all([fetchUsers(), fetchStats()]).finally(() => setIsLoading(false))
  }, [fetchUsers, fetchStats])

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
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="stats">System Stats</TabsTrigger>
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
      </Tabs>
    </motion.div>
  )
}
