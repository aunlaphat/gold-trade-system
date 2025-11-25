"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/app/contexts/AuthContext"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { useToast } from "@/app/components/ui/use-toast"
import { Mail, Lock, User, Eye, EyeOff, AlertCircle } from "lucide-react"

interface RegisterFormProps {
  onRegisterSuccess: () => void
}

export function RegisterForm({ onRegisterSuccess }: RegisterFormProps) {
  const { register } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [emailError, setEmailError] = useState("")
  const [usernameError, setUsernameError] = useState("")
  const [generalError, setGeneralError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError("")
    setUsernameError("")
    setGeneralError("")
    setIsLoading(true)

    const result = await register(email, username, password)

    if (result.success) {
      toast({
        title: "สร้างบัญชีสำเร็จ",
        description: "กรุณาเข้าสู่ระบบเพื่อเริ่มใช้งาน",
      })
      onRegisterSuccess()
    } else {
      const errorMessage = result.error || "เกิดข้อผิดพลาดในการสร้างบัญชี"
      if (result.field === "email") {
        setEmailError(errorMessage)
      } else if (result.field === "username") {
        setUsernameError(errorMessage)
      } else {
        setGeneralError(errorMessage)
        toast({
          title: "สร้างบัญชีไม่สำเร็จ",
          description: errorMessage,
          variant: "destructive",
        })
      }
    }
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-slate-300">
          อีเมล
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
        {emailError && (
          <div className="flex items-center gap-2 text-red-400 text-xs animate-fade-in">
            <AlertCircle className="w-3 h-3" />
            <span>{emailError}</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-medium text-slate-300">
          ชื่อผู้ใช้
        </label>
        <div className="relative group">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
          <Input
            id="username"
            type="text"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="pl-11 h-12 bg-slate-800/50 border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-white placeholder:text-slate-500 transition-all"
          />
        </div>
        {usernameError && (
          <div className="flex items-center gap-2 text-red-400 text-xs animate-fade-in">
            <AlertCircle className="w-3 h-3" />
            <span>{usernameError}</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-slate-300">
          รหัสผ่าน
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
            minLength={6}
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
        <p className="text-xs text-slate-500">รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร</p>
      </div>

      {generalError && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{generalError}</span>
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
            <span>กำลังสร้างบัญชี...</span>
          </div>
        ) : (
          "สร้างบัญชี"
        )}
      </Button>
    </form>
  )
}
