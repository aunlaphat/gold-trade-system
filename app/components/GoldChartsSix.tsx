"use client"

import { useState } from "react"
import GoldChart from "./GoldChart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"

interface GoldChartsSixProps {
  getStatus: (goldType: string) => "ONLINE" | "PAUSE" | "STOP"
}

export default function GoldChartsSix({ getStatus }: GoldChartsSixProps) {
  const [selectedChart, setSelectedChart] = useState("GOLD_9999_MTS")

  const charts = [
    { type: "GOLD_9999_MTS", title: "ทองคำ 99.99% (MTS)" },
    { type: "GOLD_965_MTS", title: "ทองคำ 96.5% (MTS)" },
    { type: "GOLD_965_ASSO", title: "ทองคำ 96.5% (สมาคม)" },
    { type: "GOLD_9999", title: "ทองคำ 99.99% (Global)" },
    { type: "GOLD_965", title: "ทองคำ 96.5% (Global)" },
    { type: "SPOT", title: "Gold Spot" },
  ]

  return (
    <div className="space-y-4 animate-fade-in">
      <Tabs value={selectedChart} onValueChange={setSelectedChart} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto gap-2 bg-card border border-border p-1">
          {charts.map((chart) => (
            <TabsTrigger
              key={chart.type}
              value={chart.type}
              className="text-xs sm:text-sm py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              {chart.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {charts.map((chart) => (
          <TabsContent key={chart.type} value={chart.type} className="mt-4">
            <div className="rounded-lg overflow-hidden border border-border shadow-lg">
              <GoldChart goldType={chart.type} title={chart.title} status={getStatus(chart.type)} />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
