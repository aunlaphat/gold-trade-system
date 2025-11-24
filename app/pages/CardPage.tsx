"use client"

import { useState, useEffect } from "react"
import { PriceCard } from "@/app/components/trading/PriceCard"
import { Input } from "@/app/components/ui/input"
import { Search } from "lucide-react"

interface CardPageProps {
  prices: any
  previousPrices: Record<string, number>
  statuses: any[]
  wallet: any
  displayCurrency: "THB" | "USD"
}

export default function CardPage({
  prices,
  previousPrices,
  statuses,
  wallet,
  displayCurrency,
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

  const getStatus = (goldType: string) => {
    const status = statuses.find((s) => s.goldType === goldType)
    return status?.status || "ONLINE"
  }

  const gold9999MtsPrice = getPrice("GOLD_9999_MTS")
  const gold965MtsPrice = getPrice("GOLD_965_MTS")
  const gold965Price = getPrice("GOLD_965")
  const gold9999Price = getPrice("GOLD_9999")
  const spotPrice = getPrice("SPOT")
  const gold965AssoPrice = getPrice("GOLD_965_ASSO")

  const referenceGoldTypes = [
    { type: "SPOT", price: spotPrice, title: "Gold Spot", unit: "USD/oz", tradable: false },
    { type: "GOLD_9999", price: gold9999Price, title: "Gold 99.99% (Global)", unit: "THB/g", tradable: false },
    { type: "GOLD_965", price: gold965Price, title: "Gold 96.5% (Global)", unit: "THB/baht", tradable: false },
  ]

  const tradingGoldTypes = [
    { type: "GOLD_9999_MTS", price: gold9999MtsPrice, title: "Gold 99.99% (MTS)", unit: "THB/g", tradable: true },
    { type: "GOLD_965_MTS", price: gold965MtsPrice, title: "Gold 96.5% (MTS)", unit: "THB/baht", tradable: true },
    { type: "GOLD_965_ASSO", price: gold965AssoPrice, title: "Gold 96.5% (สมาคม)", unit: "THB/baht", tradable: true },
  ]

  const hasPriceData = (price: any) => {
    if (!price) return false
    return price.price != null || price.buyIn != null || price.sellOut != null
  }

  const filteredReferenceTypes = referenceGoldTypes.filter(
    (gold) =>
      hasPriceData(gold.price) &&
      (gold.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gold.type.toLowerCase().includes(searchTerm.toLowerCase()))
  )

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
      console.log("Trading Types:")
      tradingGoldTypes.forEach((gold) => {
        const priceData = gold.price
        const hasData = hasPriceData(priceData)
        console.log(`  ${gold.type} (${gold.title}):`, {
          hasData,
          price: priceData?.price ?? null,
          buyIn: priceData?.buyIn ?? null,
          sellOut: priceData?.sellOut ?? null,
          filtered: filteredTradingTypes.some((g) => g.type === gold.type),
        })
      })
      console.log("Raw prices object:", prices)
      console.log("==============================")
    }
  }, [prices, referenceGoldTypes, tradingGoldTypes, filteredReferenceTypes, filteredTradingTypes])


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
          <h2 className="text-lg font-semibold text-muted-foreground">Market Indices (Reference Only)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              />
            ))}
          </div>
        </div>
      )}

      {/* Trading Group: Gold Partners */}
      {filteredTradingTypes.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Gold Partners (Tradable)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
    </div>
  )
}
