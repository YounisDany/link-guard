import { create } from 'zustand'

export interface User {
  id: string
  username: string
  email: string
  fullName?: string | null
  role: string
  avatar?: string | null
  createdAt: string
}

export type AppView = 'landing' | 'login' | 'register' | 'dashboard' | 'scanner' | 'scanDetail' | 'history' | 'admin'

interface AppState {
  // Auth
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean

  // Navigation
  currentView: AppView
  selectedScanId: string | null

  // Actions
  setUser: (user: User | null) => void
  setCurrentView: (view: AppView) => void
  setSelectedScanId: (id: string | null) => void
  logout: () => void
  initialize: () => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  currentView: 'landing',
  selectedScanId: null,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setCurrentView: (view) =>
    set({ currentView: view }),

  setSelectedScanId: (id) =>
    set({ selectedScanId: id }),

  logout: () => {
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    set({
      user: null,
      isAuthenticated: false,
      currentView: 'landing',
      selectedScanId: null,
    })
  },

  initialize: async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        if (data.user) {
          set({
            user: data.user,
            isAuthenticated: true,
            currentView: 'dashboard',
          })
        } else {
          set({ isLoading: false })
        }
      } else {
        set({ isLoading: false })
      }
    } catch {
      set({ isLoading: false })
    } finally {
      set({ isLoading: false })
    }
  },
}))
