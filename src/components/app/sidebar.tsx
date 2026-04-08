'use client'

import { Shield, LayoutDashboard, Search, Clock, ShieldAlert, LogOut, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { useAppStore, type AppView } from '@/lib/store'
import { useState } from 'react'

interface NavItem {
  icon: React.ElementType
  label: string
  view: AppView
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', view: 'dashboard' },
  { icon: Search, label: 'Scan URL', view: 'scanner' },
  { icon: Clock, label: 'History', view: 'history' },
  { icon: ShieldAlert, label: 'Admin Panel', view: 'admin', adminOnly: true },
]

function SidebarContent({ onNavigate }: { onNavigate: (view: AppView) => void }) {
  const { user, currentView, logout } = useAppStore()

  const filteredItems = navItems.filter((item) => !item.adminOnly || user?.role === 'ADMIN')

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6">
        <Shield className="h-7 w-7 text-teal-400" />
        <span className="text-lg font-bold text-white">LinkGuard</span>
      </div>

      <Separator className="bg-slate-700/50" />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {filteredItems.map((item) => {
          const isActive = currentView === item.view
          return (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-teal-500/15 text-teal-400'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? 'text-teal-400' : ''}`} />
              {item.label}
            </button>
          )
        })}
      </nav>

      <Separator className="bg-slate-700/50" />

      {/* User Info */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-slate-700">
            <AvatarFallback className="bg-teal-500/20 text-sm text-teal-400">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-white">{user?.username || 'User'}</p>
            <Badge
              variant="outline"
              className={`mt-0.5 border-0 text-[10px] ${
                user?.role === 'ADMIN'
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'bg-teal-500/15 text-teal-400'
              }`}
            >
              {user?.role || 'USER'}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="mt-3 w-full justify-start gap-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}

export function AppSidebar() {
  const { setCurrentView } = useAppStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleNavigate = (view: AppView) => {
    setCurrentView(view)
    setMobileOpen(false)
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-slate-900 lg:flex">
        <SidebarContent onNavigate={handleNavigate} />
      </aside>

      {/* Mobile Header & Drawer */}
      <div className="flex flex-col lg:hidden shrink-0">
        {/* Mobile Top Bar */}
        <header className="flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-600">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-slate-900 p-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SidebarContent onNavigate={handleNavigate} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-teal-500" />
            <span className="text-sm font-bold text-slate-900">LinkGuard</span>
          </div>
        </header>

        {/* Mobile content is rendered by the parent */}
      </div>
    </>
  )
}
