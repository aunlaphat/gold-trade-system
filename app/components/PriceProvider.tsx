"use client"
import React, { createContext, useContext, useEffect, useState } from "react"
const PriceContext = createContext<any>(null)
export function usePrices() { return useContext(PriceContext) }

export default function PriceProvider({ children }: { children: React.ReactNode }) {
  const [prices, setPrices] = useState<any>(null)

  useEffect(() => {
    const envBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")
    let base = envBase
    if (!base && typeof window !== "undefined") {
      const host = window.location.hostname
      if (host === "localhost" || host === "127.0.0.1") base = "http://localhost:5000"
    }

    const sseUrl = base ? `${base}/api/prices/stream` : "/api/prices/stream"
    const currentUrl = base ? `${base}/api/prices/current` : "/api/prices/current"

    console.debug("[price-provider] using base:", base || "(same origin)", "sseUrl:", sseUrl, "currentUrl:", currentUrl)

    let es: EventSource | null = null
    let pollInterval: any = null

    try {
      es = new EventSource(sseUrl)
    } catch (e) {
      console.warn("[price-provider] EventSource init failed, will fallback to polling", e)
      es = null
    }

    if (es) {
      es.onopen = () => console.debug("[price-provider] SSE open", sseUrl)
      es.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data)
          setPrices(data)
        } catch (err) {
          console.error("[price-provider] SSE parse error", err, evt.data)
        }
      }
      es.onerror = (ev) => {
        console.warn("[price-provider] SSE error, fallback to polling", ev)
        try { es?.close() } catch (_) {}
        es = null
        // start polling if SSE dies
        const fetchNow = async () => {
          try {
            const res = await fetch(currentUrl)
            if (res.ok) {
              const data = await res.json()
              setPrices(data)
            }
          } catch (e) { /* ignore */ }
        }
        fetchNow()
        pollInterval = setInterval(fetchNow, 5000)
      }
    } else {
      // fallback polling when SSE couldn't be opened
      const fetchNow = async () => {
        try {
          const res = await fetch(currentUrl)
          if (res.ok) {
            const data = await res.json()
            setPrices(data)
          }
        } catch (e) { /* ignore */ }
      }
      fetchNow()
      pollInterval = setInterval(fetchNow, 5000)
    }

    return () => {
      try { es?.close() } catch (_) {}
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [])

  return <PriceContext.Provider value={prices}>{children}</PriceContext.Provider>
}