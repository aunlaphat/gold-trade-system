"use client"

import { useState } from "react"
import { LoginForm } from "@/app/components/auth/LoginForm"
import { RegisterForm } from "@/app/components/auth/RegisterForm"
import { Button } from "@/app/components/ui/button"
import { Card } from "@/app/components/ui/card"
import { TrendingUp } from "lucide-react"

export default function LoginPage() {
  const [showRegister, setShowRegister] = useState(false)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-dark p-4">
      <Card className="w-full max-w-md p-8 bg-card border-border space-y-8">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="w-10 h-10 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-gold bg-clip-text text-transparent">
              Gold Trading
            </h1>
          </div>
          <p className="text-muted-foreground">
            Real-Time Gold Trading System
          </p>
        </div>

        {showRegister ? (
          <>
            <RegisterForm onRegisterSuccess={() => setShowRegister(false)} />
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Button variant="link" onClick={() => setShowRegister(false)} className="p-0 text-primary">
                Login
              </Button>
            </div>
          </>
        ) : (
          <>
            <LoginForm />
            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Button variant="link" onClick={() => setShowRegister(true)} className="p-0 text-primary">
                Register
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
