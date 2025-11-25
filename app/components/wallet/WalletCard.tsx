"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Wallet, Plus, Minus, Repeat2, Banknote, DollarSign } from "lucide-react"

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
    const thbValue = baseCurrency === "THB" ? valueInBase : convertToTHB(valueInBase, "USD")

    // USD value: ถ้า base = USD ก็ใช้ได้เลย ไม่ต้องแปลง
    // ถ้า base = THB และไม่มี exchangeRates จะคืนค่า null
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
    const pnlPercent = ((currentPriceInBase - avgCostInBase) / avgCostInBase) * 100

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
    <Card className="border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-primary/20">
        <CardTitle className="flex items-center gap-3 text-primary">
          <div className="p-2 rounded-lg bg-primary/20">
            <Wallet className="h-6 w-6" />
          </div>
          <span className="text-xl">กระเป๋าเงิน</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Cash THB */}
        <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 mb-2">
            <Banknote className="h-4 w-4" />
            <span className="font-medium">ยอดเงินบาทไทย (THB)</span>
          </div>
          <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
            ฿{balance.THB.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Cash USD */}
        <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400 mb-2">
            <DollarSign className="h-4 w-4" />
            <span className="font-medium">ยอดเงินดอลลาร์ (USD)</span>
          </div>
          <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">
            ${balance.USD.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <Button
            onClick={onDeposit}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-md hover:shadow-lg transition-all transition-all bg-transparent text-xs whitespace-nowrap flex items-center justify-center gap-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            ฝาก
          </Button>
          <Button
            onClick={onWithdraw}
            variant="outline"
            className="w-full border-amber-500/50 hover:bg-amber-500/10 hover:border-amber-500 transition-all bg-transparent transition-all bg-transparent text-xs whitespace-nowrap flex items-center justify-center gap-1"
          >
            <Minus className="h-4 w-4 mr-2" />
            ถอน
          </Button>
          <Button
            onClick={onExchange}
            variant="outline"
            className="w-full border-blue-500/50 hover:bg-blue-500/10 hover:border-blue-500 transition-all transition-all bg-transparent text-xs whitespace-nowrap flex items-center justify-center gap-1"
          >
            <Repeat2 className="h-4 w-4 mr-2" />
            แลกเปลี่ยน
          </Button>
        </div>

      </CardContent>
    </Card>
  )
}
