"use client"

import { useEffect, useRef } from "react"
import { API_CONFIG } from "../../lib/config"

type ResolutionKey = "1m" | "5m" | "30m" | "1h" | "1d" | "1w"

interface MiniGoldChartProps {
  goldType: string
  fullSize?: boolean
  resolution?: ResolutionKey
  /** เปิด/ปิดการวาดกราฟ (เอาไว้ใช้กับหน้าที่มีหลายกราฟ) */
  enabled?: boolean
}

export function MiniGoldChart({
  goldType,
  fullSize = false,
  resolution,
  enabled = true,
}: MiniGoldChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const chartRef = useRef<any>(null)

  useEffect(() => {
    // ถ้าไม่ให้ทำงานเลย ให้ล้าง chart แล้วจบ
    if (!enabled) {
      if (chartRef.current) {
        try {
          chartRef.current.destroy()
        } catch {}
        chartRef.current = null
      }
      return
    }

    let mounted = true

    ;(async () => {
      const canvas = canvasRef.current
      if (!canvas) return

      try {
        const ChartModule = await import("chart.js")
        await import("chartjs-adapter-date-fns")

        const ChartCtor = (ChartModule as any).Chart || (ChartModule as any).default || (window as any).Chart

        const {
          LineController,
          LineElement,
          PointElement,
          LinearScale,
          TimeScale,
          CategoryScale,
          Tooltip,
          Filler,
        } = ChartModule as any

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

        const apiBase = API_CONFIG.getBaseURL()
        const seriesPath = goldType.toLowerCase().replace(/_/g, "_")
        const url = `${apiBase || ""}/api/prices/history/${seriesPath}?limit=500`

        const r = await fetch(url)
        if (!r.ok) return
        const arr = await r.json()
        if (!Array.isArray(arr) || arr.length === 0) return

    const raw = arr
      .map((item: any) => {
        const timestamp = item.ts ?? item.timestamp ?? item.time ?? item.date
        const rawValue = item.value ?? item.payload?.price ?? item.price
        const t = new Date(timestamp)

        const v = Number(rawValue)

        // 🔎 1) ไม่เอาค่าที่ไม่ใช่ตัวเลข
        if (!Number.isFinite(v)) return null

        // 🔎 2) ตัดค่าที่เป็น 0 หรือต่ำผิดปกติทิ้งไปเลย (กันกราฟดิ่งเป็นเสา)
        if (v <= 0 || v < 1000) return null

        return { x: t, y: v }
      })
      // filter(Boolean) จะตัด null ออก
      .filter((p): p is { x: Date; y: number } => !!p)

        if (!mounted || raw.length === 0) return

        if (chartRef.current) {
          try {
            chartRef.current.destroy()
          } catch {}
        }

        type TimeUnit = "minute" | "hour" | "day"
        const ms = {
          minute: 60_000,
          hour: 3_600_000,
          day: 86_400_000,
        }

        // map resolution → unit + step
        function unitStepFromResolution(res?: ResolutionKey): { unit: TimeUnit; step: number } {
          switch (res) {
            case "1m":
              return { unit: "minute", step: 1 }
            case "5m":
              return { unit: "minute", step: 5 }
            case "30m":
              return { unit: "minute", step: 30 }
            case "1h":
              return { unit: "hour", step: 1 }
            case "1d":
              return { unit: "day", step: 1 }
            case "1w":
              return { unit: "day", step: 7 }
            default: {
              const firstTs0 = raw[0].x.getTime()
              const lastTs0 = raw[raw.length - 1].x.getTime()
              const spanMs0 = Math.max(1, lastTs0 - firstTs0)
              const desiredLabels = fullSize ? 7 : 5

              if (spanMs0 <= 3 * ms.hour) {
                const approx = Math.max(1, Math.round(spanMs0 / ms.minute / desiredLabels))
                const choices = [1, 2, 5, 10, 15, 30]
                const step = choices.find((c) => c >= approx) ?? 30
                return { unit: "minute", step }
              } else if (spanMs0 <= 3 * ms.day) {
                const approx = Math.max(1, Math.round(spanMs0 / ms.hour / desiredLabels))
                const choices = [1, 2, 3, 6, 12, 24]
                const step = choices.find((c) => c >= approx) ?? 24
                return { unit: "hour", step }
              } else {
                const approx = Math.max(1, Math.round(spanMs0 / ms.day / desiredLabels))
                const choices = [1, 2, 3, 7, 14, 30]
                const step = choices.find((c) => c >= approx) ?? 30
                return { unit: "day", step }
              }
            }
          }
        }

        const { unit, step } = unitStepFromResolution(resolution)

        // ── จำกัดหน้าต่างเวลา ตาม resolution ──
        const firstRawTs = raw[0].x.getTime()
        const lastTs = raw[raw.length - 1].x.getTime()
        const spanMsRaw = Math.max(1, lastTs - firstRawTs)

        const windowMsByResolution: Record<ResolutionKey, number> = {
          "1m": 2 * ms.hour,
          "5m": 6 * ms.hour,
          "30m": 2 * ms.day,
          "1h": 7 * ms.day,
          "1d": 90 * ms.day,
          "1w": 365 * ms.day,
        }

        const windowMs =
          (resolution && windowMsByResolution[resolution]) ?? spanMsRaw

        const minTs = lastTs - windowMs
        const firstTs = Math.max(firstRawTs, minTs)

        // ⭐ ตัดข้อมูลให้เหลือเฉพาะช่วง [firstTs, ...]
        const filtered = raw.filter(p => p.x.getTime() >= firstTs)
        if (filtered.length === 0) return

        const spanMs = Math.max(1, lastTs - firstTs)
        const stepMs =
          unit === "minute" ? step * ms.minute :
          unit === "hour"   ? step * ms.hour   :
                              step * ms.day

        const padRight =
          resolution === "1m" || resolution === "5m"
            ? spanMs * 0.05
            : resolution === "30m"
              ? spanMs * 0.1
              : spanMs * 0.2

        const startAligned = Math.floor(firstTs / stepMs) * stepMs
        const endAligned = Math.ceil((lastTs + padRight) / stepMs) * stepMs

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const gradient = ctx.createLinearGradient(0, 0, 0, fullSize ? 400 : 64)
        gradient.addColorStop(0, "rgba(251, 191, 36, 0.4)")
        gradient.addColorStop(1, "rgba(251, 191, 36, 0)")

        chartRef.current = new ChartCtor(canvas, {
          type: "line",
          data: {
            datasets: [
              {
                data: filtered,            // ✅ ใช้ข้อมูลที่ถูกตัดแล้ว
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
            interaction: {
              intersect: false,
              mode: "index",
            },
            scales: {
              x: {
                type: "time",
                // ✅ ใช้ min/max แทน suggestedMin/Max
                min: startAligned,
                max: endAligned,
                time: {
                  unit,
                  stepSize: step,
                  displayFormats: {
                    minute: "HH:mm",
                    hour: "HH:mm",
                    day: "MMM d",
                  },
                },
                grid: { display: fullSize },
                ticks: {
                  autoSkip: true,
                  maxTicksLimit: fullSize ? 8 : 4,
                },
              },
              y: {
                display: fullSize,
                grid: { display: fullSize },
                ticks: { maxTicksLimit: 6 },
              },
            },
          },
        })
      } catch (err) {
        console.error(`[MiniGoldChart ${goldType}]`, err)
      }
    })()

    return () => {
      mounted = false
      if (chartRef.current) {
        try {
          chartRef.current.destroy()
        } catch {}
        chartRef.current = null
      }
    }
  }, [goldType, fullSize, resolution, enabled])

  return (
    <div className="w-full h-full">
      <canvas ref={canvasRef} />
    </div>
  )
}
