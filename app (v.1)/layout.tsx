import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/app/contexts/AuthContext"
import { Toaster } from "@/app/components/ui/toaster"
import "./globals.css"
import PriceProvider from "./components/PriceProvider"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Gold Trading System - Real-Time Trading",
  description: "Professional real-time gold trading platform with live prices and charts",
  icons: {
    icon: [
      {
        url: "/logo-system.jpg",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/logo-system.jpg",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/logo-system.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/logo-system.jpg",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <PriceProvider>
            {children}
          </PriceProvider>
          <Toaster />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
