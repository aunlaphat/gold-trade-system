"use client"
import React from "react"
import GoldChart from "./GoldChart"

interface GoldChartsSixProps {
  getStatus: (goldType: string) => "ONLINE" | "PAUSE" | "STOP" 
}

export default function GoldChartsSix({ getStatus }: GoldChartsSixProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
      <GoldChart goldType="GOLD_9999" title="Gold 99.99% (Global)" status={getStatus("GOLD_9999")} />
      <GoldChart goldType="GOLD_965" title="Gold 96.5% (Global)" status={getStatus("GOLD_965")} />
      <GoldChart goldType="GOLD_9999_MTS" title="Gold 99.99% (MTS)" status={getStatus("GOLD_9999_MTS")} />
      <GoldChart goldType="GOLD_965_MTS" title="Gold 96.5% (MTS)" status={getStatus("GOLD_965_MTS")} />
      <GoldChart goldType="GOLD_965_ASSO" title="Gold 96.5% (Association)" status={getStatus("GOLD_965_ASSO")} />
      <GoldChart goldType="SPOT" title="Gold Spot" status={getStatus("SPOT")} />
    </div>
  )
}
