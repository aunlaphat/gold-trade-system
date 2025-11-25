"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { format } from "date-fns"
import { ArrowUpCircle, ArrowDownCircle, Receipt, Filter } from "lucide-react"

interface Transaction {
  _id: string
  goldType: string
  action: "BUY" | "SELL"
  amount: number
  price: number
  totalCost: number
  currency: "THB" | "USD"
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

  const renderTransaction = (tx: Transaction) => (
    <div
      key={tx._id}
      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 hover:border-primary/30 transition-all duration-200 group"
    >
      <div className="flex items-center gap-4">
        <div
          className={`p-3 rounded-lg ${
            tx.action === "BUY" ? "bg-emerald-100 dark:bg-emerald-950/50" : "bg-red-100 dark:bg-red-950/50"
          }`}
        >
          {tx.action === "BUY" ? (
            <ArrowDownCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <ArrowUpCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          )}
        </div>
        <div>
          <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
            {tx.action === "BUY" ? "ซื้อ" : "ขาย"} {tx.goldType.replace(/_/g, " ")}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {tx.amount.toFixed(4)} {tx.goldType.includes("oz") ? "oz" : "g"}
            <span className="mx-2">•</span>
            {tx.price.toLocaleString()} {tx.currency}/{tx.goldType.includes("oz") ? "oz" : "g"}
          </div>
          <div className="text-xs text-muted-foreground mt-1">{format(new Date(tx.createdAt), "dd/MM/yyyy HH:mm")}</div>
        </div>
      </div>
      <div className="text-right">
        <div
          className={`text-lg font-bold ${
            tx.action === "BUY" ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {tx.action === "BUY" ? "-" : "+"}
          {tx.currency === "THB" ? "฿" : "$"}
          {tx.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </div>
        <div className="text-xs text-muted-foreground mt-1">{tx.currency}</div>
      </div>
    </div>
  )

  return (
    <Card className="border-primary/20 shadow-lg animate-fade-in">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-primary/20">
        <CardTitle className="flex items-center gap-3 text-primary">
          <div className="p-2 rounded-lg bg-primary/20">
            <Receipt className="h-6 w-6" />
          </div>
          <span className="text-xl">ประวัติการทำรายการ</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted h-auto p-1">
            <TabsTrigger
              value="all"
              className="py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <Filter className="h-4 w-4 mr-2" />
              ทั้งหมด
            </TabsTrigger>
            <TabsTrigger
              value="buy"
              className="py-2.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all"
            >
              <ArrowDownCircle className="h-4 w-4 mr-2" />
              ซื้อ
            </TabsTrigger>
            <TabsTrigger
              value="sell"
              className="py-2.5 data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all"
            >
              <ArrowUpCircle className="h-4 w-4 mr-2" />
              ขาย
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-0">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Receipt className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">ยังไม่มีรายการทำธุรกรรม</p>
                <p className="text-sm mt-2">เริ่มซื้อขายทองคำเพื่อดูประวัติที่นี่</p>
              </div>
            ) : (
              filteredTransactions.map(renderTransaction)
            )}
          </TabsContent>
          <TabsContent value="buy" className="space-y-3 mt-0">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <ArrowDownCircle className="h-16 w-16 mx-auto mb-4 opacity-30 text-emerald-500" />
                <p className="text-lg font-medium">ยังไม่มีรายการซื้อ</p>
              </div>
            ) : (
              filteredTransactions.map(renderTransaction)
            )}
          </TabsContent>
          <TabsContent value="sell" className="space-y-3 mt-0">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <ArrowUpCircle className="h-16 w-16 mx-auto mb-4 opacity-30 text-red-500" />
                <p className="text-lg font-medium">ยังไม่มีรายการขาย</p>
              </div>
            ) : (
              filteredTransactions.map(renderTransaction)
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
