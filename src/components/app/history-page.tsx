'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Trash2,
  Eye,
  Clock,
  Shield,
  AlertTriangle,
  Loader2,
  Filter,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { useAppStore } from '@/lib/store'

interface ScanRecord {
  id: string
  originalUrl: string
  domain: string
  protocol: string
  status: string
  createdAt: string
  isMalicious: boolean
  threatType: string | null
  confidenceScore: number
  riskLevel: string
  processingTimeMs: number
}

const RISK_COLORS: Record<string, string> = {
  LOW: 'bg-emerald-100 text-emerald-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
}

const PAGE_SIZE = 10

export function HistoryPage() {
  const { setCurrentView, setSelectedScanId } = useAppStore()
  const [scans, setScans] = useState<ScanRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchScans = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/scans')
      if (res.ok) {
        const data = await res.json()
        setScans(data.scans)
      }
    } catch {
      toast.error('Failed to load scan history')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchScans()
  }, [fetchScans])

  const filteredScans = useMemo(() => {
    let result = scans

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (s) =>
          s.originalUrl.toLowerCase().includes(q) ||
          s.domain.toLowerCase().includes(q) ||
          (s.threatType && s.threatType.toLowerCase().includes(q))
      )
    }

    if (riskFilter !== 'all') {
      result = result.filter((s) => s.riskLevel === riskFilter)
    }

    return result
  }, [scans, search, riskFilter])

  const totalPages = Math.max(1, Math.ceil(filteredScans.length / PAGE_SIZE))
  const paginatedScans = filteredScans.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search, riskFilter])

  const handleView = (scanId: string) => {
    setSelectedScanId(scanId)
    setCurrentView('scanDetail')
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/scans/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Scan deleted successfully')
        setScans((prev) => prev.filter((s) => s.id !== deleteId))
      } else {
        toast.error('Failed to delete scan')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-4 md:p-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Scan History</h1>
        <p className="text-slate-500">View and manage all your past URL scans</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by URL, domain, or threat type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 pl-9"
              />
            </div>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="h-10 w-full sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4 text-slate-400" />
                <SelectValue placeholder="Filter by risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="LOW">Safe</SelectItem>
                <SelectItem value="MEDIUM">Suspicious</SelectItem>
                <SelectItem value="HIGH">High Risk</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
            </div>
          ) : paginatedScans.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 text-xs">#</TableHead>
                    <TableHead className="text-xs">URL</TableHead>
                    <TableHead className="hidden text-xs sm:table-cell">Domain</TableHead>
                    <TableHead className="text-xs">Risk Level</TableHead>
                    <TableHead className="hidden text-xs md:table-cell">Confidence</TableHead>
                    <TableHead className="hidden text-xs lg:table-cell">Threat Type</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedScans.map((scan, index) => (
                    <TableRow key={scan.id}>
                      <TableCell className="text-xs text-slate-400">
                        {(page - 1) * PAGE_SIZE + index + 1}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="truncate text-sm font-medium text-slate-900" title={scan.originalUrl}>
                          {scan.originalUrl}
                        </p>
                      </TableCell>
                      <TableCell className="hidden max-w-[150px] sm:table-cell">
                        <p className="truncate text-sm text-slate-500">{scan.domain}</p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`border-0 text-xs ${RISK_COLORS[scan.riskLevel] || RISK_COLORS.LOW}`}
                        >
                          {scan.riskLevel}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
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
                              style={{ width: `${scan.confidenceScore * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">
                            {(scan.confidenceScore * 100).toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-xs text-slate-500 lg:table-cell">
                        {scan.threatType || '-'}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(scan.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-teal-600"
                            onClick={() => handleView(scan.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <AlertDialog
                            open={deleteId === scan.id}
                            onOpenChange={(open) => !open && setDeleteId(null)}
                          >
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-red-600"
                                onClick={() => setDeleteId(scan.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Scan</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this scan? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDelete}
                                  disabled={isDeleting}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  {isDeleting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : null}
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Clock className="h-10 w-10 text-slate-300" />
              <p className="text-sm text-slate-500">
                {scans.length === 0
                  ? 'No scans yet. Start by scanning a URL!'
                  : 'No scans match your filter criteria.'}
              </p>
              {scans.length === 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-teal-600 hover:bg-teal-50"
                  onClick={() => setCurrentView('scanner')}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Scan a URL
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-slate-500">
            Showing {(page - 1) * PAGE_SIZE + 1} to{' '}
            {Math.min(page * PAGE_SIZE, filteredScans.length)} of {filteredScans.length} results
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
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, i, arr) => (
                <span key={p} className="flex items-center gap-2">
                  {i > 0 && arr[i - 1] !== p - 1 && <span className="text-slate-400">...</span>}
                  <Button
                    variant={page === p ? 'default' : 'outline'}
                    size="sm"
                    className={page === p ? 'btn-teal-gradient border-0 text-white hover:text-white' : ''}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                </span>
              ))}
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
    </motion.div>
  )
}
