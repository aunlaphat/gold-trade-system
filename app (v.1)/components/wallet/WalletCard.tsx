"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Wallet, Plus, Minus, Repeat2 } from "lucide-react"

interface WalletCardProps {
  balance: {
    THB: number
    USD: number
  }
  goldHoldings: {
    [key: string]: number | undefined
    SPOT?: number
    GOLD_9999?: number
    GOLD_965?: number
    GOLD_9999_MTS?: number
    GOLD_965_MTS?: number
    GOLD_965_ASSO?: number
  }
  onDeposit: () => void
  onWithdraw: () => void
  onExchange: () => void
  exchangeRates: { USD: number } | null
  averageCosts: { [key: string]: number | undefined } // ต้นทุนเฉลี่ยต่อหน่วย (ใน THB)
  currentMarketPrices: any
}

export function WalletCard({
  balance,
  goldHoldings,
  onDeposit,
  onWithdraw,
  onExchange,
  currentMarketPrices,
  exchangeRates,
  averageCosts,
}: WalletCardProps) {
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

  // ตอนนี้ทองที่เทรดจริง ๆ (MTS / ASSO) ใช้ THB เป็นฐานทั้งหมด
  const getGoldBaseCurrency = (goldType: string): "THB" | "USD" => {
    return goldType === "SPOT" ? "USD" : "THB"
  }

  const convertToTHB = (value: number, fromCurrency: "THB" | "USD"): number | null => {
    if (fromCurrency === "THB") return value
    if (!exchangeRates) return null // ไม่มีเรท → คิด THB ไม่ได้
    return value * exchangeRates.USD
  }

  const convertToUSD = (value: number, fromCurrency: "THB" | "USD"): number | null => {
    if (fromCurrency === "USD") return value
    if (!exchangeRates) return null // ไม่มีเรท → คิด USD ไม่ได้
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

    // THB value: ถ้า base = THB ก็ใช้ได้เลย ไม่ต้องพึ่ง exchangeRates
    // ถ้า base = USD และไม่มี exchangeRates จะคืนค่า null
    const thbValue =
      baseCurrency === "THB"
        ? valueInBase
        : convertToTHB(valueInBase, "USD")

    // USD value: ถ้า base = USD ก็ใช้ได้เลย ไม่ต้องแปลง
    // ถ้า base = THB และไม่มี exchangeRates จะคืนค่า null
    const usdValue =
      baseCurrency === "USD"
        ? valueInBase
        : convertToUSD(valueInBase, "THB")

    return { thbValue, usdValue }
  }

  const calculatePnL = (
    goldType: string,
    holding: number
  ): { pnlThb: number | null; pnlUsd: number | null; pnlPercent: number | null; hasAverage: boolean } => {
    if (holding === 0 || !currentMarketPrices) {
      return { pnlThb: 0, pnlUsd: 0, pnlPercent: 0, hasAverage: false }
    }

    const avgCost = averageCosts?.[goldType]
    const currentSellPrice = getCurrentSellPrice(goldType)

    // ถ้ายังไม่มีต้นทุนเฉลี่ย หรือราคาปัจจุบัน → กำหนดให้ P/L เป็น null และ hasAverage เป็น false
    // เพื่อให้ UI แสดง "N/A (requires average cost)"
    if (avgCost == null || avgCost === 0 || currentSellPrice == null) {
      return { pnlThb: null, pnlUsd: null, pnlPercent: null, hasAverage: false }
    }

    const baseCurrency = getGoldBaseCurrency(goldType)

    // ต้นทุนเฉลี่ยต่อหน่วย กับ ราคาปัจจุบันต่อหน่วย อยู่ในสกุลเดียวกัน (THB)
    const avgCostInBase = avgCost
    const currentPriceInBase = currentSellPrice

    const pnlInBase = (currentPriceInBase - avgCostInBase) * holding
    const pnlPercent =
      ((currentPriceInBase - avgCostInBase) / avgCostInBase) * 100

    // แปลง P/L เป็น THB และ USD. ถ้า exchangeRates ไม่มี จะได้ null
    const pnlThb = convertToTHB(pnlInBase, baseCurrency)
    const pnlUsd = convertToUSD(pnlInBase, baseCurrency)

    return { pnlThb, pnlUsd, pnlPercent, hasAverage: true }
  }

  const tradableGoldTypes = [
    { type: "GOLD_9999_MTS", unit: "g", title: "Gold 99.99% (MTS)" },
    { type: "GOLD_965_MTS", unit: "g", title: "Gold 96.5% (MTS)" },
    { type: "GOLD_965_ASSO", unit: "g", title: "Gold 96.5% (ASSO)" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Wallet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cash THB */}
        <div>
          <div className="text-sm text-muted-foreground mb-1">
            Cash Balance (THB)
          </div>
          <div className="text-3xl font-bold">
            {balance.THB.toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
            <span className="text-lg text-muted-foreground">THB</span>
          </div>
        </div>

        {/* Cash USD */}
        <div>
          <div className="text-sm text-muted-foreground mb-1">
            Cash Balance (USD)
          </div>
          <div className="text-3xl font-bold">
            {balance.USD.toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
            <span className="text-lg text-muted-foreground">USD</span>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            onClick={onDeposit}
            className="col-span-1 bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Deposit
          </Button>
          <Button
            onClick={onWithdraw}
            variant="outline"
            className="col-span-1 bg-transparent"
          >
            <Minus className="h-4 w-4 mr-2" />
            Withdraw
          </Button>
          <Button
            onClick={onExchange}
            variant="outline"
            className="col-span-1 bg-transparent"
          >
            <Repeat2 className="h-4 w-4 mr-2" />
            Exchange
          </Button>
        </div>

        {/* Gold Holdings */}
        <div className="pt-4 border-t space-y-3">
          <div className="text-sm font-semibold">Gold Holdings</div>
          <div className="space-y-2">
            {tradableGoldTypes.map((gold) => {
              const holding = goldHoldings[gold.type] || 0
              if (holding <= 0) return null

              const { thbValue, usdValue } = getGoldValue(gold.type, holding)
              const { pnlThb, pnlUsd, pnlPercent, hasAverage } =
                calculatePnL(gold.type, holding)

              const pnlColorClass =
                pnlPercent != null && pnlPercent > 0
                  ? "text-emerald-500"
                  : pnlPercent != null && pnlPercent < 0
                  ? "text-red-500"
                  : "text-gray-500"
              const pnlSign = pnlPercent != null && pnlPercent > 0 ? "+" : ""

              return (
                <div
                  key={gold.type}
                  className="flex flex-col text-sm border-b pb-2 last:border-b-0 last:pb-0"
                >
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{gold.title}:</span>
                    <span className="font-medium">
                      {holding.toFixed(4)} {gold.unit}
                    </span>
                  </div>

                  {/* Current Value */}
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Current Value:</span>
                    <span>
                      {thbValue != null
                        ? thbValue.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })
                        : "N/A"}{" "}
                      THB /{" "}
                      {usdValue != null
                        ? usdValue.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })
                        : "N/A"}{" "}
                      USD
                    </span>
                  </div>

                  {/* Average Cost per Unit */}
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Avg. Cost / {gold.unit}:</span>
                    <span>
                      {averageCosts?.[gold.type] != null
                        ? averageCosts[gold.type]?.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })
                        : "N/A"}{" "}
                      THB
                    </span>
                  </div>

                  {/* P/L */}
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>P/L:</span>
                    {/*
                      ตามความต้องการ:
                      - ถ้ามีข้อมูล (hasAverage เป็น true) → แสดงตัวเลข + %
                      - ถ้าไม่มีข้อมูล (hasAverage เป็น false) → แสดง N/A (requires average cost)
                      การใช้ hasAverage จาก calculatePnL ช่วยให้ควบคุมการแสดงผลได้ตามต้องการ
                    */}
                    {hasAverage && pnlThb != null && pnlUsd != null && pnlPercent != null ? (
                      <span className={`font-medium ${pnlColorClass}`}>
                        {pnlSign}
                        {pnlThb.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        THB /{" "}
                        {pnlSign}
                        {pnlUsd.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        USD{" "}
                        {`(${pnlSign}${pnlPercent.toFixed(2)}%)`}
                      </span>
                    ) : (
                      <span className="text-gray-400">
                        N/A (requires average cost)
                      </span>
                    )}
                  </div>
                </div>
              )
            })}

            {tradableGoldTypes.every(
              (gold) => (goldHoldings[gold.type] || 0) === 0
            ) && (
              <div className="text-sm text-muted-foreground">
                No gold holdings.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
