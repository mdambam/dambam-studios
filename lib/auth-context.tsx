'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiGet } from './api'

export interface User {
  id: string
  email: string
  name: string
  credits: number
  isAdmin?: boolean
  subscription?: string
  createdAt?: string
  updatedAt?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Load user data on initial load
  const loadUser = useCallback(async () => {
    try {
      const { data } = await apiGet<{ status: string; data?: { user: User } }>('/api/auth/me')
      if (data?.data?.user) setUser(data.data.user)
      else setUser(null)
    } catch (error) {
      console.error('Failed to load user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }

      // Backend returns { token, user: {...} } directly, or in a different format?
      // Looking at server.js: res.json({ token, user: ... })
      if (data.token && data.user) {
        setUser(data.user)
      } else if (data.status === 'success' && data.data) {
        // Fallback for previous structure if any
        setUser(data.data.user)
      } else {
        throw new Error(data.message || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const signup = useCallback(async (name: string, email: string, password: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, username: name }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed')
      }

      // Backend now returns { message, token, user }
      if (data.token && data.user) {
        setUser(data.user)
      } else if (data.status === 'success' && data.data) {
        setUser(data.data.user)
      } else {
        // Auto-login might failed, but user created? 
        // For now assume if no user returned, throw error.
        throw new Error(data.message || 'Signup failed')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      // Call the logout API to clear the HTTP-only cookie
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Error during logout:', error)
    } finally {
      // Clear client-side state
      setUser(null)
      // Redirect to login page
      router.push('/login')
    }
  }, [router])

  const refreshUser = useCallback(async () => {
    await loadUser()
  }, [loadUser])

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
