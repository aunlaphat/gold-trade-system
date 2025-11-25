"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/app/contexts/AuthContext"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react"

export function LoginForm() {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setError("")
  setIsLoading(true)

  const result = await login(email, password)

  if (!result.success) {
    setError(result.error || "Login failed")
  }

  setIsLoading(false)
}

  return (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-300">
              Email
            </label>
                    <div className="relative group">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
            <Input
              id="email"
              type="email"
              placeholder="your-email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-11 h-12 bg-slate-800/50 border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-white placeholder:text-slate-500 transition-all"
            />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-300">
              Password
            </label>
                    <div className="relative group">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pl-11 pr-11 h-12 bg-slate-800/50 border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-white placeholder:text-slate-500 transition-all"
          />
                      <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-amber-400 transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
            </div>
          </div>
     {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all duration-300 border-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>กำลังเข้าสู่ระบบ...</span>
          </div>
        ) : (
          "เข้าสู่ระบบ"
        )}
      </Button>
        </form>

  )
}
