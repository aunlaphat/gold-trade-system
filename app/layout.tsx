import type React from "react"
import type { Metadata } from "next"
import { Roboto, Noto_Sans_Thai } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/app/contexts/AuthContext"
import { Toaster } from "@/app/components/ui/toaster"
import { ThemeProvider } from "@/app/components/ThemeProvider"
import "./globals.css"
import PriceProvider from "./components/PriceProvider"

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
})

const notoSansThai = Noto_Sans_Thai({
  weight: ["300", "400", "500", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-noto-sans-thai",
})

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
    ],
    apple: "/logo-system.jpg",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${roboto.variable} ${notoSansThai.variable} font-sans`}>
        <ThemeProvider>
          <AuthProvider>
            <PriceProvider>{children}</PriceProvider>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
