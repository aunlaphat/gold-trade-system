"use client"

import { useState, useEffect } from "react"
import { PriceCard } from "@/app/components/trading/PriceCard"
import { Input } from "@/app/components/ui/input"
import { Search } from "lucide-react"

import { TradePanel } from "@/app/components/trading/TradePanel"

interface CardPageProps {
  prices: any
  previousPrices: Record<string, number>
  statuses: any[]
  wallet: any
  displayCurrency: "THB" | "USD"
  tradingGoldTypes: {
    type: string
    price: any
    title: string
    unit: string
    tradable: boolean
  }[]
  handleTradeComplete: () => void
  getStatus: (goldType: string) => "ONLINE" | "PAUSE" | "STOP"
}

export default function CardPage({
  prices,
  previousPrices,
  statuses,
  wallet,
  displayCurrency,
  tradingGoldTypes,
  handleTradeComplete,
  getStatus,
}: CardPageProps) {
  const [searchTerm, setSearchTerm] = useState("")

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
      
      const searchTermNormalized = goldType.toLowerCase().replace(/_/g, "")
      for (const [k, v] of Object.entries(prices)) {
        const normalizedKey = k.toLowerCase().replace(/_/g, "")
        if (normalizedKey.includes(searchTermNormalized) || searchTermNormalized.includes(normalizedKey)) {
          return v
        }
      }
    }
    return null
  }

  // Removed local definition as it's now passed as a prop

  const referenceGoldTypes = [
    { type: "SPOT", price: getPrice("SPOT"), title: "Gold Spot", unit: "USD/oz", tradable: false },
    { type: "GOLD_9999", price: getPrice("GOLD_9999"), title: "Gold 99.99% (Global)", unit: "THB/g", tradable: false },
    { type: "GOLD_965", price: getPrice("GOLD_965"), title: "Gold 96.5% (Global)", unit: "THB/baht", tradable: false },
  ]

  // Removed local definition as it's now passed as a prop

  const hasPriceData = (price: any) => {
    if (!price) return false
    return price.price != null || price.buyIn != null || price.sellOut != null
  }

  const filteredReferenceTypes = referenceGoldTypes.map((gold) => {
    const hasData = hasPriceData(gold.price)
    const isFiltered =
      gold.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gold.type.toLowerCase().includes(searchTerm.toLowerCase())
    return {
      ...gold,
      hasData,
      isFiltered,
      errorMessage: !hasData ? "No price data available" : undefined,
    }
  }).filter((gold) => gold.isFiltered || !searchTerm) // Show all if no search term, otherwise show filtered

  const filteredTradingTypes = tradingGoldTypes.filter(
    (gold) =>
      hasPriceData(gold.price) &&
      (gold.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gold.type.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  useEffect(() => {
    if (prices) {
      console.log("===== Price Cards Status =====")
      console.log("Reference Types:")
      referenceGoldTypes.forEach((gold) => {
        const priceData = gold.price
        const hasData = hasPriceData(priceData)
        console.log(`  ${gold.type} (${gold.title}):`, {
          hasData,
          price: priceData?.price ?? null,
          buyIn: priceData?.buyIn ?? null,
          sellOut: priceData?.sellOut ?? null,
          filtered: filteredReferenceTypes.some((g) => g.type === gold.type),
        })
      })
      console.log("Raw prices object:", prices)
      console.log("==============================")
    }
  }, [prices, referenceGoldTypes, filteredReferenceTypes])


  return (
    <div className="space-y-6">
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
          <h2 className="text-base sm:text-lg font-semibold text-muted-foreground">Market Indices (Reference Only)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredReferenceTypes.map((gold) => (
              <PriceCard
                key={gold.type}
                goldType={gold.type}
                title={gold.title}
                price={
                  gold.price?.price ??
                  gold.price?.buyIn ??
                  gold.price?.sellOut
                }
                unit={gold.unit}
                status={getStatus(gold.type)}
                previousPrice={previousPrices[gold.type]}
                displayCurrency={displayCurrency}
                exchangeRates={wallet?.exchangeRates}
                errorMessage={gold.errorMessage}
              />
            ))}
          </div>
        </div>
      )}

      {/* Trading Group: Gold Partners */}
      {filteredTradingTypes.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-base sm:text-lg font-semibold">Gold Partners (Tradable)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredTradingTypes.map((gold) => (
              <PriceCard
                key={gold.type}
                goldType={gold.type}
                title={gold.title}
                price={gold.price?.price}
                buyIn={gold.price?.buyIn}
                sellOut={gold.price?.sellOut}
                unit={gold.unit}
                status={getStatus(gold.type)}
                previousPrice={previousPrices[gold.type]}
                displayCurrency={displayCurrency}
                exchangeRates={wallet?.exchangeRates}
              />
            ))}
          </div>
        </div>
      )}

      {/* Trading Panels */}
      {tradingGoldTypes.length > 0 && wallet && (
        <div className="mt-8 space-y-4 animate-fade-in">
          <h2 className="text-xl sm:text-2xl font-bold text-primary flex items-center gap-2">
            <span className="w-1 h-7 sm:h-8 bg-gradient-to-b from-amber-400 to-yellow-600 rounded-full"></span>
            ซื้อขายทอง
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {tradingGoldTypes.map((gold) => (
              <TradePanel
                key={gold.type}
                goldType={gold.type}
                title={`เทรด ${gold.title}`}
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
    </div>
  )
}
