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
  const referenceGoldTypes = [
    { type: "SPOT", price: null, title: "Gold Spot", unit: "USD/oz", tradable: false },
    { type: "GOLD_9999", price: null, title: "Gold 99.99% (Global)", unit: "THB/g", tradable: false },
    { type: "GOLD_965", price: null, title: "Gold 96.5% (Global)", unit: "THB/g", tradable: false },
  ]

  const getPrice = (goldType: string) => {
    if (!prices) return null
    if (typeof prices === "object") {
      const keyMap: Record<string, string> = {
        SPOT: "spot",
        GOLD_9999_MTS: "gold9999_mts",
        GOLD_965_MTS: "gold965_mts",
        GOLD_9999: "gold9999",
        GOLD_965: "gold965",
        GOLD_965_ASSO: "gold965_asso",
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

  const hasPriceData = (price: any) => {
    if (!price) return false
    return price.price != null || price.buyIn != null || price.sellOut != null
  }

  const filteredReferenceTypes = referenceGoldTypes
    .map((gold) => {
      const price = getPrice(gold.type)
      const hasData = hasPriceData(price)
      const isFiltered =
        gold.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gold.type.toLowerCase().includes(searchTerm.toLowerCase())
      return {
        ...gold,
        price,
        hasData,
        isFiltered,
        errorMessage: !hasData ? "No price data available" : undefined,
      }
    })
    .filter((gold) => gold.isFiltered || !searchTerm)

  const filteredTradingTypes = tradingGoldTypes.filter(
    (gold) =>
      hasPriceData(gold.price) &&
      (gold.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gold.type.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  useEffect(() => {
    if (prices) {
      console.log("===== Price Cards Status =====")
      console.log("Reference Types:")
      referenceGoldTypes.forEach((gold) => {
        const priceData = getPrice(gold.type)
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
  }, [prices, filteredReferenceTypes])

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="ค้นหาประเภททอง..."
          className="w-full pl-9 sm:pl-10 text-sm sm:text-base"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredReferenceTypes.length > 0 && (
        <div className="space-y-2 sm:space-y-3">
          <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-muted-foreground">ดัชนีตลาด (อ้างอิงเท่านั้น)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredReferenceTypes.map((gold) => (
              <PriceCard
                key={gold.type}
                goldType={gold.type}
                title={gold.title}
                price={gold.price?.price ?? gold.price?.buyIn ?? gold.price?.sellOut}
                unit={gold.unit}
                status={getStatus(gold.type)}
                previousPrice={previousPrices[gold.type]}
                displayCurrency={displayCurrency}
                exchangeRates={wallet?.exchangeRates}
                errorMessage={gold.errorMessage}
                tradable={false}
              />
            ))}
          </div>
        </div>
      )}

      {filteredTradingTypes.length > 0 && (
        <div className="space-y-2 sm:space-y-3">
          <h2 className="text-sm sm:text-base lg:text-lg font-semibold">พันธมิตรทองคำ (เทรดได้)</h2>
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
                tradable={true}
                wallet={wallet}
                onTradeComplete={handleTradeComplete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
