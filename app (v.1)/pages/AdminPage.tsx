"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/app/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { apiClient } from "@/app/lib/api-client"
import { useToast } from "@/app/hooks/use-toast"
import { PriceCard } from "@/app/components/trading/PriceCard"
import { LogOut, Search } from "lucide-react"
import { Input } from "@/app/components/ui/input"
import GoldChartsSix from "@/app/components/GoldChartsSix"
import { connectWebSocket, disconnectWebSocket, getSocket } from "@/app/lib/websocket" // Import WebSocket functions

export function AdminPage() {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const [wallet, setWallet] = useState<any>(null)
  const [statuses, setStatuses] = useState<any[]>([])
  const [prices, setPrices] = useState<any>(null) // Initialize as null, expecting an object
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (!user) return
    if (user.role !== "admin") {
      console.log("[AdminPage] Non-admin user:", user)
      return
    }

    console.log("[AdminPage] User is admin, fetching data...")
    fetchAdminData()
    fetchWallet()

    const socket = connectWebSocket()

    socket.on("priceUpdate", (newPrices: any[]) => { 
      console.log("[AdminPage] Received WebSocket price update:", newPrices)

      const pricesObject = newPrices.reduce((acc: any, priceItem: any) => {
        if (priceItem.goldType) {
          const key = priceItem.goldType
            .toLowerCase()
            .replace(/_([a-z])/g, (g: string) => g[1].toUpperCase())
          acc[key] = priceItem
        }
        return acc
      }, {})

      setPrices(pricesObject)
    })

    socket.on("statusUpdate", (updatedStatus: any) => {
      console.log("[AdminPage] Received WebSocket status update:", updatedStatus)
      setStatuses((prevStatuses) => {
        const newStatuses = prevStatuses.filter(s => s.goldType !== updatedStatus.goldType)
        return [...newStatuses, updatedStatus]
      })
    })

    return () => {
      socket.off("priceUpdate")
      socket.off("statusUpdate")
    }
  }, [user]) 

  useEffect(() => {
    if (!user || user.role !== "admin") return
    if (statuses.length === 0) return

    console.log(`===== Statuses Log (AdminPage) @ ${new Date().toLocaleTimeString()} =====`)
    statuses.forEach(s => console.log(`  ${s.goldType}: ${s.status}`))
    console.log("==========================================================")
  }, [user, statuses]) 

  const fetchAdminData = async () => {
    try {
      const [statusData, priceData] = await Promise.all([
        apiClient.getStatuses(),
        apiClient.getCurrentPrices(),
      ])

      setStatuses(statusData ?? [])
      setPrices(priceData ?? null) 
    } catch (error: any) {
      console.error("[AdminPage] Error fetching admin data:", error)
      toast({
        title: "Error fetching admin data",
        description: error?.details || error?.message || "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  const fetchWallet = async () => {
    try {
      const data = await apiClient.getWallet()
      setWallet(data)
    } catch (error: any) { 
      console.error("[AdminPage] Error fetching wallet:", error)
      toast({
        title: "Error fetching wallet",
        description: error?.details || error?.message || "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  const updateStatus = async (goldType: string, status: string) => {
    try {
      await apiClient.updateStatus(goldType, status)
      toast({
        title: "Status updated",
        description: `${goldType} is now ${status}`,
      })
      await fetchAdminData()
    } catch (error: any) {
      console.error("[AdminPage] updateStatus error:", error)
      toast({
        title: "Update failed",
        description: error?.details || error?.message || "Unable to update status.",
        variant: "destructive",
      })
    }
  }

  const allGoldTypes = [
    { type: "SPOT",          title: "Gold Spot",              category: "reference", unit: "USD/oz" },
    { type: "GOLD_9999",     title: "Gold 99.99% (Global)",   category: "reference", unit: "THB/g" },
    { type: "GOLD_965",      title: "Gold 96.5% (Global)",    category: "reference", unit: "THB/baht" },
    { type: "GOLD_9999_MTS", title: "Gold 99.99% (MTS)",      category: "tradable",  unit: "THB/g" },
    { type: "GOLD_965_MTS",  title: "Gold 96.5% (MTS)",       category: "tradable",  unit: "THB/baht" },
    { type: "GOLD_965_ASSO", title: "Gold 96.5% (สมาคม)",     category: "tradable",  unit: "THB/baht" },
  ]

  const getStatus = (goldType: string) => {
    return statuses.find((s) => s.goldType === goldType)?.status || "ONLINE"
  }

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
        if (k in (prices as any)) return (prices as any)[k]
      }

      const search = goldType.toLowerCase().replace(/_/g, "")
      for (const [k, v] of Object.entries(prices)) {
        const normalizedKey = k.toLowerCase().replace(/_/g, "")
        if (normalizedKey.includes(search) || search.includes(normalizedKey)) {
          return v
        }
      }
    }

    return null
  }

  const hasPriceData = (price: any) => {
    if (!price) return false
    return price.price != null || price.buyIn != null || price.sellOut != null
  }

  const referenceGoldTypes = allGoldTypes
    .filter((g) => g.category === "reference")
    .map((g) => ({ ...g, priceData: getPrice(g.type) }))

  const tradingGoldTypes = allGoldTypes
    .filter((g) => g.category === "tradable")
    .map((g) => ({ ...g, priceData: getPrice(g.type) }))

  const filteredReferenceTypes = referenceGoldTypes.filter(
    (gold) =>
      hasPriceData(gold.priceData) &&
      (gold.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gold.type.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const filteredTradingTypes = tradingGoldTypes.filter(
    (gold) =>
      hasPriceData(gold.priceData) &&
      (gold.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gold.type.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // กลุ่มที่ใช้ใน Control Panel (ควบคุมสถานะ)
  const filteredControlGoldTypes = allGoldTypes.filter(
    (gold) =>
      gold.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gold.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const displayCurrency: "THB" | "USD" = "THB" 

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Control Panel</h1>
          <Button onClick={logout} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Price Cards and Charts (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search gold types..."
                className="w-full pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Reference Group: Market Indices */}
            {filteredReferenceTypes.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-muted-foreground">
                  Market Indices (Reference Only)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredReferenceTypes.map((gold) => {
                    const p = gold.priceData
                    return (
                      <PriceCard
                        key={gold.type}
                        goldType={gold.type}
                        title={gold.title}
                        price={p?.price ?? p?.buyIn ?? p?.sellOut}
                        unit={gold.unit}
                        status={getStatus(gold.type)}
                        previousPrice={undefined}
                        displayCurrency={displayCurrency}
                        exchangeRates={wallet?.exchangeRates} 
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* Trading Group: Gold Partners */}
            {filteredTradingTypes.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Gold Partners (Tradable)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTradingTypes.map((gold) => {
                    const p = gold.priceData
                    return (
                      <PriceCard
                        key={gold.type}
                        goldType={gold.type}
                        title={gold.title}
                        price={p?.price}
                        buyIn={p?.buyIn}
                        sellOut={p?.sellOut}
                        unit={gold.unit}
                        status={getStatus(gold.type)}
                        previousPrice={undefined}
                        displayCurrency={displayCurrency}
                        exchangeRates={wallet?.exchangeRates} 
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* Charts รวม 6 ตัว */}
            <div className="grid grid-cols-1 gap-4">
              <GoldChartsSix getStatus={getStatus} />
            </div>
          </div>

          {/* Right Column: Control Panel and Status Descriptions (1/3 width) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Control Panel: เปลี่ยน ONLINE / PAUSE / STOP */}
            <Card>
              <CardHeader>
                <CardTitle>Gold Price Status Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredControlGoldTypes.map((gold) => {
                  const currentStatus = getStatus(gold.type)

                  return (
                    <div key={gold.type} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-semibold">{gold.title}</div>
                        <div className="text-sm text-muted-foreground">Type: {gold.type}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          className={
                            currentStatus === "ONLINE"
                              ? "bg-emerald-500"
                              : currentStatus === "PAUSE"
                                ? "bg-amber-500"
                                : "bg-red-500"
                          }
                        >
                          {currentStatus}
                        </Badge>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={currentStatus === "ONLINE" ? "default" : "outline"}
                            onClick={() => updateStatus(gold.type, "ONLINE")}
                          >
                            Online
                          </Button>
                          <Button
                            size="sm"
                            variant={currentStatus === "PAUSE" ? "default" : "outline"}
                            onClick={() => updateStatus(gold.type, "PAUSE")}
                          >
                            Pause
                          </Button>
                          <Button
                            size="sm"
                            variant={currentStatus === "STOP" ? "destructive" : "outline"}
                            onClick={() => updateStatus(gold.type, "STOP")}
                          >
                            Stop
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Descriptions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge className="bg-emerald-500 mt-1">ONLINE</Badge>
                  <div>
                    <div className="font-semibold">Online</div>
                    <div className="text-sm text-muted-foreground">
                      Normal operation. Prices are updating and trading is enabled.
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="bg-amber-500 mt-1">PAUSE</Badge>
                  <div>
                    <div className="font-semibold">Pause</div>
                    <div className="text-sm text-muted-foreground">
                      Temporarily stopped. Prices freeze at current values but remain visible.
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="bg-red-500 mt-1">STOP</Badge>
                  <div>
                    <div className="font-semibold">Stop</div>
                    <div className="text-sm text-muted-foreground">
                      Completely stopped. All prices are set to 0 and trading is disabled.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
