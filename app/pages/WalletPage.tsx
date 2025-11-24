"use client"

import { useState, useCallback } from "react"
import { WalletCard } from "@/app/components/wallet/WalletCard"
import { DepositDialog } from "@/app/components/wallet/DepositDialog"
import { WithdrawDialog } from "@/app/components/wallet/WithdrawDialog"
import { ExchangeDialog } from "@/app/components/wallet/ExchangeDialog"
import { apiClient } from "@/app/lib/api-client"

interface WalletPageProps {
  wallet: any
  currentMarketPrices: any
  exchangeRates: { USD: number } | null
  averageCosts: { [key: string]: number | undefined }
  fetchWallet: () => void
  fetchTransactions: () => void
}

export default function WalletPage({
  wallet,
  currentMarketPrices,
  exchangeRates,
  averageCosts,
  fetchWallet,
  fetchTransactions,
}: WalletPageProps) {
  const [depositOpen, setDepositOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [exchangeOpen, setExchangeOpen] = useState(false)

  const handleExchangeOpen = useCallback(() => {
    setExchangeOpen(true)
  }, [])

  return (
    <div className="lg:col-span-1 space-y-6">
      {wallet && (
        <WalletCard
          balance={wallet.balance}
          goldHoldings={wallet.goldHoldings}
          onDeposit={() => setDepositOpen(true)}
          onWithdraw={() => setWithdrawOpen(true)}
          onExchange={handleExchangeOpen}
          currentMarketPrices={currentMarketPrices}
          exchangeRates={exchangeRates}
          averageCosts={averageCosts}
        />
      )}

      <DepositDialog open={depositOpen} onOpenChange={setDepositOpen} onSuccess={fetchWallet} />
      {wallet && (
        <WithdrawDialog
          open={withdrawOpen}
          onOpenChange={setWithdrawOpen}
          onSuccess={fetchWallet}
          maxAmount={
            typeof wallet.balance === "number"
              ? wallet.balance
              : wallet.balance?.THB ?? 0
          }
        />
      )}
      {wallet && (
        <ExchangeDialog
          open={exchangeOpen}
          onOpenChange={setExchangeOpen}
          onSuccess={fetchWallet}
          thbBalance={wallet.balance?.THB ?? 0}
          usdBalance={wallet.balance?.USD ?? 0}
        />
      )}
    </div>
  )
}
