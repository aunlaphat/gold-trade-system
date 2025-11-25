"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Coins, TrendingUp, TrendingDown } from "lucide-react"

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

  const getCurrentSellPrice = (goldType: string): number | null => {
    if (!currentMarketPrices) return null
    const priceKey = getPriceKey(goldType)
    const priceData = currentMarketPrices[priceKey]
    if (!priceData) return null
    return priceData.sellOut ?? priceData.price ?? null
  }

  const getGoldBaseCurrency = (goldType: string): "THB" | "USD" => {
    return goldType === "SPOT" ? "USD" : "THB"
  }

  const convertToTHB = (value: number, fromCurrency: "THB" | "USD"): number | null => {
    if (fromCurrency === "THB") return value
    if (!exchangeRates) return null
    return value * exchangeRates.USD
  }

  const convertToUSD = (value: number, fromCurrency: "THB" | "USD"): number | null => {
    if (fromCurrency === "USD") return value
    if (!exchangeRates) return null
    return value / exchangeRates.USD
  }

  const getGoldValue = (goldType: string, amount: number): { thbValue: number | null; usdValue: number | null } => {
    if (!currentMarketPrices || amount === 0) {
      return { thbValue: 0, usdValue: 0 }
    }

    const currentSellPrice = getCurrentSellPrice(goldType)
    if (currentSellPrice == null) {
      return { thbValue: 0, usdValue: 0 }
    }

    const baseCurrency = getGoldBaseCurrency(goldType)
    const valueInBase = amount * currentSellPrice

    const thbValue = baseCurrency === "THB" ? valueInBase : convertToTHB(valueInBase, "USD")

    const usdValue = baseCurrency === "USD" ? valueInBase : convertToUSD(valueInBase, "THB")

    return { thbValue, usdValue }
  }

  const calculatePnL = (
    goldType: string,
    holding: number,
  ): { pnlThb: number | null; pnlUsd: number | null; pnlPercent: number | null; hasAverage: boolean } => {
    if (holding === 0 || !currentMarketPrices) {
      return { pnlThb: 0, pnlUsd: 0, pnlPercent: 0, hasAverage: false }
    }

    const avgCost = averageCosts?.[goldType]
    const currentSellPrice = getCurrentSellPrice(goldType)

    if (avgCost == null || avgCost === 0 || currentSellPrice == null) {
      return { pnlThb: null, pnlUsd: null, pnlPercent: null, hasAverage: false }
    }

    const baseCurrency = getGoldBaseCurrency(goldType)
    const avgCostInBase = avgCost
    const currentPriceInBase = currentSellPrice

    const pnlInBase = (currentPriceInBase - avgCostInBase) * holding
    const pnlPercent = ((currentPriceInBase - avgCostInBase) / avgCostInBase) * 100

    const pnlThb = convertToTHB(pnlInBase, baseCurrency)
    const pnlUsd = convertToUSD(pnlInBase, baseCurrency)

    return { pnlThb, pnlUsd, pnlPercent, hasAverage: true }
  }

  const tradableGoldTypes = [
    { type: "GOLD_9999_MTS", unit: "g", title: "ทองคำ 99.99% (MTS)" },
    { type: "GOLD_965_MTS", unit: "g", title: "ทองคำ 96.5% (MTS)" },
    { type: "GOLD_965_ASSO", unit: "g", title: "ทองคำ 96.5% (สมาคม)" },
  ]

  const hasAnyHoldings = tradableGoldTypes.some((gold) => (goldHoldings[gold.type] || 0) > 0)

  return (
    <Card className="border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in">
      <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-900/30 border-b border-amber-200 dark:border-amber-800">
        <CardTitle className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
          <div className="p-2 rounded-lg bg-amber-200 dark:bg-amber-900/50">
            <Coins className="h-6 w-6" />
          </div>
          <span className="text-xl">ทรัพย์สินทอง</span>
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
              const holding = goldHoldings[gold.type] || 0
              if (holding <= 0) return null

              const { thbValue, usdValue } = getGoldValue(gold.type, holding)
              const { pnlThb, pnlUsd, pnlPercent, hasAverage } = calculatePnL(gold.type, holding)

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
                        {thbValue != null
                          ? `฿${thbValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                          : "N/A"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {usdValue != null
                          ? `$${usdValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                          : "N/A"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm pt-3 border-t border-border/50">
                    <div>
                      <div className="text-muted-foreground mb-1">ต้นทุนเฉลี่ย/{gold.unit}</div>
                      <div className="font-medium">
                        {averageCosts?.[gold.type] != null
                          ? `฿${averageCosts[gold.type]?.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                          : "N/A"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-muted-foreground mb-1">กำไร/ขาดทุน</div>
                      {hasAverage && pnlThb != null && pnlPercent != null ? (
                        <div className={`font-semibold flex items-center justify-end gap-1 ${pnlColorClass}`}>
                          {pnlPercent > 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : pnlPercent < 0 ? (
                            <TrendingDown className="h-4 w-4" />
                          ) : null}
                          <span>
                            {pnlSign}฿{Math.abs(pnlThb).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            {` (${pnlSign}${pnlPercent.toFixed(2)}%)`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">ไม่มีข้อมูล</span>
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
