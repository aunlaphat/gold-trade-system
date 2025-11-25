"use client"

import { useEffect, useRef } from "react"

interface MiniGoldChartProps {
  goldType: string
  fullSize?: boolean
}

export function MiniGoldChart({ goldType, fullSize = false }: MiniGoldChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const chartRef = useRef<any>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!canvasRef.current) return

      try {
        const ChartModule = await import("chart.js")
        const ChartCtor = (ChartModule as any).Chart || (ChartModule as any).default || (window as any).Chart

        const { LineController, LineElement, PointElement, LinearScale, TimeScale, CategoryScale, Tooltip, Filler } =
          ChartModule as any

        ChartCtor.register?.(
          LineController,
          LineElement,
          PointElement,
          LinearScale,
          TimeScale,
          CategoryScale,
          Tooltip,
          Filler,
        )

        // Simplified data fetching for mini chart
        const envBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")
        let apiBase = envBase
        if (!apiBase && typeof window !== "undefined") {
          const host = window.location.hostname
          if (host === "localhost" || host === "127.0.0.1") apiBase = "http://localhost:5000"
        }

        const seriesPath = goldType.toLowerCase().replace(/_/g, "_")
        const url = `${apiBase || ""}/api/prices/history/${seriesPath}?limit=50`

        const r = await fetch(url)
        if (!r.ok) return

        const arr = await r.json()
        if (!Array.isArray(arr) || arr.length === 0) return

        // Simple line data
        const lineData = arr
          .map((item: any) => {
            const timestamp = item.ts ?? item.timestamp ?? item.time
            const value = item.value ?? item.payload?.price ?? item.price
            return {
              x: new Date(timestamp),
              y: value,
            }
          })
          .filter((d: any) => d.y != null)

        if (!mounted || lineData.length === 0) return

        if (chartRef.current) {
          try {
            chartRef.current.destroy()
          } catch {}
        }

        const gradient = canvasRef.current!.getContext("2d")!.createLinearGradient(0, 0, 0, fullSize ? 400 : 64)
        gradient.addColorStop(0, "rgba(251, 191, 36, 0.4)")
        gradient.addColorStop(1, "rgba(251, 191, 36, 0)")

        chartRef.current = new ChartCtor(canvasRef.current!, {
          type: "line",
          data: {
            datasets: [
              {
                data: lineData,
                borderColor: "rgb(251, 191, 36)",
                backgroundColor: gradient,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
              },
            ],
          },
          options: {
            animation: false,
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
              legend: { display: false },
              tooltip: fullSize
                ? {
                    mode: "index",
                    intersect: false,
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    padding: 12,
                    titleColor: "rgb(251, 191, 36)",
                    bodyColor: "#fff",
                  }
                : { enabled: false },
            },
            scales: {
              x: {
                type: "time",
                display: fullSize,
                grid: { display: fullSize },
              },
              y: {
                display: fullSize,
                grid: { display: fullSize },
                ticks: { maxTicksLimit: 6 },
              },
            },
            interaction: {
              intersect: false,
              mode: "index",
            },
          },
        })
      } catch (err) {
        console.error(`[MiniGoldChart ${goldType}]`, err)
      }
    })()

    return () => {
      mounted = false
      try {
        chartRef.current?.destroy()
      } catch {}
    }
  }, [goldType, fullSize])

  return (
    <div className="w-full h-full">
      <canvas ref={canvasRef} />
    </div>
  )
}
