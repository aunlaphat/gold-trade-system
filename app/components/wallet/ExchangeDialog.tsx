"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/app/components/ui/dialog"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { apiClient } from "@/app/lib/api-client"
import { useToast } from "@/app/components/ui/use-toast"
import { Loader2, Repeat2 } from "lucide-react"

interface ExchangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  thbBalance: number
  usdBalance: number
}

export function ExchangeDialog({
  open,
  onOpenChange,
  onSuccess,
  thbBalance,
  usdBalance,
}: ExchangeDialogProps) {
  const { toast } = useToast()
  const [fromCurrency, setFromCurrency] = useState("THB")
  const [toCurrency, setToCurrency] = useState("USD")
  const [amount, setAmount] = useState("")
  const [convertedAmount, setConvertedAmount] = useState(0)
  const [exchangeRate, setExchangeRate] = useState(0)
  const [loading, setLoading] = useState(false)
  const [rates, setRates] = useState<{ USD: number } | null>(null)

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const walletData = await apiClient.getWallet()
        if (walletData && walletData.exchangeRates) {
          setRates(walletData.exchangeRates)
        }
      } catch (error) {
        console.error("Failed to fetch exchange rates:", error)
        toast({
          title: "Error",
          description: "Failed to fetch exchange rates.",
          variant: "destructive",
        })
      }
    }
    if (open) {
      fetchRates()
      setAmount("")
      setConvertedAmount(0)
      setExchangeRate(0)
    }
  }, [open, toast])

  useEffect(() => {
    if (amount && rates) {
      const numAmount = parseFloat(amount)
      if (isNaN(numAmount) || numAmount <= 0) {
        setConvertedAmount(0)
        setExchangeRate(0)
        return
      }

      if (fromCurrency === "THB" && toCurrency === "USD") {
        const rate = rates.USD
        setExchangeRate(rate)
        setConvertedAmount(numAmount / rate)
      } else if (fromCurrency === "USD" && toCurrency === "THB") {
        const rate = rates.USD
        setExchangeRate(rate)
        setConvertedAmount(numAmount * rate)
      }
    } else {
      setConvertedAmount(0)
      setExchangeRate(0)
    }
  }, [amount, fromCurrency, toCurrency, rates])

  const handleExchange = async () => {
    const numAmount = parseFloat(amount)

    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount.",
        variant: "destructive",
      })
      return
    }

    if (fromCurrency === "THB" && numAmount > thbBalance) {
      toast({
        title: "Insufficient THB Balance",
        description: "You do not have enough THB for this exchange.",
        variant: "destructive",
      })
      return
    }

    if (fromCurrency === "USD" && numAmount > usdBalance) {
      toast({
        title: "Insufficient USD Balance",
        description: "You do not have enough USD for this exchange.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await apiClient.exchangeCurrency({
        fromCurrency,
        toCurrency,
        amount: numAmount,
      })
      toast({
        title: "Exchange Successful",
        description: `${numAmount} ${fromCurrency} exchanged to ${convertedAmount.toFixed(2)} ${toCurrency}.`,
      })
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("[ExchangeDialog] Exchange failed:", error)
      const errorMessage = error.message || "An unexpected error occurred."
      const errorDetails = error.details || errorMessage // Extract details
      console.log("[ExchangeDialog] Toasting error:", { title: "Exchange Failed", description: errorDetails, originalError: error }); // Debugging log
      toast({
        title: "Exchange Failed",
        description: errorDetails, // Use errorDetails for description
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const swapCurrencies = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
    setAmount("") // Clear amount on swap to re-evaluate
  }

  const currentBalance = fromCurrency === "THB" ? thbBalance : usdBalance

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Exchange Currency</DialogTitle>
          <DialogDescription>
            Exchange rates are updated every hour and may not reflect real-time market prices.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fromCurrency" className="text-right">
              From
            </Label>
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger className="col-span-2">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="THB">THB</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={swapCurrencies}>
              <Repeat2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="toCurrency" className="text-right">
              To
            </Label>
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="THB">THB</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="col-span-3"
              placeholder={`Available: ${currentBalance.toFixed(2)} ${fromCurrency}`}
            />
          </div>
          {exchangeRate > 0 && (
            <div className="grid grid-cols-4 items-center gap-4 text-sm text-muted-foreground">
              <span className="col-span-1 text-right">Rate:</span>
              <span className="col-span-3">
                1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency} (approx)
              </span>
            </div>
          )}
          {convertedAmount > 0 && (
            <div className="grid grid-cols-4 items-center gap-4 text-lg font-semibold">
              <span className="col-span-1 text-right">Receive:</span>
              <span className="col-span-3">
                {convertedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} {toCurrency}
              </span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExchange} disabled={loading || !amount || parseFloat(amount) <= 0}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Exchange
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
