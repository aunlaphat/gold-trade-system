"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Wallet, TrendingUp, History, BarChart3 } from "lucide-react"
import WalletPage from "./WalletPage"
import CardPage from "./CardPage"
import ChartPage from "./ChartPage"
import TransactionPage from "./TransactionPage"

interface MainDashboardProps {
  wallet: any
  prices: any
  previousPrices: Record<string, number>
  statuses: any[]
  transactions: any[]
  displayCurrency: "THB" | "USD"
  fetchWallet: () => void
  fetchTransactions: () => void
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

export default function MainDashboard({
  wallet,
  prices,
  previousPrices,
  statuses,
  transactions,
  displayCurrency,
  fetchWallet,
  fetchTransactions,
  tradingGoldTypes,
  handleTradeComplete,
  getStatus,
}: MainDashboardProps) {
  const [activeTab, setActiveTab] = useState("prices")

  return (
    <div className="animate-fade-in">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-8 h-auto p-1 bg-card border border-border">
          <TabsTrigger
            value="prices"
            className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all text-xs sm:text-sm"
          >
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="inline">ราคาทอง</span>
          </TabsTrigger>
          <TabsTrigger
            value="wallet"
            className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all text-xs sm:text-sm"
          >
            <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="inline">กระเป๋า</span>
          </TabsTrigger>
          <TabsTrigger
            value="charts"
            className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all text-xs sm:text-sm"
          >
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="inline">กราฟ</span>
          </TabsTrigger>
          <TabsTrigger
            value="transactions"
            className="flex items-center gap-1 sm:gap-2 py-2 sm:py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all text-xs sm:text-sm"
          >
            <History className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="inline">ประวัติ</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prices" className="space-y-6 mt-0">
          <CardPage
            prices={prices}
            previousPrices={previousPrices}
            statuses={statuses}
            wallet={wallet}
            displayCurrency={displayCurrency}
            tradingGoldTypes={tradingGoldTypes}
            handleTradeComplete={handleTradeComplete}
            getStatus={getStatus}
          />
        </TabsContent>

        <TabsContent value="wallet" className="space-y-6 mt-0">
            <WalletPage
              wallet={wallet}
              currentMarketPrices={prices}
              exchangeRates={wallet?.exchangeRates}
              averageCosts={wallet?.averageCosts}
              fetchWallet={fetchWallet}
              fetchTransactions={fetchTransactions}
            />
        </TabsContent>

        <TabsContent value="charts" className="space-y-6 mt-0">
          <ChartPage statuses={statuses} />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6 mt-0">
          <TransactionPage transactions={transactions} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
