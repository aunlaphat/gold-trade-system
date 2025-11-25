"use client"

import { useState, useCallback } from "react"
import { WalletCard } from "@/app/components/wallet/WalletCard"
import { GoldHoldingsCard } from "@/app/components/wallet/GoldHoldingsCard"
import { DepositDialog } from "@/app/components/wallet/DepositDialog"
import { WithdrawDialog } from "@/app/components/wallet/WithdrawDialog"
import { ExchangeDialog } from "@/app/components/wallet/ExchangeDialog"

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
    <>
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 sm:gap-6 animate-slide-in">
        {wallet && (
          <>
            <div className="lg:col-span-3">
              <WalletCard
                balance={wallet.balance}
                goldHoldings={wallet.goldHoldings}
                currentMarketPrices={currentMarketPrices}
                exchangeRates={exchangeRates}
                averageCosts={averageCosts}
                onDeposit={() => setDepositOpen(true)}
                onWithdraw={() => setWithdrawOpen(true)}
                onExchange={handleExchangeOpen}
              />
            </div>
            <div className="lg:col-span-7">
              <GoldHoldingsCard
                goldHoldings={wallet.goldHoldings}
                currentMarketPrices={currentMarketPrices}
                exchangeRates={exchangeRates}
                averageCosts={averageCosts}
              />
            </div>
          </>
        )}
      </div>

      <DepositDialog open={depositOpen} onOpenChange={setDepositOpen} onSuccess={fetchWallet} />
      {wallet && (
        <>
          <WithdrawDialog
            open={withdrawOpen}
            onOpenChange={setWithdrawOpen}
            onSuccess={fetchWallet}
            maxAmount={typeof wallet.balance === "number" ? wallet.balance : (wallet.balance?.THB ?? 0)}
          />
          <ExchangeDialog
            open={exchangeOpen}
            onOpenChange={setExchangeOpen}
            onSuccess={fetchWallet}
            thbBalance={wallet.balance?.THB ?? 0}
            usdBalance={wallet.balance?.USD ?? 0}
          />
        </>
      )}
    </>
  )
}
