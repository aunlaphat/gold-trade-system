"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { apiClient } from "@/app/lib/api-client"
import { useToast } from "@/app/hooks/use-toast"

interface DepositDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function DepositDialog({ open, onOpenChange, onSuccess }: DepositDialogProps) {
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleDeposit = async () => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await apiClient.deposit(Number.parseFloat(amount))
      console.log("[DepositDialog] Deposit API response:", response)

      toast({
        title: "Deposit successful",
        description: `Deposited ${amount} THB. New balance: ${response.balance?.THB?.toFixed(2) || 'N/A'} THB`,
      })

      setAmount("")
      onOpenChange(false)
      onSuccess() // This should trigger fetchWallet in app/page.tsx
    } catch (error: any) {
      console.error("[DepositDialog] Deposit failed:", error)
      const errorMessage = error.message || "An unexpected error occurred."
      const errorDetails = error.details || errorMessage // Extract details
      toast({
        title: "Deposit failed",
        description: errorDetails, // Use errorDetails for description
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deposit Money</DialogTitle>
          <DialogDescription>Add funds to your wallet to start trading</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="deposit-amount">Amount (THB)</Label>
            <Input
              id="deposit-amount"
              type="number"
              placeholder="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="100"
              min="0"
            />
          </div>
          <Button onClick={handleDeposit} className="w-full" disabled={isLoading}>
            {isLoading ? "Processing..." : "Deposit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
