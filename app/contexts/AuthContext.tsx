"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { apiClient } from "../lib/api-client"

interface User {
  id: string
  email: string
  username: string
  role: "user" | "admin" // Add role property
}

// Helper function to check if a JWT token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    if (payload.exp * 1000 < Date.now()) {
      return true // Token is expired
    }
    return false // Token is not expired
  } catch (e) {
    console.error("Error decoding or checking token expiration:", e)
    return true // Assume expired or invalid if decoding fails
  }
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; field?: string }>
  register: (email: string, username: string, password: string) => Promise<{ success: boolean; error?: string; field?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("auth_token")
    const savedUser = localStorage.getItem("user")

    if (token && savedUser) {
      if (isTokenExpired(token)) {
        console.log("Auth token expired. Logging out.")
        logout() // Clear expired token and user
      } else {
        setUser(JSON.parse(savedUser))
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; field?: string }> => {
    try {
      const response = await apiClient.login(email, password)
      setUser(response.user)
      localStorage.setItem("user", JSON.stringify(response.user))
      return { success: true }
    } catch (error: any) {
      console.error("Login failed:", error)
      logout()
      return { success: false, error: error.details || error.message || "Login failed", field: error.field }
    }
  }

  const register = async (email: string, username: string, password: string): Promise<{ success: boolean; error?: string; field?: string }> => {
    try {
      await apiClient.register(email, username, password)
      return { success: true }
    } catch (error: any) {
      console.error("Registration failed:", error)
      return { success: false, error: error.details || error.message || "Registration failed", field: error.field }
    }
  }

  const logout = () => {
    setUser(null)
    apiClient.clearToken()
    localStorage.removeItem("user")
  }

  return <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
