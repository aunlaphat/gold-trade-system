"use client"

import { useState } from "react"
import { LoginForm } from "@/app/components/auth/LoginForm"
import { RegisterForm } from "@/app/components/auth/RegisterForm"
import { Button } from "@/app/components/ui/button"
import { Card } from "@/app/components/ui/card"
import { TrendingUp, Coins, Sparkles, Shield } from "lucide-react"
import Image from "next/image"

export default function LoginPage() {
  const [showRegister, setShowRegister] = useState(false)

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-amber-500/3 to-yellow-500/3 rounded-full blur-3xl animate-spin-slow"></div>
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(251,191,36,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black,transparent)]"></div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-8 items-center">
        <div className="hidden md:block space-y-8 animate-fade-in-left">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative w-16 h-16 overflow-hidden rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 p-3 shadow-2xl shadow-amber-500/20 animate-float">
                <Image
                  src="/logo-gold-system.png"
                  alt="Gold Trading Logo"
                  width={64}
                  height={64}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
                  Gold Trading
                </h1>
                <p className="text-lg text-amber-500/70 font-light">Premium System</p>
              </div>
            </div>
            <p className="text-xl text-slate-300 leading-relaxed">ระบบซื้อขายทองคำออนไลน์แบบเรียลไทม์ที่ทันสมัยและปลอดภัยที่สุด</p>
          </div>

          <div className="space-y-4">
            {/* Feature cards */}
            <div
              className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-500/5 to-transparent border border-amber-500/10 backdrop-blur-sm hover:border-amber-500/30 transition-all duration-300 group animate-fade-in"
              style={{ animationDelay: "100ms" }}
            >
              <div className="p-2 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">ราคาเรียลไทม์</h3>
                <p className="text-sm text-slate-400">อัพเดทราคาทองคำทุกวินาที</p>
              </div>
            </div>

            <div
              className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-500/5 to-transparent border border-amber-500/10 backdrop-blur-sm hover:border-amber-500/30 transition-all duration-300 group animate-fade-in"
              style={{ animationDelay: "200ms" }}
            >
              <div className="p-2 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                <Shield className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">ปลอดภัยสูงสุด</h3>
                <p className="text-sm text-slate-400">เข้ารหัสข้อมูลระดับธนาคาร</p>
              </div>
            </div>

            <div
              className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-500/5 to-transparent border border-amber-500/10 backdrop-blur-sm hover:border-amber-500/30 transition-all duration-300 group animate-fade-in"
              style={{ animationDelay: "300ms" }}
            >
              <div className="p-2 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                <Coins className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">ซื้อขายง่าย</h3>
                <p className="text-sm text-slate-400">ทำรายการได้ภายใน 3 วินาที</p>
              </div>
            </div>

            <div
              className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-500/5 to-transparent border border-amber-500/10 backdrop-blur-sm hover:border-amber-500/30 transition-all duration-300 group animate-fade-in"
              style={{ animationDelay: "400ms" }}
            >
              <div className="p-2 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">ระบบทันสมัย</h3>
                <p className="text-sm text-slate-400">UI/UX ที่ใช้งานง่ายและสวยงาม</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-amber-500/10">
            <p className="text-xs text-slate-500 leading-relaxed">
              ขับเคลื่อนด้วยเทคโนโลยีที่ทันสมัย เชื่อถือได้ และปลอดภัย พร้อมให้บริการคุณตลอด 24/7
            </p>
          </div>
        </div>

        <div className="animate-fade-in-right">
          <div className="relative">
            {/* Card glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-2xl blur-xl"></div>

            <div className="relative bg-slate-900/80 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-8 shadow-2xl">
              {/* Mobile logo */}
              <div className="md:hidden flex items-center justify-center gap-3 mb-8">
                <div className="relative w-12 h-12 overflow-hidden rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 p-2 shadow-lg shadow-amber-500/20">
                  <Image
                    src="/logo-gold-system.png"
                    alt="Gold Trading Logo"
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
                  Gold Trading
                </h1>
              </div>

              <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-bold text-white">{showRegister ? "สร้างบัญชีใหม่" : "เข้าสู่ระบบ"}</h2>
                <p className="text-sm text-slate-400">{showRegister ? "เริ่มต้นการเทรดทองคำวันนี้" : "ยินดีต้อนรับกลับสู่ระบบ"}</p>
              </div>

        {showRegister ? (
          <>
            <RegisterForm onRegisterSuccess={() => setShowRegister(false)} />
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-400">
              Already have an account?{" "}
              <Button variant="link" onClick={() => setShowRegister(false)} className="p-0 h-auto font-semibold text-amber-400 hover:text-amber-300 transition-colors">
                Login
              </Button>
               </p>
            </div>
          </>
        ) : (
          <>
            <LoginForm />
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-400">
              Don't have an account?{" "}
              <Button variant="link" onClick={() => setShowRegister(true)} className="p-0 h-auto font-semibold text-amber-400 hover:text-amber-300 transition-colors">
                Register
              </Button>
              </p>
            </div>
          </>
        )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
