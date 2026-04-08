'use client'

import { Shield } from 'lucide-react'

export function LoadingSpinner() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="relative">
        <Shield className="h-12 w-12 animate-pulse text-teal-500" />
        <div className="absolute inset-0 animate-ping rounded-full bg-teal-500/20" />
      </div>
      <h2 className="text-xl font-bold text-slate-900">LinkGuard</h2>
      <p className="text-sm text-slate-500">Loading...</p>
    </div>
  )
}
