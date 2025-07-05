"use client"

import { useState, useEffect, createContext, useContext, type ReactNode } from "react"

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  profile: {
    onboarding: {
      completed: boolean
      step: number
      deductionTypes: string[]
      selectedAccounts: string[]
      completedSteps: number[]
    }
    preferences: {
      financialYear: {
        start: string
        end: string
      }
      taxRate: number
      currency: string
    }
  }
  subscription: {
    plan: "free" | "premium"
    status: "active" | "cancelled" | "expired"
  }
  settings: {
    deductionToggles: Record<string, boolean>
    manualOverrides: Record<string, any>
    notifications: boolean
    autoSync: boolean
  }
  isEmailVerified: boolean
  basiqUserId?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (userData: any) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUser(data.user)
          // Store user info in localStorage for client-side access
          localStorage.setItem("user_authenticated", "true")
          localStorage.setItem("user_id", data.user.id)
          localStorage.setItem("user_email", data.user.email)
        } else {
          setUser(null)
          localStorage.removeItem("user_authenticated")
          localStorage.removeItem("user_id")
          localStorage.removeItem("user_email")
        }
      } else {
        setUser(null)
        localStorage.removeItem("user_authenticated")
        localStorage.removeItem("user_id")
        localStorage.removeItem("user_email")
      }
    } catch (error) {
      console.error("Failed to refresh user:", error)
      setUser(null)
      localStorage.removeItem("user_authenticated")
      localStorage.removeItem("user_id")
      localStorage.removeItem("user_email")
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const response = await fetch("/api/auth/signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || "Sign in failed")
    }

    setUser(data.user)
    localStorage.setItem("user_authenticated", "true")
    localStorage.setItem("user_id", data.user.id)
    localStorage.setItem("user_email", data.user.email)
  }

  const signUp = async (userData: any) => {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
      credentials: "include",
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || "Sign up failed")
    }

    setUser(data.user)
    localStorage.setItem("user_authenticated", "true")
    localStorage.setItem("user_id", data.user.id)
    localStorage.setItem("user_email", data.user.email)
  }

  const signOut = async () => {
    await fetch("/api/auth/signout", {
      method: "POST",
      credentials: "include",
    })
    setUser(null)
    localStorage.removeItem("user_authenticated")
    localStorage.removeItem("user_id")
    localStorage.removeItem("user_email")
  }

  useEffect(() => {
    refreshUser()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
