"use client"
import React from "react"
import GoldChart from "./GoldChart"

export default function PriceCharts() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
      <GoldChart goldType="SPOT" title="Gold Spot (TradingView)" />
      <GoldChart goldType="GOLD_9999" title="Gold 99.99% (MTS)" />
      <GoldChart goldType="GOLD_965" title="Gold 96.5% (MTS)" />
      <GoldChart goldType="GOLD_965_ASSO" title="Gold 96.5% Asso (MTS)" />
      <GoldChart goldType="GLDSPOT" title="Gold Spot (Global)" />
      <GoldChart goldType="GLD9999" title="Gold 99.99% (Global)" />
      <GoldChart goldType="GLD965" title="Gold 96.5% (Global)" />
    </div>
  )
}
