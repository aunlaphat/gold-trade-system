"use client"

import { useState } from "react"
import { MiniGoldChart } from "./trading/MiniGoldChart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"

type ResolutionKey = "1m" | "5m" | "30m" | "1h" | "1d" | "1w"

interface GoldChartsSixProps {
  getStatus: (goldType: string) => "ONLINE" | "PAUSE" | "STOP"
}

export default function GoldChartsSix({ getStatus }: GoldChartsSixProps) {
  const [selectedChart, setSelectedChart] = useState("GOLD_9999_MTS")
  const [resolution, setResolution] = useState<ResolutionKey>("1h")

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
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto gap-2 bg-card border border-border p-1">
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
          <TabsContent key={chart.type} value={chart.type} className="mt-4 space-y-4">
            <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
              <span className="text-sm font-medium text-muted-foreground">ช่วงเวลา:</span>
              <div className="flex gap-1 p-1 bg-muted rounded-lg">
                {(["1m", "5m", "30m", "1h", "1d", "1w"] as ResolutionKey[]).map((res) => (
                  <button
                    key={res}
                    onClick={() => setResolution(res)}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                      resolution === res
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:bg-background text-muted-foreground"
                    }`}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>

            <div
              className="rounded-lg overflow-hidden border border-border shadow-lg"
              style={{ height: 400 }}
            >
              <MiniGoldChart
                goldType={chart.type}
                fullSize={true}
                resolution={resolution}
                // 👇 ให้ chart ทำงานเฉพาะ tab ที่เลือกอยู่
                enabled={selectedChart === chart.type}
              />
            </div>

            <div className="flex items-center justify-center gap-2 p-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  getStatus(chart.type) === "ONLINE"
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : getStatus(chart.type) === "PAUSE"
                    ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                    : "bg-red-500/20 text-red-600 dark:text-red-400"
                }`}
              >
                {getStatus(chart.type)}
              </span>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
