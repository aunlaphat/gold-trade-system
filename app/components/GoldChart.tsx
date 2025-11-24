// components/trading/GoldChart.tsx
"use client"

import React, { useEffect, useRef, useState } from "react"
import "chartjs-adapter-date-fns"

type ResolutionKey = "1m" | "5m" | "30m" | "1h" | "1d" | "1w"
const RES_SECONDS: Record<ResolutionKey, number> = {
  "1m": 60,
  "5m": 300,
  "30m": 1800,
  "1h": 3600,
  "1d": 86400,
  "1w": 604800,
}

const parseTs = (ts: any) => {
  if (!ts) return new Date()
  if (typeof ts === "number") return ts < 1e12 ? new Date(ts * 1000) : new Date(ts)
  const n = Number(ts)
  if (!Number.isNaN(n)) return n < 1e12 ? new Date(n * 1000) : new Date(n)
  const d = new Date(ts)
  return isNaN(d.getTime()) ? new Date() : d
}

const aggregateOHLC = (ticks: { t: Date; v: number }[], bucketSeconds: number) => {
  if (!ticks || ticks.length === 0) return []
  const out: any[] = []
  const sorted = ticks.slice().sort((a, b) => a.t.getTime() - b.t.getTime())
  let bucketStart = Math.floor(sorted[0].t.getTime() / 1000 / bucketSeconds) * bucketSeconds
  let o: any = null
  for (const tk of sorted) {
    const sec = Math.floor(tk.t.getTime() / 1000)
    const b = Math.floor(sec / bucketSeconds) * bucketSeconds
    if (b !== bucketStart) {
      if (o) out.push(o)
      bucketStart = b
      o = { x: new Date(bucketStart * 1000), o: tk.v, h: tk.v, l: tk.v, c: tk.v }
    } else {
      if (!o) o = { x: new Date(bucketStart * 1000), o: tk.v, h: tk.v, l: tk.v, c: tk.v }
      o.h = Math.max(o.h, tk.v)
      o.l = Math.min(o.l, tk.v)
      o.c = tk.v
    }
  }
  if (o) out.push(o)
  return out
}

/**
 * ดึงค่าที่จะใช้ plot ตาม goldType
 * โยงตรงกับ payload ที่ GoldPriceService.updatePrices() เขียนลง Mongo:
 *   payload.gold9999, payload.gold965, payload.gold965_asso, payload.spot
 */
function extractValueFromPayload(goldType: string, item: any): number | null {
  const payload = item?.payload
  if (!payload) {
    return typeof item.value === "number" ? item.value : null
  }

  // ถ้า backend ใส่ value มาให้ตรง ๆ ก็ใช้ก่อนเลย
  if (typeof item.value === "number" && Number.isFinite(item.value)) {
    return item.value
  }

  switch (goldType) {
    case "GOLD_9999": {
      const g = payload.gold9999 || payload["gold_9999"]
      if (!g) return null
      const v = g.price ?? g.buyIn ?? g.sellOut ?? null
      return typeof v === "number" ? v : null
    }
    case "GOLD_965": {
      const g = payload.gold965 || payload["gold_965"]
      if (!g) return null
      const v = g.price ?? g.buyIn ?? g.sellOut ?? null
      return typeof v === "number" ? v : null
    }
    case "GOLD_9999_MTS": {
      const g = payload.gold9999_mts || payload["gold_9999_mts"]
      if (!g) return null
      const v = g.price ?? g.buyIn ?? g.sellOut ?? null
      return typeof v === "number" ? v : null
    }
    case "GOLD_965_MTS": {
      const g = payload.gold965_mts || payload["gold_965_mts"]
      if (!g) return null
      const v = g.price ?? g.buyIn ?? g.sellOut ?? null
      return typeof v === "number" ? v : null
    }
    case "GOLD_965_ASSO": {
      // 🔥 key ตาม backend: gold965_asso
      const g = payload.gold965_asso || payload["gold_965_asso"]
      if (!g) return null
      const v = g.price ?? g.buyIn ?? g.sellOut ?? null
      return typeof v === "number" ? v : null
    }
    case "SPOT": {
      const s = payload.spot
      if (!s) return null
      const v = s.price ?? s.buyIn ?? s.sellOut ?? null
      return typeof v === "number" ? v : null
    }
    default:
      return null
  }
}

interface GoldChartProps {
  goldType: string;
  title?: string;
  status?: "ONLINE" | "PAUSE" | "STOP"; // Add status prop
}

export function GoldChart({ goldType, title, status = "ONLINE" }: GoldChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const chartRef = useRef<any>(null)
  const [res, setRes] = useState<ResolutionKey>("1h")
  const [mode, setMode] = useState<"candles" | "line">("candles")
  const [loading, setLoading] = useState(false)

  const envBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")
  let apiBase = envBase
  if (!apiBase && typeof window !== "undefined") {
    const host = window.location.hostname
    if (host === "localhost" || host === "127.0.0.1") apiBase = "http://localhost:5000"
  }

  // ใช้แค่สำหรับประกอบ URL เท่านั้น
  const seriesPath = (() => {
    const map: Record<string, string> = {
      SPOT: "spot",
      GOLD_9999: "gold_9999",
      GOLD_965: "gold_965",
      GOLD_9999_MTS: "gold_9999_mts",
      GOLD_965_MTS: "gold_965_mts",
      GOLD_965_ASSO: "gold_965_asso",
    }
    return map[goldType] || goldType.toLowerCase()
  })()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!canvasRef.current) return
      setLoading(true)

      try {
        const ChartModule = await import("chart.js")
        const ChartCtor =
          (ChartModule as any).Chart ||
          (ChartModule as any).default ||
          (window as any).Chart

        const {
          LineController,
          LineElement,
          PointElement,
          LinearScale,
          TimeScale,
          CategoryScale,
          Title,
          Tooltip,
          Legend,
          BarController,
          BarElement,
        } = ChartModule as any

        ChartCtor.register?.(
          LineController,
          LineElement,
          PointElement,
          BarController,
          BarElement,
          LinearScale,
          TimeScale,
          CategoryScale,
          Title,
          Tooltip,
          Legend
        )

        let hasFinancial = false
        try {
          const fin = await import("chartjs-chart-financial")
          const {
            CandlestickController,
            CandlestickElement,
            OHLCController,
            OHLCElement,
          } = fin as any
          ChartCtor.register?.(
            CandlestickController,
            CandlestickElement,
            OHLCController,
            OHLCElement
          )
          hasFinancial = true
        } catch {
          hasFinancial = false
        }

        const url = `${apiBase || ""}/api/prices/history/${seriesPath}?limit=5000`
        console.debug(`[GoldChart ${goldType}] fetch url:`, url)

        const r = await fetch(url)
        if (!r.ok) {
          console.error(`[GoldChart ${goldType}] history fetch failed`, r.status, await r.text())
          setLoading(false)
          return
        }

        const arr = await r.json()
        if (!Array.isArray(arr)) {
          console.error(`[GoldChart ${goldType}] history is not array`, arr)
          setLoading(false)
          return
        }

        type RawTick = { t: Date; v: number | null }
        const raw: RawTick[] = arr.map((it: any) => {
          const d = parseTs(it.ts ?? it.timestamp ?? it.time ?? it.date)
          const v = extractValueFromPayload(goldType, it)
          return { t: d, v }
        })

        const ticks = raw
          .filter((x): x is { t: Date; v: number } => x.v != null)
          .map((x) => ({ t: x.t, v: x.v as number }))

        console.debug(
          `[GoldChart ${goldType}] ticks length:`,
          ticks.length,
          "raw length:",
          raw.length
        )

        if (ticks.length === 0) {
          // ไม่มีค่าที่ตีความได้ → ไม่ต้องวาดอะไร
          setLoading(false)
          return
        }

        const bucketSec = RES_SECONDS[res]
        const ohlc = aggregateOHLC(ticks, bucketSec)

        let datasets: any[] = []
        if (mode === "candles" && hasFinancial) {
          datasets = [
            {
              label: seriesPath,
              data: ohlc,
              color: { up: "green", down: "red" },
            },
          ]
        } else {
          datasets = [
            {
              label: seriesPath,
              data: ticks.map((t) => ({ x: t.t, y: t.v })),
              borderColor: "gold",
              pointRadius: 0,
              tension: 0.15,
            },
          ]
        }

        if (!mounted) return
        if (chartRef.current) {
          try {
            chartRef.current.destroy()
          } catch {}
        }

        chartRef.current = new ChartCtor(canvasRef.current!, {
          type: mode === "candles" && hasFinancial ? "candlestick" : "line",
          data: { datasets },
          options: {
            animation: false,
            maintainAspectRatio: false,
            responsive: true,
            parsing: false,
            plugins: {
              legend: { display: false },
              tooltip: { mode: "index", intersect: false },
            },
            scales: {
              x: {
                type: "time",
                time: {
                  unit:
                    bucketSec >= 86400
                      ? "day"
                      : bucketSec >= 3600
                      ? "hour"
                      : "minute",
                },
              },
              y: {
                beginAtZero: false,
                ticks: { maxTicksLimit: 6 },
              },
            },
          },
        })
      } catch (err) {
        console.error(`[GoldChart ${goldType}] unexpected error`, err)
      } finally {
        setLoading(false)
      }
    })()

    return () => {
      mounted = false
      try {
        chartRef.current?.destroy()
      } catch {}
    }
  }, [res, mode, goldType, seriesPath, apiBase])

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: 8,
        background: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 6,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ fontWeight: 600 }}>{title || goldType}</div>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 4,
            flexWrap: "wrap",
          }}
        >
          {/* Timeframe Selector */}
          <select
            value={res}
            onChange={(e) => setRes(e.target.value as ResolutionKey)}
            style={{
              padding: "4px 8px",
              border: "1px solid #d1d5db",
              borderRadius: 4,
              fontSize: 12,
            }}
          >
            <option value="1m">1m</option>
            <option value="5m">5m</option>
            <option value="30m">30m</option>
            <option value="1h">1h</option>
            <option value="1d">1d</option>
            <option value="1w">1w</option>
          </select>
          <button
            onClick={() => setMode("line")}
            style={{
              padding: "4px 8px",
              border: "1px solid #d1d5db",
              borderRadius: 4,
              fontSize: 12,
              background: mode === "line" ? "#3b82f6" : "#fff",
              color: mode === "line" ? "#fff" : "#000",
            }}
          >
            Line
          </button>
          <button
            onClick={() => setMode("candles")}
            style={{
              padding: "4px 8px",
              border: "1px solid #d1d5db",
              borderRadius: 4,
              fontSize: 12,
              background: mode === "candles" ? "#3b82f6" : "#fff",
              color: mode === "candles" ? "#fff" : "#000",
            }}
          >
            Candles
          </button>
        </div>
      </div>
      <div style={{ width: "100%", height: 400 }}>
        <canvas ref={canvasRef} />
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: 12,
          color: "#6b7280",
        }}
      >
        {loading ? (
          "loading..."
        ) : status === "PAUSE" ? (
          "Market Paused"
        ) : status === "STOP" ? (
          "Market Stopped"
        ) : (
          `${res} • ${mode}`
        )}
      </div>
    </div>
  )
}

// จะได้ import ได้สองแบบ
export default GoldChart
