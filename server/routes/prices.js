import express from "express"
import { goldPriceService } from "../services/goldPriceService.js"
import { connectDatabase, getDatabase } from "../config/database.js"

const router = express.Router()

// stream updates via SSE
router.get("/stream", (req, res) => {
  // CORS for browser EventSource (if frontend origin differs)
  res.setHeader("Access-Control-Allow-Origin", req.get("Origin") || "*")
  res.setHeader("Vary", "Origin")
  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")
  if (res.flushHeaders) res.flushHeaders()
  // send a ping every 15s to keep connection alive (optional)
  const keepAlive = setInterval(() => {
    try { res.write(":keepalive\n\n") } catch (e) {}
  }, 15000)

  const send = (data) => {
    try {
      res.write(`data: ${JSON.stringify(data)}\n\n`)
    } catch (e) {
      // ignore write errors
    }
  }

  const unsubscribe = goldPriceService.subscribe(send)

  req.on("close", () => {
    unsubscribe()
    clearInterval(keepAlive)
    try { res.end() } catch (e) {}
  })
})

// GET /api/prices/history?limit=500&from=unix&to=unix
router.get("/history", async (req, res) => {
  try {
    await connectDatabase()
    const db = getDatabase()
    const coll = db.collection("gold_price_history")

    const limit = Math.min(parseInt(req.query.limit || "500", 10) || 500, 5000)
    const q = {}
    if (req.query.from) {
      const fromTs = new Date(Number(req.query.from) * 1000)
      q.ts = q.ts || {}
      q.ts.$gte = fromTs
    }
    if (req.query.to) {
      const toTs = new Date(Number(req.query.to) * 1000)
      q.ts = q.ts || {}
      q.ts.$lte = toTs
    }

    const docs = await coll.find(q).sort({ ts: -1 }).limit(limit).toArray()
    const items = docs.reverse().map((d) => {
      const date = d.ts || (d._id && typeof d._id.getTimestamp === "function" ? d._id.getTimestamp() : d.ts)
      return {
        ts: date ? (date instanceof Date ? date.toISOString() : new Date(date).toISOString()) : new Date().toISOString(),
        payload: d.payload || d
      }
    })
    return res.json(items)
  } catch (e) {
    console.error("/api/prices/history error:", e)
    return res.status(500).json({ error: "Price History Error", details: e.message })
  }
})

// GET /api/prices/history/:goldType  (per-series)
router.get("/history/:goldType", async (req, res) => {
  try {
    await connectDatabase()
    const db = getDatabase()
    const coll = db.collection("gold_price_history")

    const goldType = (req.params.goldType || "").toLowerCase()
    const limit = Math.min(parseInt(req.query.limit || "1000", 10) || 1000, 5000)

    const docs = await coll.find({}).sort({ ts: -1 }).limit(limit).toArray()
    docs.reverse()

    const mapValue = (payload) => {
      if (!payload) return null
      switch (goldType) {
        case "spot":
        case "xau":
          return payload.spot?.price ?? payload.spot?.buyIn ?? payload.spot?.sellOut ?? null
        case "gold_9999":
        case "gold9999":
        case "gld9999":
          return payload.gold9999?.price ?? payload.gold9999?.buyIn ?? payload.gold9999?.sellOut ?? null
        case "gold_9999_mts":
        case "gold9999_mts":
          return payload.gold9999_mts?.price ?? payload.gold9999_mts?.buyIn ?? payload.gold9999_mts?.sellOut ?? null
        case "gold_965_mts":
        case "gold965_mts":
          return payload.gold965_mts?.price ?? payload.gold965_mts?.buyIn ?? payload.gold965_mts?.sellOut ?? null
        case "gold_965_asso":
        case "gold965_asso":
        case "asso":
          return payload.gold965_asso?.price ?? payload.gold965_asso?.buyIn ?? payload.gold965_asso?.sellOut ?? null
        case "gold_965":
        case "gold965":
          return payload.gold965?.price ?? payload.gold965?.buyIn ?? payload.gold965?.sellOut ?? null
        default:
          return payload[goldType]?.price ?? payload[goldType]?.buyIn ?? payload[goldType]?.sellOut ?? payload[goldType] ?? null
      }
    }

    const items = docs.map(d => {
      const date = d.ts || (d._id && typeof d._id.getTimestamp === "function" ? d._id.getTimestamp() : d.ts)
      const tsIso = date ? (date instanceof Date ? date.toISOString() : new Date(date).toISOString()) : new Date().toISOString()
      return {
        ts: tsIso,
        value: mapValue(d.payload)
      }
    }).filter(it => it.value != null)

    return res.json(items)
  } catch (e) {
    console.error("/api/prices/history/:goldType error:", e)
    return res.status(500).json({ error: "Price History Error", details: e.message })
  }
})

// GET /api/prices/current  -> return last known prices quickly
router.get("/current", (req, res) => {
  try {
    const last = goldPriceService.lastPrices || null
    if (!last) return res.status(204).end()
    return res.json(last)
  } catch (e) {
    console.error("/api/prices/current error:", e)
    return res.status(500).json({ error: "Current Prices Error", details: e.message })
  }
})

export default router
