'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, getStoredUser, setStoredUser, clearStoredUser } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (user: User) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check localStorage for existing session
    const storedUser = getStoredUser()
    if (storedUser) {
      setUser(storedUser)
    }
    setLoading(false)
  }, [])

  const login = async (userData: User) => {
    setStoredUser(userData)
    setUser(userData)
  }

  const logout = async () => {
    clearStoredUser()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

