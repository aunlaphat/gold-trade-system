"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/app/contexts/AuthContext"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { useToast } from "../ui/use-toast" // Import useToast

interface RegisterFormProps {
  onRegisterSuccess: () => void
}

export function RegisterForm({ onRegisterSuccess }: RegisterFormProps) {
  const { register } = useAuth()
  const { toast } = useToast() // Initialize toast
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [emailError, setEmailError] = useState("") // New state for email error
  const [usernameError, setUsernameError] = useState("") // New state for username error
  const [generalError, setGeneralError] = useState("") // For non-field-specific errors
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError("")
    setUsernameError("")
    setGeneralError("")
    setIsLoading(true)

    try {
      await register(email, username, password)
      toast({
        title: "Registration Successful",
        description: "Your account has been created. Please log in.",
      })
      onRegisterSuccess()
    } catch (err: any) {
      console.error("Registration error:", err)
      const errorMessage = err?.details || err?.message || "An unexpected error occurred during registration."
      
      if (err?.field === "email") {
        setEmailError(errorMessage)
      } else if (err?.field === "username") {
        setUsernameError(errorMessage)
      } else {
        setGeneralError(errorMessage)
      }

      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Register</CardTitle>
        <CardDescription>Create a new account to start trading</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {emailError && <div className="text-sm text-destructive">{emailError}</div>}
          </div>
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">
              Username
            </label>
            <Input
              id="username"
              type="text"
              placeholder="johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            {usernameError && <div className="text-sm text-destructive">{usernameError}</div>}
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {generalError && <div className="text-sm text-destructive">{generalError}</div>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Register"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
