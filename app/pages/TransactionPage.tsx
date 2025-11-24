"use client"

import { TransactionList } from "../components/transactions/TransactionList"

interface TransactionPageProps {
  transactions: any[]
}

export default function TransactionPage({ transactions }: TransactionPageProps) {
  return <TransactionList transactions={transactions} />
}
