"use client"

import GoldChartsSix from "@/app/components/GoldChartsSix"

interface ChartPageProps {
  statuses: any[]
}

export default function ChartPage({ statuses }: ChartPageProps) {
  const getStatus = (goldType: string) => {
    const status = statuses.find((s) => s.goldType === goldType)
    return status?.status || "ONLINE"
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <GoldChartsSix getStatus={getStatus} />
    </div>
  )
}
