"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/app/contexts/AuthContext"
import { connectWebSocket } from "@/app/lib/websocket"
import { apiClient } from "@/app/lib/api-client"
import { AdminPage } from "@/app/pages/AdminPage"
import { useTheme } from "@/app/components/ThemeProvider"

import LoginPage from "@/app/pages/LoginPage"
import MainDashboard from "@/app/pages/MainDashboard"
import { Navbar } from "@/app/components/layout/Navbar"

export default function Home() {
  const { user, isLoading: authLoading } = useAuth()
  const { mounted } = useTheme()
  const [prices, setPrices] = useState<any>(null)
  const [previousPrices, setPreviousPrices] = useState<Record<string, number>>({})
  const [statuses, setStatuses] = useState<any[]>([])
  const [wallet, setWallet] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [displayCurrency, setDisplayCurrency] = useState<"THB" | "USD">("THB")

  const fetchPrices = useCallback(async () => {
    try {
      const data = await apiClient.getCurrentPrices()
      setPrices(data)
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching prices:", error)
      }
    }
  }, [])

  const fetchStatuses = useCallback(async () => {
    if (user?.role !== "admin") return

    try {
      const data = await apiClient.getStatuses()
      setStatuses(data)
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching statuses:", error)
      }
    }
  }, [user])

  const fetchWallet = useCallback(async () => {
    try {
      const data = await apiClient.getWallet()
      setWallet(data)
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching wallet:", error)
      }
    }
  }, [])

  const fetchTransactions = useCallback(async () => {
    try {
      const data = await apiClient.getTransactionHistory()
      setTransactions(data)
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching transactions:", error)
      }
    }
  }, [])

  const handleTradeComplete = useCallback(() => {
    fetchWallet()
    fetchTransactions()
  }, [fetchWallet, fetchTransactions])

  useEffect(() => {
    if (!user) return
    fetchPrices()
    if (user.role === "admin") {
      fetchStatuses()
    }
    fetchWallet()
    fetchTransactions()
  }, [user, fetchPrices, fetchStatuses, fetchWallet, fetchTransactions])

  useEffect(() => {
    if (!user) return

    const socket = connectWebSocket()

    socket?.on("priceUpdate", (updatedPrices: any[]) => {
      // ใช้ keyMap แบบเดียวกับใน GoldHoldingsCard
      const keyMap: Record<string, string> = {
        SPOT: "spot",
        GOLD_9999: "gold9999",
        GOLD_965: "gold965",
        GOLD_9999_MTS: "gold9999_mts",
        GOLD_965_MTS: "gold965_mts",
        GOLD_965_ASSO: "gold965_asso",
      }

      const pricesObject = updatedPrices.reduce((acc: any, priceItem: any) => {
        if (!priceItem?.goldType) return acc

        const rawType = String(priceItem.goldType).toUpperCase() // เช่น "GOLD_9999_MTS"
        const mappedKey = keyMap[rawType] ?? rawType.toLowerCase() // ถ้าไม่มีใน map ก็ใช้ toLowerCase

        acc[mappedKey] = priceItem
        return acc
      }, {} as Record<string, any>)

      setPreviousPrices(() => {
        const newPrev: Record<string, number> = {}

        for (const [key, value] of Object.entries(pricesObject)) {
          if (key === "timestamp") continue
          const p: any = value
          const goldType = key.toUpperCase()
          newPrev[goldType] = p?.buyIn ?? p?.price ?? 0
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

      // Refresh wallet and prices after status change
      fetchWallet()
      fetchPrices()
    })

    return () => {
      socket?.off("priceUpdate")
      socket?.off("statusUpdate")
    }
  }, [user, fetchWallet, fetchPrices])

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
    { type: "GOLD_9999_MTS", price: gold9999MtsPrice, title: "Gold 99.99% (MTS)", unit: "THB/g", tradable: true },
    { type: "GOLD_965_MTS", price: gold965MtsPrice, title: "Gold 96.5% (MTS)", unit: "THB/g", tradable: true },
    { type: "GOLD_965_ASSO", price: gold965AssoPrice, title: "Gold 96.5% (สมาคม)", unit: "THB/g", tradable: true },
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
      <Navbar displayCurrency={displayCurrency} setDisplayCurrency={setDisplayCurrency} isAdmin={false} />

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
