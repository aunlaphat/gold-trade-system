"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { format } from "date-fns"
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react"

interface Transaction {
  _id: string
  goldType: string
  action: "BUY" | "SELL"
  amount: number
  price: number
  totalCost: number
  currency: "THB" | "USD" // Added currency
  status: string
  createdAt: string
}

interface TransactionListProps {
  transactions: Transaction[]
}

export function TransactionList({ transactions }: TransactionListProps) {
  const [activeTab, setActiveTab] = useState("all")

  const filteredTransactions = transactions.filter((tx) => {
    if (activeTab === "all") return true
    return tx.action.toLowerCase() === activeTab
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="buy">Buy</TabsTrigger>
            <TabsTrigger value="sell">Sell</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-4">
            {filteredTransactions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No transactions yet</div>
            ) : (
              filteredTransactions.map((tx) => (
                <div
                  key={tx._id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {tx.action === "BUY" ? (
                      <ArrowDownCircle className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <ArrowUpCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <div className="font-medium">
                        {tx.action} {tx.goldType.replace(/_/g, " ")}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {tx.amount.toFixed(4)} {tx.goldType.includes("oz") ? "oz" : "g"} @ {tx.price.toLocaleString()} {tx.currency}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {tx.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })} {tx.currency}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(tx.createdAt), "MMM dd, yyyy HH:mm")}
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
          <TabsContent value="buy" className="space-y-3 mt-4">
            {filteredTransactions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No buy transactions yet</div>
            ) : (
              filteredTransactions.map((tx) => (
                <div
                  key={tx._id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ArrowDownCircle className="h-5 w-5 text-emerald-600" />
                    <div>
                      <div className="font-medium">
                        {tx.action} {tx.goldType.replace(/_/g, " ")}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {tx.amount.toFixed(4)} {tx.goldType.includes("oz") ? "oz" : "g"} @ {tx.price.toLocaleString()} {tx.currency}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {tx.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })} {tx.currency}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(tx.createdAt), "MMM dd, yyyy HH:mm")}
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
          <TabsContent value="sell" className="space-y-3 mt-4">
            {filteredTransactions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No sell transactions yet</div>
            ) : (
              filteredTransactions.map((tx) => (
                <div
                  key={tx._id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ArrowUpCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <div className="font-medium">
                        {tx.action} {tx.goldType.replace(/_/g, " ")}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {tx.amount.toFixed(4)} {tx.goldType.includes("oz") ? "oz" : "g"} @ {tx.price.toLocaleString()} {tx.currency}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {tx.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })} {tx.currency}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(tx.createdAt), "MMM dd, yyyy HH:mm")}
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
