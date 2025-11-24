"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/app/contexts/AuthContext"
import { Button } from "@/app/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Input } from "@/app/components/ui/input"
import { connectWebSocket } from "@/app/lib/websocket"
import { apiClient } from "@/app/lib/api-client"
import { LogOut, Search } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { AdminPage } from "@/app/pages/AdminPage"

// Import the new page components
import LoginPage from "@/app/pages/LoginPage"
import WalletPage from "@/app/pages/WalletPage"
import CardPage from "@/app/pages/CardPage"
import ChartPage from "@/app/pages/ChartPage"
import TransactionPage from "@/app/pages/TransactionPage"
import { TradePanel } from "@/app/components/trading/TradePanel"

export default function Home() {
  const { user, logout, isLoading: authLoading } = useAuth()
  const [prices, setPrices] = useState<any>(null)
  const [previousPrices, setPreviousPrices] = useState<Record<string, number>>({})
  const [statuses, setStatuses] = useState<any[]>([])
  const [wallet, setWallet] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [displayCurrency, setDisplayCurrency] = useState<"THB" | "USD">("THB")

  // Memoized fetch functions
  const fetchPrices = useCallback(async () => {
    console.log("[Home] fetchPrices() called")
    try {
      const data = await apiClient.getCurrentPrices()
      setPrices(data)
    } catch (error) {
      console.error("Error fetching prices:", error)
    }
  }, [])

  const fetchStatuses = useCallback(async () => {
    console.log("[Home] fetchStatuses() called")
    try {
      const data = await apiClient.getStatuses()
      setStatuses(data)
    } catch (error) {
      console.error("Error fetching statuses:", error)
    }
  }, [])

  const fetchWallet = useCallback(async () => {
    console.log("[Home] fetchWallet() called")
    try {
      const data = await apiClient.getWallet()
      setWallet(data)
    } catch (error) {
      console.error("Error fetching wallet:", error)
    }
  }, [])

  const fetchTransactions = useCallback(async () => {
    console.log("[Home] fetchTransactions() called")
    try {
      const data = await apiClient.getTransactionHistory()
      setTransactions(data)
    } catch (error) {
      console.error("Error fetching transactions:", error)
    }
  }, [])

  const handleTradeComplete = useCallback(() => {
    console.log("[Home] handleTradeComplete() called")
    fetchWallet()
    fetchTransactions()
  }, [fetchWallet, fetchTransactions])

  useEffect(() => {
    if (!user) return
    console.log("[Home] User logged in, fetching initial data...")
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
          const key = priceItem.goldType.toLowerCase().replace(/_([a-z])/g, (g: string) => g[1].toUpperCase());
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
      console.log("[Home] Received WebSocket status update:", updatedStatus)
      setStatuses((prevStatuses) => {
        const newStatuses = prevStatuses.filter(s => s.goldType !== updatedStatus.goldType)
        return [...newStatuses, updatedStatus]
      })
    })

    return () => {
      socket?.off("priceUpdate")
      socket?.off("statusUpdate")
    }
  }, [user])

  useEffect(() => {
    if (user && statuses.length > 0) {
      console.log(`===== Statuses Log (Home) @ ${new Date().toLocaleTimeString()} =====`)
      statuses.forEach(s => console.log(`  ${s.goldType}: ${s.status}`))
      console.log("===================================================")
    }
  }, [user, statuses])

  const getPrice = (goldType: string) => {
    if (!prices) return null
    if (typeof prices === "object") {
      const keyMap: Record<string, string> = {
        "SPOT": "spot",
        "GOLD_9999_MTS": "gold9999_mts",
        "GOLD_965_MTS": "gold965_mts",
        "GOLD_9999": "gold9999",
        "GOLD_965": "gold965",
        "GOLD_965_ASSO": "gold965_asso",
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

  const getStatus = (goldType: string) => {
    const status = statuses.find((s) => s.goldType === goldType)
    return status?.status || "ONLINE"
  }

  const gold9999MtsPrice = getPrice("GOLD_9999_MTS")
  const gold965MtsPrice = getPrice("GOLD_965_MTS")
  const gold965AssoPrice = getPrice("GOLD_965_ASSO")

  const tradingGoldTypes = [
    { type: "GOLD_9999_MTS", price: gold9999MtsPrice, title: "Gold 99.99% (MTS)", unit: "g", tradable: true },
    { type: "GOLD_965_MTS", price: gold965MtsPrice, title: "Gold 96.5% (MTS)", unit: "baht", tradable: true },
    { type: "GOLD_965_ASSO", price: gold965AssoPrice, title: "Gold 96.5% (สมาคม)", unit: "baht", tradable: true },
  ]

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-amber-600 dark:text-amber-500">Gold Trading</h1>
            <p className="text-sm text-muted-foreground">Welcome, {user.username}</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={displayCurrency} onValueChange={(value: "THB" | "USD") => setDisplayCurrency(value)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="THB">THB</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={logout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Wallet */}
          <WalletPage
            wallet={wallet}
            currentMarketPrices={prices}
            exchangeRates={wallet?.exchangeRates}
            averageCosts={wallet?.averageCosts}
            fetchWallet={fetchWallet}
            fetchTransactions={fetchTransactions}
          />

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <CardPage
              prices={prices}
              previousPrices={previousPrices}
              statuses={statuses}
              wallet={wallet}
              displayCurrency={displayCurrency}
            />

            {/* Charts */}
            <ChartPage statuses={statuses} />

            {/* Trade Panels - Only for tradable gold types */}
            {tradingGoldTypes.length > 0 && wallet && (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Trading</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {tradingGoldTypes.map((gold) => (
                    <TradePanel
                      key={gold.type}
                      goldType={gold.type}
                      title={`Trade ${gold.title}`}
                      buyPrice={gold.price?.buyIn ?? 0}
                      sellPrice={gold.price?.sellOut ?? 0}
                      onTradeComplete={handleTradeComplete}
                      thbBalance={wallet.balance?.THB ?? 0}
                      usdBalance={wallet.balance?.USD ?? 0}
                      goldHoldings={wallet.goldHoldings || {}}
                      displayCurrency={displayCurrency}
                      exchangeRates={wallet?.exchangeRates}
                      status={getStatus(gold.type)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Transaction History */}
            <TransactionPage transactions={transactions} />
          </div>
        </div>
      </main>
    </div>
  )
}
