"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useEffect, useState } from "react"
import { apiClient } from "@/app/lib/api-client"
import { format } from "date-fns"

interface ChartData {
  t: number[]
  o: number[]
  h: number[]
  l: number[]
  c: number[]
}

interface GoldChartProps {
  goldType: string
  title: string
}

export function GoldChart({ goldType, title }: GoldChartProps) {
  const [chartData, setChartData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const from = Math.floor(Date.now() / 1000) - 86400 // 24 hours ago
        const to = Math.floor(Date.now() / 1000)

        const data: ChartData = await apiClient.getPriceHistory(goldType, from, to)

        if (data.t && data.c) {
          const formatted = data.t.map((timestamp, index) => ({
            time: timestamp * 1000,
            price: data.c[index],
            high: data.h[index],
            low: data.l[index],
          }))

          setChartData(formatted)
        }
      } catch (error) {
        console.error("Error fetching chart data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [goldType])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-muted-foreground">Loading chart...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="time" tickFormatter={(time) => format(new Date(time), "HH:mm")} className="text-xs" />
            <YAxis domain={["auto", "auto"]} tickFormatter={(value) => value.toLocaleString()} className="text-xs" />
            <Tooltip
              labelFormatter={(time) => format(new Date(time), "MMM dd, HH:mm")}
              formatter={(value: any) => [value.toLocaleString(), "Price"]}
            />
            <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
