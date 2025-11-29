"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Coins, TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { useMemo, useRef, useEffect } from "react"

interface GoldHoldingsCardProps {
  goldHoldings: {
    [key: string]: number | undefined
    SPOT?: number
    GOLD_9999?: number
    GOLD_965?: number
    GOLD_9999_MTS?: number
    GOLD_965_MTS?: number
    GOLD_965_ASSO?: number
  }
  exchangeRates: { USD: number } | null
  averageCosts: { [key: string]: number | undefined }
  currentMarketPrices: any
}

export function GoldHoldingsCard({
  goldHoldings,
  currentMarketPrices,
  exchangeRates,
  averageCosts,
}: GoldHoldingsCardProps) {
  const lastValidPricesRef = useRef<any>(null)

  useEffect(() => {
    if (currentMarketPrices && typeof currentMarketPrices === "object") {
      lastValidPricesRef.current = currentMarketPrices
    }
  }, [currentMarketPrices])

  // Use cached prices if current prices are not available
  const effectivePrices = currentMarketPrices || lastValidPricesRef.current

  const tradableGoldTypes = [
    { type: "GOLD_9999_MTS", unit: "g", title: "ทองคำ 99.99% (MTS)" },
    { type: "GOLD_965_MTS", unit: "g", title: "ทองคำ 96.5% (MTS)" },
    { type: "GOLD_965_ASSO", unit: "g", title: "ทองคำ 96.5% (สมาคม)" },
  ]

  const getPriceKey = (goldType: string) => {
    const keyMap: Record<string, string> = {
      SPOT: "spot",
      GOLD_9999: "gold9999",
      GOLD_965: "gold965",
      GOLD_9999_MTS: "gold9999_mts",
      GOLD_965_MTS: "gold965_mts",
      GOLD_965_ASSO: "gold965_asso",
    }
    return keyMap[goldType] || goldType.toLowerCase()
  }

  const resolveKeys = (goldType: string): string[] => {
    const base = getPriceKey(goldType)
    const variants = new Set<string>([
      goldType,
      goldType.toUpperCase(),
      goldType.toLowerCase(),
      base,
      base.toUpperCase(),
      base.toLowerCase(),
    ])
    return Array.from(variants)
  }

  const getHolding = (goldType: string): number => {
    for (const k of resolveKeys(goldType)) {
      const v = goldHoldings[k]
      if (typeof v === "number" && !Number.isNaN(v)) return v
    }
    return 0
  }

  const getAverageCost = (goldType: string): number | undefined => {
    for (const k of resolveKeys(goldType)) {
      const v = averageCosts?.[k]
      if (typeof v === "number" && !Number.isNaN(v)) return v
    }
    return undefined
  }

  const getGoldBaseCurrency = (goldType: string): "THB" | "USD" => (goldType === "SPOT" ? "USD" : "THB")

  const convertToTHB = (value: number, fromCurrency: "THB" | "USD"): number | null => {
    if (fromCurrency === "THB") return value
    if (!exchangeRates || !exchangeRates.USD) return null
    return value * exchangeRates.USD
  }

  const convertToUSD = (value: number, fromCurrency: "THB" | "USD"): number | null => {
    if (fromCurrency === "USD") return value
    if (!exchangeRates || !exchangeRates.USD) return null
    return value / exchangeRates.USD
  }

  const getCurrentSellPrice = useMemo(() => {
    return (goldType: string): number | null => {
      if (!effectivePrices || typeof effectivePrices !== "object") {
        return null
      }

      for (const key of resolveKeys(goldType)) {
        const priceData = (effectivePrices as any)[key]
        if (!priceData) continue

        const price = priceData.sellOut ?? priceData.buyIn ?? priceData.price

        if (typeof price === "number" && Number.isFinite(price) && price > 0) {
          return price
        }
      }

      return null
    }
  }, [effectivePrices])

  const goldValuesAndPnL = useMemo(() => {
    const results: Record<
      string,
      {
        holding: number
        thbValue: number | null
        usdValue: number | null
        pnlThb: number | null
        pnlUsd: number | null
        pnlPercent: number | null
        hasAverage: boolean
        avgCost: number | undefined
      }
    > = {}

    for (const gold of tradableGoldTypes) {
      const holding = getHolding(gold.type)

      if (holding <= 0) {
        results[gold.type] = {
          holding: 0,
          thbValue: 0,
          usdValue: 0,
          pnlThb: 0,
          pnlUsd: 0,
          pnlPercent: 0,
          hasAverage: false,
          avgCost: undefined,
        }
        continue
      }

      const currentSellPrice = getCurrentSellPrice(gold.type)
      const avgCost = getAverageCost(gold.type)
      const baseCurrency = getGoldBaseCurrency(gold.type)

      // Calculate value
      let thbValue: number | null = null
      let usdValue: number | null = null

      if (currentSellPrice != null) {
        const valueInBase = holding * currentSellPrice
        thbValue = baseCurrency === "THB" ? valueInBase : convertToTHB(valueInBase, "USD")
        usdValue = baseCurrency === "USD" ? valueInBase : convertToUSD(valueInBase, "THB")
      }

      // Calculate PnL
      let pnlThb: number | null = null
      let pnlUsd: number | null = null
      let pnlPercent: number | null = null
      let hasAverage = false

      if (avgCost != null && avgCost > 0 && currentSellPrice != null) {
        hasAverage = true
        const pnlInBase = (currentSellPrice - avgCost) * holding
        pnlPercent = ((currentSellPrice - avgCost) / avgCost) * 100
        pnlThb = convertToTHB(pnlInBase, baseCurrency)
        pnlUsd = convertToUSD(pnlInBase, baseCurrency)
      } else if (avgCost != null && avgCost > 0) {
        hasAverage = true
      }

      results[gold.type] = {
        holding,
        thbValue,
        usdValue,
        pnlThb,
        pnlUsd,
        pnlPercent,
        hasAverage,
        avgCost,
      }
    }

    return results
  }, [goldHoldings, effectivePrices, averageCosts, exchangeRates])

  const hasAnyHoldings = tradableGoldTypes.some((gold) => goldValuesAndPnL[gold.type]?.holding > 0)

  const isPriceLoading = !effectivePrices

  return (
    <Card className="border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in">
      <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-900/30 border-b border-amber-200 dark:border-amber-800">
        <CardTitle className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
          <div className="p-2 rounded-lg bg-amber-200 dark:bg-amber-900/50">
            <Coins className="h-6 w-6" />
          </div>
          <span className="text-xl">ทรัพย์สินทอง</span>
          {isPriceLoading && <Loader2 className="h-4 w-4 animate-spin text-amber-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {!hasAnyHoldings ? (
          <div className="text-center py-12 text-muted-foreground">
            <Coins className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">ยังไม่มีทรัพย์สินทองคำ</p>
            <p className="text-sm mt-2">เริ่มต้นซื้อทองคำเพื่อลงทุนวันนี้</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tradableGoldTypes.map((gold) => {
              const data = goldValuesAndPnL[gold.type]
              if (!data || data.holding <= 0) return null

              const { holding, thbValue, usdValue, pnlThb, pnlPercent, hasAverage, avgCost } = data

              const pnlColorClass =
                pnlPercent != null && pnlPercent > 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : pnlPercent != null && pnlPercent < 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-500"

              const pnlSign = pnlPercent != null && pnlPercent > 0 ? "+" : ""

              return (
                <div
                  key={gold.type}
                  className="p-4 rounded-lg border border-border bg-card/50 hover:bg-accent/30 transition-all duration-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="font-semibold text-lg text-foreground">{gold.title}</span>
                      <div className="text-sm text-muted-foreground mt-1">
                        {holding.toFixed(4)} {gold.unit}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">มูลค่าปัจจุบัน</div>
                      <div className="font-semibold text-foreground">
                        {isPriceLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin inline" />
                        ) : thbValue != null ? (
                          `฿${thbValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        ) : (
                          <span className="text-muted-foreground text-sm">รอข้อมูลราคา</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isPriceLoading
                          ? "..."
                          : usdValue != null
                            ? `$${usdValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : "รอข้อมูลราคา"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm pt-3 border-t border-border/50">
                    <div>
                      <div className="text-muted-foreground mb-1">ต้นทุนเฉลี่ย/{gold.unit}</div>
                      <div className="font-medium">
                        {avgCost != null ? (
                          `฿${avgCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        ) : (
                          <span className="text-muted-foreground text-xs">ไม่มีข้อมูล</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-muted-foreground mb-1">กำไร/ขาดทุน</div>
                      {isPriceLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin inline" />
                      ) : hasAverage && pnlThb != null && pnlPercent != null ? (
                        <div className={`font-semibold flex items-center justify-end gap-1 ${pnlColorClass}`}>
                          {pnlPercent > 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : pnlPercent < 0 ? (
                            <TrendingDown className="h-4 w-4" />
                          ) : null}
                          <span>
                            {pnlSign}฿
                            {Math.abs(pnlThb).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            {` (${pnlSign}${pnlPercent.toFixed(2)}%)`}
                          </span>
                        </div>
                      ) : hasAverage ? (
                        <span className="text-muted-foreground text-xs">รอข้อมูลราคา</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">ไม่มีข้อมูลต้นทุน</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
