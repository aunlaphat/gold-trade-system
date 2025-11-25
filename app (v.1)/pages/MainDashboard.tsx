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
}: MainDashboardProps) {
  const [activeTab, setActiveTab] = useState("prices")

  return (
    <div className="animate-fade-in">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8 h-auto p-1 bg-card border border-border">
          <TabsTrigger
            value="prices"
            className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
          >
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">ราคาทอง</span>
          </TabsTrigger>
          <TabsTrigger
            value="wallet"
            className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
          >
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">กระเป๋า & ทรัพย์สิน</span>
          </TabsTrigger>
          <TabsTrigger
            value="charts"
            className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">กราฟ</span>
          </TabsTrigger>
          <TabsTrigger
            value="transactions"
            className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">ประวัติการทำรายการ</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prices" className="space-y-6 mt-0">
          <CardPage
            prices={prices}
            previousPrices={previousPrices}
            statuses={statuses}
            wallet={wallet}
            displayCurrency={displayCurrency}
          />
        </TabsContent>

        <TabsContent value="wallet" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WalletPage
              wallet={wallet}
              currentMarketPrices={prices}
              exchangeRates={wallet?.exchangeRates}
              averageCosts={wallet?.averageCosts}
              fetchWallet={fetchWallet}
              fetchTransactions={fetchTransactions}
            />
          </div>
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
