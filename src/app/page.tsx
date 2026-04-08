'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { LoadingSpinner } from '@/components/loading-spinner'
import { LandingPage } from '@/components/public/landing-page'
import { LoginPage } from '@/components/public/login-page'
import { RegisterPage } from '@/components/public/register-page'
import { AppSidebar } from '@/components/app/sidebar'
import { DashboardPage } from '@/components/app/dashboard-page'
import { ScannerPage } from '@/components/app/scanner-page'
import { ScanDetailPage } from '@/components/app/scan-detail-page'
import { HistoryPage } from '@/components/app/history-page'
import { AdminPage } from '@/components/app/admin-page'
import { ScrollArea } from '@/components/ui/scroll-area'

function PublicLayout() {
  const { currentView, setCurrentView } = useAppStore()

  switch (currentView) {
    case 'login':
      return <LoginPage onNavigate={(v) => setCurrentView(v)} />
    case 'register':
      return <RegisterPage onNavigate={(v) => setCurrentView(v)} />
    default:
      return <LandingPage onNavigate={(v) => setCurrentView(v)} />
  }
}

function AppViewRouter() {
  const { currentView } = useAppStore()

  switch (currentView) {
    case 'dashboard':
      return <DashboardPage />
    case 'scanner':
      return <ScannerPage />
    case 'scanDetail':
      return <ScanDetailPage />
    case 'history':
      return <HistoryPage />
    case 'admin':
      return <AdminPage />
    default:
      return <DashboardPage />
  }
}

function AuthenticatedLayout() {
  return (
    <div className="flex h-screen flex-col lg:flex-row overflow-hidden bg-slate-50">
      <AppSidebar />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Main content area */}
        <ScrollArea className="flex-1 overflow-hidden">
          <main className="min-h-full">
            <AppViewRouter />
          </main>
        </ScrollArea>
      </div>
    </div>
  )
}

export default function Home() {
  const { isLoading, isAuthenticated, initialize } = useAppStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-background">
      {isAuthenticated ? <AuthenticatedLayout /> : <PublicLayout />}
    </div>
  )
}
