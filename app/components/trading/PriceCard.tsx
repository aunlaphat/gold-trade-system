"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"
import { useState, useEffect } from "react"

interface PriceCardProps {
  goldType: string
  title: string
  buyIn?: number | null
  sellOut?: number | null
  price?: number | null
  unit: string
  status: "ONLINE" | "PAUSE" | "STOP"
  previousPrice?: number
  displayCurrency: "THB" | "USD" // New prop
  exchangeRates: { USD: number } | null // New prop
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
}: PriceCardProps) {
  const [priceDirection, setPriceDirection] = useState<"up" | "down" | "neutral">("neutral")
  const [isAnimating, setIsAnimating] = useState(false)

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

  // Determine the base currency of the gold type for conversion
  const getBaseCurrency = (type: string) => {
    if (type === "SPOT") { // Only SPOT is USD-based
      return "USD"
    }
    return "THB" // All other types, including Global 99.99% and 96.5%, are THB-based
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
    if (status === "STOP") return "-" // Display "-" for STOP status
    if (value == null || !Number.isFinite(value)) return "-" // Display "-" for null/invalid prices
    return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <Card
      className={`transition-all duration-300 ${isAnimating ? (priceDirection === "up" ? "bg-emerald-50 dark:bg-emerald-950" : "bg-red-50 dark:bg-red-950") : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <Badge className={getStatusColor()}>{status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {buyIn !== undefined && sellOut !== undefined ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Buy</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatDisplayPrice(convertedBuyIn)} {displayCurrency}
                </span>
                {priceDirection === "up" && <TrendingUp className="h-4 w-4 text-emerald-600" />}
                {priceDirection === "down" && <TrendingDown className="h-4 w-4 text-red-600" />}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Sell</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatDisplayPrice(convertedSellOut)} {displayCurrency}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Price</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {formatDisplayPrice(convertedPrice)} {displayCurrency}
              </span>
              {priceDirection === "up" && <TrendingUp className="h-4 w-4 text-emerald-600" />}
              {priceDirection === "down" && <TrendingDown className="h-4 w-4 text-red-600" />}
            </div>
          </div>
        )}
        <div className="text-xs text-muted-foreground text-right">{unit}</div>
      </CardContent>
    </Card>
  )
}
