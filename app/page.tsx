"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/app/contexts/AuthContext"
import { Button } from "@/app/components/ui/button"
import { connectWebSocket } from "@/app/lib/websocket"
import { apiClient } from "@/app/lib/api-client"
import { LogOut, Moon, Sun } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { AdminPage } from "@/app/pages/AdminPage"
import { useTheme } from "@/app/components/ThemeProvider"
import Image from "next/image"

// Import the new page components
import LoginPage from "@/app/pages/LoginPage"
import MainDashboard from "@/app/pages/MainDashboard"
import { TradePanel } from "@/app/components/trading/TradePanel"

export default function Home() {
  const { user, logout, isLoading: authLoading } = useAuth()
  const { theme, toggleTheme, mounted } = useTheme()
  const [prices, setPrices] = useState<any>(null)
  const [previousPrices, setPreviousPrices] = useState<Record<string, number>>({})
  const [statuses, setStatuses] = useState<any[]>([])
  const [wallet, setWallet] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [displayCurrency, setDisplayCurrency] = useState<"THB" | "USD">("THB")

  // Memoized fetch functions
  const fetchPrices = useCallback(async () => {
    try {
      const data = await apiClient.getCurrentPrices()
      setPrices(data)
    } catch (error) {
      console.error("Error fetching prices:", error)
    }
  }, [])

  const fetchStatuses = useCallback(async () => {
    try {
      const data = await apiClient.getStatuses()
      setStatuses(data)
    } catch (error) {
      console.error("Error fetching statuses:", error)
    }
  }, [])

  const fetchWallet = useCallback(async () => {
    try {
      const data = await apiClient.getWallet()
      setWallet(data)
    } catch (error) {
      console.error("Error fetching wallet:", error)
    }
  }, [])

  const fetchTransactions = useCallback(async () => {
    try {
      const data = await apiClient.getTransactionHistory()
      setTransactions(data)
    } catch (error) {
      console.error("Error fetching transactions:", error)
    }
  }, [])

  const handleTradeComplete = useCallback(() => {
    fetchWallet()
    fetchTransactions()
  }, [fetchWallet, fetchTransactions])

  useEffect(() => {
    if (!user) return
    fetchPrices()
    fetchStatuses()
    fetchWallet()
    fetchTransactions()
  }, [user, fetchPrices, fetchStatuses, fetchWallet, fetchTransactions])

  useEffect(() => {
    if (!user) return

    const socket = connectWebSocket()

    socket?.on("priceUpdate", (updatedPrices: any[]) => {
      const pricesObject = updatedPrices.reduce((acc: any, priceItem: any) => {
        if (priceItem.goldType) {
          const key = priceItem.goldType.toLowerCase().replace(/_([a-z])/g, (g: string) => g[1].toUpperCase())
          acc[key] = priceItem
        }
        return acc
      }, {})

      setPreviousPrices((prev) => {
        const newPrev: Record<string, number> = {}
        for (const key in pricesObject) {
          if (key !== "timestamp") {
            const p = pricesObject[key]
            const goldType = key.toUpperCase()
            newPrev[goldType] = p?.buyIn || p?.price || 0
          }
        }
        return newPrev
      })

      setPrices(pricesObject)
    })

    socket?.on("statusUpdate", (updatedStatus: any) => {
      setStatuses((prevStatuses) => {
        const newStatuses = prevStatuses.filter((s) => s.goldType !== updatedStatus.goldType)
        return [...newStatuses, updatedStatus]
      })
    })

    return () => {
      socket?.off("priceUpdate")
      socket?.off("statusUpdate")
    }
  }, [user])

  const getPrice = (goldType: string) => {
    if (!prices) return null
    if (typeof prices === "object") {
      const keyMap: Record<string, string> = {
        SPOT: "spot",
        GOLD_9999_MTS: "gold9999_mts",
        GOLD_965_MTS: "gold965_mts",
        GOLD_9999: "gold9999",
        GOLD_965: "gold965",
        GOLD_965_ASSO: "gold965_asso",
      }

      const mappedKey = keyMap[goldType]
      if (mappedKey && mappedKey in prices) {
        return (prices as any)[mappedKey]
      }

      const variants = [
        goldType.toLowerCase(),
        goldType.replace(/_/g, "").toLowerCase(),
        goldType.replace(/-/g, "_").toLowerCase(),
        goldType.replace(/_/g, "-").toLowerCase(),
      ]
      for (const k of variants) {
        if (k && k in prices) return (prices as any)[k]
      }

      const searchTerm = goldType.toLowerCase().replace(/_/g, "")
      for (const [k, v] of Object.entries(prices)) {
        const normalizedKey = k.toLowerCase().replace(/_/g, "")
        if (normalizedKey.includes(searchTerm) || searchTerm.includes(normalizedKey)) {
          return v
        }
      }
    }
    return null
  }

  const getStatus = (goldType: string): "ONLINE" | "PAUSE" | "STOP" => {
    const status = statuses.find((s) => s.goldType === goldType)
    return (status?.status || "ONLINE") as "ONLINE" | "PAUSE" | "STOP"
  }

  const gold9999MtsPrice = getPrice("GOLD_9999_MTS")
  const gold965MtsPrice = getPrice("GOLD_965_MTS")
  const gold965AssoPrice = getPrice("GOLD_965_ASSO")

  const tradingGoldTypes = [
    { type: "GOLD_9999_MTS", price: gold9999MtsPrice, title: "Gold 99.99% (MTS)", unit: "g", tradable: true },
    { type: "GOLD_965_MTS", price: gold965MtsPrice, title: "Gold 96.5% (MTS)", unit: "baht", tradable: true },
    { type: "GOLD_965_ASSO", price: gold965AssoPrice, title: "Gold 96.5% (สมาคม)", unit: "baht", tradable: true },
  ]

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="text-lg font-medium text-primary animate-pulse-gold">กำลังโหลด...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  if (user.role === "admin") {
    return <AdminPage />
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 overflow-hidden rounded-lg sm:rounded-xl shadow-2xl shadow-amber-500/20 animate-float">
              <Image
                src="/logo-gold-system.png"
                alt="Gold Trading Logo"
                fill
                className="object-contain"
                sizes="(max-width: 640px) 40px, 48px"
                priority
              />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-500 to-yellow-600 bg-clip-text text-transparent">
                Gold Trading System
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">ยินดีต้อนรับ, {user.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Select value={displayCurrency} onValueChange={(value: "THB" | "USD") => setDisplayCurrency(value)}>
              <SelectTrigger className="w-[80px] sm:w-[100px] border-primary/20 hover:border-primary transition-colors text-xs sm:text-sm">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="THB">฿ THB</SelectItem>
                <SelectItem value="USD">$ USD</SelectItem>
              </SelectContent>
            </Select>
            {mounted && (
              <Button
                onClick={toggleTheme}
                variant="outline"
                size="icon"
                className="border-primary/20 hover:border-primary hover:bg-primary/10 transition-all bg-transparent h-8 w-8 sm:h-10 sm:w-10"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                ) : (
                  <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700" />
                )}
              </Button>
            )}
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="border-destructive/20 hover:border-destructive hover:bg-destructive/10 hover:text-destructive transition-all bg-transparent h-8 sm:h-9 px-2 sm:px-4 text-xs sm:text-sm"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
              <span className="inline sm:hidden">ออก</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <MainDashboard
          wallet={wallet}
          prices={prices}
          previousPrices={previousPrices}
          statuses={statuses}
          transactions={transactions}
          displayCurrency={displayCurrency}
          fetchWallet={fetchWallet}
          fetchTransactions={fetchTransactions}
          tradingGoldTypes={tradingGoldTypes}
          handleTradeComplete={handleTradeComplete}
          getStatus={getStatus}
        />

      </main>
    </div>
  )
}
