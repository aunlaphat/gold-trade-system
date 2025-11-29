"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { apiClient } from "@/app/lib/api-client"
import { useToast } from "@/app/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"

interface TradePanelProps {
  goldType: string
  title: string
  buyPrice: number            // ราคา base currency / หน่วย
  sellPrice: number           // ราคา base currency / หน่วย
  onTradeComplete: () => void
  thbBalance: number
  usdBalance: number
  goldHoldings: { [key: string]: number }
  displayCurrency: "THB" | "USD"
  exchangeRates: { USD: number } | null
  status: "ONLINE" | "PAUSE" | "STOP"
}

export function TradePanel({
  goldType,
  title,
  buyPrice,
  sellPrice,
  onTradeComplete,
  thbBalance,
  usdBalance,
  goldHoldings,
  displayCurrency,
  exchangeRates,
  status,
}: TradePanelProps) {
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const isTradable = status === "ONLINE"
  const tradeMessage =
    status === "PAUSE"
      ? "Trading is paused for this product."
      : status === "STOP"
        ? "Trading is stopped for this product."
        : ""

  // ──────────────────────────────────────────────
  // 1) เลือก currency ตั้งต้น (ตาม type เดิมของคุณ)
  // ──────────────────────────────────────────────
  const getDefaultCurrency = (type: string): "THB" | "USD" => {
    if (type === "SPOT" || type === "GOLD_9999" || type === "GOLD_965") {
      return "USD"
    }
    return "THB"
  }

  const [selectedCurrency, setSelectedCurrency] = useState<"THB" | "USD">(() => getDefaultCurrency(goldType))

  // ──────────────────────────────────────────────
  // 2) Base currency ของราคา (ราคาที่ backend ส่งมา)
  // ──────────────────────────────────────────────
  const getBaseCurrency = (type: string): "THB" | "USD" => {
    // ตรงนี้ตามที่คุณตั้งเงื่อนไขไว้: SPOT = USD, อย่างอื่น THB
    if (type === "SPOT") {
      return "USD"
    }
    return "THB"
  }

  const baseCurrency = getBaseCurrency(goldType)

  // ──────────────────────────────────────────────
  // 3) ฟังก์ชัน convert THB ↔ USD แบบทั่วไป
  // ──────────────────────────────────────────────
  const convertPrice = (value: number, fromCurrency: "THB" | "USD", toCurrency: "THB" | "USD") => {
    if (fromCurrency === toCurrency) return value
    if (!exchangeRates || !exchangeRates.USD || exchangeRates.USD <= 0) {
      // ถ้าไม่มี rate ให้ fallback เป็น value เดิม (กันพัง)
      return value
    }

    if (fromCurrency === "THB" && toCurrency === "USD") {
      return value / exchangeRates.USD
    }

    if (fromCurrency === "USD" && toCurrency === "THB") {
      return value * exchangeRates.USD
    }

    return value
  }

  // ──────────────────────────────────────────────
  // 4) ราคาในการ "เทรด" (อยู่ใน selectedCurrency เสมอ)
  // ──────────────────────────────────────────────
  const displayedBuyPrice = convertPrice(buyPrice, baseCurrency, selectedCurrency)
  const displayedSellPrice = convertPrice(sellPrice, baseCurrency, selectedCurrency)

  // ยอดเงินในกระเป๋าตาม currency ที่ user เลือกใช้เทรด
  const currentCashBalance = selectedCurrency === "THB" ? thbBalance : usdBalance
  const currentGoldHolding = goldHoldings[goldType] || 0

  // ──────────────────────────────────────────────
  // 5) Execute Trade (BUY / SELL)
  // ──────────────────────────────────────────────
  const executeTrade = async (action: "BUY" | "SELL") => {
    console.log(
      `[TradePanel] executeTrade called for ${action} ${goldType}. Amount: ${amount}, Selected Currency: ${selectedCurrency}.`,
    )

    const numAmount = Number.parseFloat(amount)

    if (!amount || numAmount <= 0 || Number.isNaN(numAmount)) {
      console.warn(`[TradePanel] Invalid amount for ${action} ${goldType}: ${amount}.`)
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    if (!isTradable) {
      toast({
        title: "Trading unavailable",
        description: tradeMessage || "This product is not tradable at the moment.",
        variant: "destructive",
      })
      return
    }

    // ใช้ราคาที่เป็น selectedCurrency ในการคำนวณจำนวนเงินที่ต้องใช้/ได้รับจริง
    const unitPriceInSelectedCurrency =
      action === "BUY" ? displayedBuyPrice : displayedSellPrice

    const totalCostInSelectedCurrency = numAmount * unitPriceInSelectedCurrency

    if (action === "BUY") {
      // เช็คยอดเงินในกระเป๋า selectedCurrency
      if (currentCashBalance + 1e-8 < totalCostInSelectedCurrency) {
        console.warn(
          `[TradePanel] Insufficient Balance for BUY ${goldType}. Required: ${totalCostInSelectedCurrency.toFixed(
            2,
          )} ${selectedCurrency}, Available: ${currentCashBalance.toFixed(2)} ${selectedCurrency}.`,
        )
        toast({
          title: "Insufficient Balance",
          description: `You do not have enough ${selectedCurrency} for this purchase. Required: ${totalCostInSelectedCurrency.toFixed(
            2,
          )} ${selectedCurrency}`,
          variant: "destructive",
        })
        return
      }
    } else {
      // SELL: เช็คจำนวนทองที่ถือ
      if (currentGoldHolding + 1e-8 < numAmount) {
        console.warn(
          `[TradePanel] Insufficient Gold Holdings for SELL ${goldType}. Required: ${numAmount.toFixed(
            4,
          )}, Available: ${currentGoldHolding.toFixed(4)}.`,
        )
        toast({
          title: "Insufficient Gold Holdings",
          description: `You do not have enough ${goldType} to sell. Available: ${currentGoldHolding.toFixed(4)}`,
          variant: "destructive",
        })
        return
      }
    }

    setIsLoading(true)
    try {
      console.log(
        `[TradePanel] Calling apiClient.executeTrade for ${action} ${goldType} with amount ${numAmount} and currency ${selectedCurrency}.`,
      )

      // Backend จะคำนวณราคาจริงเองจาก currency + goldType + amount
      await apiClient.executeTrade(goldType, action, numAmount, selectedCurrency)

      toast({
        title: "Trade successful",
        description: `${action} ${numAmount} ${title} using ${selectedCurrency}`,
      })

      setAmount("")
      onTradeComplete()
    } catch (error: any) {
      console.error(`[TradePanel] Trade failed for ${action} ${goldType}:`, error?.message)
      const errorMessage = error?.message || "An unexpected error occurred."
      const errorDetails = error?.details || errorMessage
      toast({
        title: "Trade failed",
        description: errorDetails,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      console.log(`[TradePanel] Trade operation finished for ${action} ${goldType}.`)
    }
  }

  // คำนวณ Total แสดงบน UI: ใช้ราคาใน selectedCurrency
  const calculateTotal = (priceInSelectedCurrency: number) => {
    const qty = Number.parseFloat(amount) || 0
    return (qty * priceInSelectedCurrency).toLocaleString("en-US", {
      minimumFractionDigits: 2,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="buy" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy">Buy</TabsTrigger>
            <TabsTrigger value="sell">Sell</TabsTrigger>
          </TabsList>

          {/* BUY TAB */}
          <TabsContent value="buy" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="buy-amount">Amount</Label>
              <Input
                id="buy-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buy-currency">Currency</Label>
              <Select
                value={selectedCurrency}
                onValueChange={(value: "THB" | "USD") => setSelectedCurrency(value)}
              >
                <SelectTrigger id="buy-currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="THB">THB</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-xs text-muted-foreground">
              Available cash:{" "}
              {currentCashBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
              {selectedCurrency}
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Price:</span>
              <span className="font-semibold">
                {displayedBuyPrice.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}{" "}
                {selectedCurrency}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-semibold">
                {calculateTotal(displayedBuyPrice)} {selectedCurrency}
              </span>
            </div>

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={() => executeTrade("BUY")}
              disabled={isLoading || !amount || parseFloat(amount) <= 0 || !isTradable}
            >
              {isLoading ? "Processing..." : "Buy"}
            </Button>

            {!isTradable && tradeMessage && (
              <p className="text-xs text-red-500 mt-1">{tradeMessage}</p>
            )}
          </TabsContent>

          {/* SELL TAB */}
          <TabsContent value="sell" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sell-amount">Amount</Label>
              <Input
                id="sell-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sell-currency">Currency</Label>
              <Select
                value={selectedCurrency}
                onValueChange={(value: "THB" | "USD") => setSelectedCurrency(value)}
              >
                <SelectTrigger id="sell-currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="THB">THB</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-xs text-muted-foreground">
              Available gold: {currentGoldHolding.toFixed(4)}{" "}
              {goldType.includes("oz") ? "oz" : "g"}
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Price:</span>
              <span className="font-semibold">
                {displayedSellPrice.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}{" "}
                {selectedCurrency}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-semibold">
                {calculateTotal(displayedSellPrice)} {selectedCurrency}
              </span>
            </div>

            <Button
              className="w-full bg-red-600 hover:bg-red-700"
              onClick={() => executeTrade("SELL")}
              disabled={isLoading || !amount || parseFloat(amount) <= 0 || !isTradable}
            >
              {isLoading ? "Processing..." : "Sell"}
            </Button>

            {!isTradable && tradeMessage && (
              <p className="text-xs text-red-500 mt-1">{tradeMessage}</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
