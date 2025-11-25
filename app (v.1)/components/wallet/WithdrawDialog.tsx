"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { apiClient } from "@/app/lib/api-client"
import { useToast } from "@/app/hooks/use-toast"

interface WithdrawDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  maxAmount?: number | null
}

export function WithdrawDialog({ open, onOpenChange, onSuccess, maxAmount }: WithdrawDialogProps) {
  // ✅ ทำให้ maxAmount ปลอดภัยเสมอ (ไม่เป็น null/undefined/NaN/ค่าติดลบ)
  const safeMaxAmount =
    typeof maxAmount === "number" && !isNaN(maxAmount) && maxAmount > 0 ? maxAmount : 0

  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleWithdraw = async () => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    const withdrawAmount = Number.parseFloat(amount)

    if (safeMaxAmount > 0 && withdrawAmount > safeMaxAmount) {
      toast({
        title: "Insufficient balance",
        description: `Maximum withdrawal: ${safeMaxAmount.toFixed(2)} THB`,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await apiClient.withdraw(withdrawAmount)

      toast({
        title: "Withdrawal successful",
        description: `Withdrawn ${withdrawAmount.toFixed(2)} THB`,
      })

      setAmount("")
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      console.error("[WithdrawDialog] Withdrawal failed:", error)
      const errorMessage = error.message || "An unexpected error occurred."
      const errorDetails = error.details || errorMessage // Extract details
      toast({
        title: "Withdrawal failed",
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
          <DialogTitle>Withdraw Money</DialogTitle>
          <DialogDescription>Withdraw funds from your wallet</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="withdraw-amount">Amount (THB)</Label>
            {/* safeMaxAmount เป็น number แน่นอน ใช้เป็น max ได้ปลอดภัย */}
            <Input
              id="withdraw-amount"
              type="number"
              placeholder="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="100"
              min={0}
              max={safeMaxAmount}
            />
            <div className="text-xs text-muted-foreground">
              Available: {safeMaxAmount.toFixed(2)} THB
            </div>
          </div>
          <Button onClick={handleWithdraw} className="w-full" disabled={isLoading}>
            {isLoading ? "Processing..." : "Withdraw"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
