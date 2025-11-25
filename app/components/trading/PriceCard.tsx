"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog"
import { TrendingUp, TrendingDown, Info, ChevronRight } from "lucide-react"
import { useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { MiniGoldChart } from "./MiniGoldChart"

interface PriceCardProps {
  goldType: string
  title: string
  buyIn?: number | null
  sellOut?: number | null
  price?: number | null
  unit: string
  status: "ONLINE" | "PAUSE" | "STOP"
  previousPrice?: number
  displayCurrency: "THB" | "USD"
  exchangeRates: { USD: number } | null
  errorMessage?: string // New prop for displaying errors
}

export function PriceCard({
  goldType,
  title,
  buyIn,
  sellOut,
  price,
  unit,
  status,
  previousPrice,
  displayCurrency,
  exchangeRates,
  errorMessage, // Destructure new prop
}: PriceCardProps) {
  const [priceDirection, setPriceDirection] = useState<"up" | "down" | "neutral">("neutral")
  const [isAnimating, setIsAnimating] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const convertPrice = (value: number | null | undefined, fromCurrency: "THB" | "USD") => {
    if (value == null || !Number.isFinite(value) || !exchangeRates) return null

    if (fromCurrency === displayCurrency) {
      return value
    }

    if (fromCurrency === "THB" && displayCurrency === "USD") {
      return value / exchangeRates.USD
    }

    if (fromCurrency === "USD" && displayCurrency === "THB") {
      return value * exchangeRates.USD
    }

    return value
  }

  const getBaseCurrency = (type: string) => {
    if (type === "SPOT") {
      return "USD"
    }
    return "THB"
  }

  const baseCurrency = getBaseCurrency(goldType)
  const convertedBuyIn = convertPrice(buyIn, baseCurrency)
  const convertedSellOut = convertPrice(sellOut, baseCurrency)
  const convertedPrice = convertPrice(price, baseCurrency)

  const currentPrice = convertedPrice ?? convertedBuyIn ?? 0

  useEffect(() => {
    if (previousPrice && currentPrice !== previousPrice) {
      setIsAnimating(true)
      setPriceDirection(currentPrice > previousPrice ? "up" : "down")

      const timer = setTimeout(() => {
        setIsAnimating(false)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [currentPrice, previousPrice])

  const getStatusColor = () => {
    switch (status) {
      case "ONLINE":
        return "bg-emerald-500"
      case "PAUSE":
        return "bg-amber-500"
      case "STOP":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatDisplayPrice = (value: number | null | undefined) => {
    if (status === "STOP") return "-"
    if (value == null || !Number.isFinite(value)) return "-"
    return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  if (errorMessage) {
    return (
      <Card className="transition-all duration-300 border-red-500/50 bg-red-50 dark:bg-red-950/30 hover:shadow-lg group">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-red-600 dark:text-red-400">
              {title}
            </CardTitle>
            <Badge variant="destructive">Error</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-red-500 text-sm">
            <Info className="h-4 w-4" />
            <span>{errorMessage}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{unit}</span>
            <span className="text-primary font-medium">{displayCurrency}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card
        className={`transition-all duration-300 border-border hover:border-primary/50 hover:shadow-lg cursor-pointer group ${
          isAnimating
            ? priceDirection === "up"
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800"
            : ""
        }`}
        onClick={() => setDetailsOpen(true)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              {title}
              <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardTitle>
            <Badge className={`${getStatusColor()} text-white`}>{status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {buyIn !== undefined && sellOut !== undefined ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ซื้อ</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatDisplayPrice(convertedBuyIn)}
                  </span>
                  {priceDirection === "up" && <TrendingUp className="h-5 w-5 text-emerald-600 animate-bounce" />}
                  {priceDirection === "down" && <TrendingDown className="h-5 w-5 text-red-600 animate-bounce" />}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ขาย</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatDisplayPrice(convertedSellOut)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">ราคา</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{formatDisplayPrice(convertedPrice)}</span>
                {priceDirection === "up" && <TrendingUp className="h-5 w-5 text-emerald-600 animate-bounce" />}
                {priceDirection === "down" && <TrendingDown className="h-5 w-5 text-red-600 animate-bounce" />}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{unit}</span>
            <span className="text-primary font-medium">{displayCurrency}</span>
          </div>

          {/* Mini chart preview */}
          <div className="h-16 mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
            <MiniGoldChart goldType={goldType} />
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <span className="text-primary">{title}</span>
              <Badge className={`${getStatusColor()} text-white`}>{status}</Badge>
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
              <TabsTrigger value="chart">กราฟ</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {buyIn !== undefined && sellOut !== undefined ? (
                  <>
                    <div className="p-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                      <div className="text-sm text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        ราคาซื้อ
                      </div>
                      <div className="text-4xl font-bold text-emerald-700 dark:text-emerald-400">
                        {formatDisplayPrice(convertedBuyIn)} {displayCurrency}
                      </div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-500 mt-2">{unit}</div>
                    </div>
                    <div className="p-6 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                      <div className="text-sm text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                        <TrendingDown className="h-4 w-4" />
                        ราคาขาย
                      </div>
                      <div className="text-4xl font-bold text-red-700 dark:text-red-400">
                        {formatDisplayPrice(convertedSellOut)} {displayCurrency}
                      </div>
                      <div className="text-xs text-red-600 dark:text-red-500 mt-2">{unit}</div>
                    </div>
                  </>
                ) : (
                  <div className="col-span-2 p-6 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="text-sm text-primary mb-2">ราคาปัจจุบัน</div>
                    <div className="text-4xl font-bold text-primary">
                      {formatDisplayPrice(convertedPrice)} {displayCurrency}
                    </div>
                    <div className="text-xs text-primary/70 mt-2">{unit}</div>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-primary mt-0.5" />
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-foreground">ข้อมูลเพิ่มเติม:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>ประเภท: {goldType}</li>
                      <li>หน่วย: {unit}</li>
                      <li>สถานะ: {status === "ONLINE" ? "เปิดซื้อขาย" : status === "PAUSE" ? "พักชั่วคราว" : "หยุดซื้อขาย"}</li>
                      <li>สกุลเงิน: {displayCurrency}</li>
                      {buyIn !== undefined && sellOut !== undefined && (
                        <li>
                          ส่วนต่าง (Spread): {formatDisplayPrice((convertedBuyIn ?? 0) - (convertedSellOut ?? 0))}{" "}
                          {displayCurrency}
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="chart" className="space-y-4">
              <div className="h-[400px]">
                <MiniGoldChart goldType={goldType} fullSize />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              ปิด
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
