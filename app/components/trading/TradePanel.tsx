"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { apiClient } from "@/app/lib/api-client"
import { useToast } from "@/app/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select" // Import Select components

interface TradePanelProps {
  goldType: string
  title: string
  buyPrice: number
  sellPrice: number
  onTradeComplete: () => void
  thbBalance: number
  usdBalance: number
  goldHoldings: { [key: string]: number }
  displayCurrency: "THB" | "USD" // New prop
  exchangeRates: { USD: number } | null // New prop
  status: "ONLINE" | "PAUSE" | "STOP" // New prop for gold type status
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
  displayCurrency, // Destructure new prop
  exchangeRates, // Destructure new prop
  status, // Destructure new prop
}: TradePanelProps) {
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const isTradable = status === "ONLINE"
  const tradeMessage = status === "PAUSE" 
    ? "Trading is paused for this product." 
    : status === "STOP" 
      ? "Trading is stopped for this product." 
      : ""

  // Determine default currency based on gold type
  const getDefaultCurrency = (type: string) => {
    if (type === "SPOT" || type === "GOLD_9999" || type === "GOLD_965") {
      return "USD"
    }
    return "THB"
  }

  const [selectedCurrency, setSelectedCurrency] = useState<"THB" | "USD">(() => getDefaultCurrency(goldType))

  const currentCashBalance = selectedCurrency === "THB" ? thbBalance : usdBalance
  const currentGoldHolding = goldHoldings[goldType] || 0

  const convertPrice = (value: number, fromCurrency: "THB" | "USD") => {
    if (!exchangeRates) return value

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

  // Determine the base currency of the gold type for conversion
  const getBaseCurrency = (type: string) => {
    if (type === "SPOT") { // Only SPOT is USD-based
      return "USD"
    }
    return "THB" // All other types, including Global 99.99% and 96.5%, are THB-based
  }
  const baseCurrency = getBaseCurrency(goldType)

  const displayedBuyPrice = convertPrice(buyPrice, baseCurrency)
  const displayedSellPrice = convertPrice(sellPrice, baseCurrency)

  const executeTrade = async (action: "BUY" | "SELL") => {
    console.log(`[TradePanel] executeTrade called for ${action} ${goldType}. Amount: ${amount}, Selected Currency: ${selectedCurrency}.`)
    const numAmount = Number.parseFloat(amount)

    if (!amount || numAmount <= 0) {
      console.warn(`[TradePanel] Invalid amount for ${action} ${goldType}: ${amount}.`)
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    const price = action === "BUY" ? buyPrice : sellPrice // Use original price for backend call
    const totalCost = numAmount * price

    if (action === "BUY") {
      if (currentCashBalance < totalCost) {
        console.warn(`[TradePanel] Insufficient Balance for BUY ${goldType}. Required: ${totalCost.toFixed(2)} ${selectedCurrency}, Available: ${currentCashBalance.toFixed(2)} ${selectedCurrency}.`)
        toast({
          title: "Insufficient Balance",
          description: `You do not have enough ${selectedCurrency} for this purchase. Required: ${totalCost.toFixed(2)} ${selectedCurrency}`,
          variant: "destructive",
        })
        return
      }
    } else { // SELL
      if (currentGoldHolding < numAmount) {
        console.warn(`[TradePanel] Insufficient Gold Holdings for SELL ${goldType}. Required: ${numAmount.toFixed(4)}, Available: ${currentGoldHolding.toFixed(4)}.`)
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
      console.log(`[TradePanel] Calling apiClient.executeTrade for ${action} ${goldType} with amount ${numAmount} and currency ${selectedCurrency}.`)
      await apiClient.executeTrade(goldType, action, numAmount, selectedCurrency)

      toast({
        title: "Trade successful",
        description: `${action} ${numAmount} ${title} using ${selectedCurrency}`,
      })

      setAmount("")
      onTradeComplete()
    } catch (error: any) {
      console.error(`[TradePanel] Trade failed for ${action} ${goldType}:`, error.message)
      const errorMessage = error.message || "An unexpected error occurred."
      const errorDetails = error.details || errorMessage // Extract details
      toast({
        title: "Trade failed",
        description: errorDetails, // Use errorDetails for description
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      console.log(`[TradePanel] Trade operation finished for ${action} ${goldType}.`)
    }
  }

  const calculateTotal = (price: number) => {
    const qty = Number.parseFloat(amount) || 0
    return (qty * price).toLocaleString("en-US", { minimumFractionDigits: 2 })
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
              <Select value={selectedCurrency} onValueChange={(value: "THB" | "USD") => setSelectedCurrency(value)}>
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
              Available cash: {currentCashBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })} {selectedCurrency}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Price:</span>
              <span className="font-semibold">{displayedBuyPrice.toLocaleString()} {displayCurrency}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-semibold">{calculateTotal(displayedBuyPrice)} {displayCurrency}</span>
            </div>
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={() => executeTrade("BUY")}
              disabled={isLoading || !amount || parseFloat(amount) <= 0}
            >
              {isLoading ? "Processing..." : "Buy"}
            </Button>
          </TabsContent>

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
              <Select value={selectedCurrency} onValueChange={(value: "THB" | "USD") => setSelectedCurrency(value)}>
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
              Available gold: {currentGoldHolding.toFixed(4)} {goldType.includes("oz") ? "oz" : "g"}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Price:</span>
              <span className="font-semibold">{displayedSellPrice.toLocaleString()} {displayCurrency}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-semibold">{calculateTotal(displayedSellPrice)} {displayCurrency}</span>
            </div>
            <Button
              className="w-full bg-red-600 hover:bg-red-700"
              onClick={() => executeTrade("SELL")}
              disabled={isLoading || !amount || parseFloat(amount) <= 0}
            >
              {isLoading ? "Processing..." : "Sell"}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
