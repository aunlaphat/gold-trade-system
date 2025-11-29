import { GoldStatus } from "../models/GoldStatus.js"
import { connectDatabase, getDatabase } from "../config/database.js"

const MTS_PRICE_API = "https://www.mtsgold.co.th/mtsprice/priceData.php"
const TRADING_VIEW_API = "https://tradingview.mtsgold.co.th/mgb/history"

export class GoldPriceService {
  constructor() {
    this.priceUpdateInterval = null
    this.subscribers = new Set()
    this.lastPrices = null
    this.isUpdating = false
  }

  // Fetch real-time prices from MTS API
  async fetchMTSPrices() {
    try {
      const timestamp = Date.now()
      const response = await fetch(`${MTS_PRICE_API}?c=${timestamp}`)
      const data = await response.json()

      return {
        gold965: {
          buyIn: Number.parseFloat(data.buyIn965),
          sellOut: Number.parseFloat(data.sellOut965),
          buyInAsso: Number.parseFloat(data.buyInAsso),
          sellOutAsso: Number.parseFloat(data.sellOutAsso),
        },
        gold9999: {
          buyIn: Number.parseFloat(data.buyIn9999),
          sellOut: Number.parseFloat(data.sellOut9999),
        },
      }
    } catch (error) {
      console.error("Error fetching MTS prices:", error)
      return null
    }
  }

  // Fetch historical data for charts
  async fetchChartData(symbol, resolution = 60, from, to) {
    try {
      const url = new URL(`${TRADING_VIEW_API}`)
      url.searchParams.append("symbol", symbol)
      url.searchParams.append("resolution", resolution)
      url.searchParams.append("currencyCode", symbol === "XAUUSD" ? "USD" : "THB")

      const now = Math.floor(Date.now() / 1000)
      const fromTime = from || now - 86400 * 7 // last 7 days
      const toTime = to || now

      url.searchParams.append("from", String(fromTime))
      url.searchParams.append("to", String(toTime))
      url.searchParams.append("countback", "500")

      const fullUrl = url.toString()
      console.log(`Fetching TradingView data for ${symbol}: ${fullUrl}`)

      const response = await fetch(fullUrl)
      const data = await response.json()

      if (data && data.s === "ok" && Array.isArray(data.o) && Array.isArray(data.c) && data.o.length > 0) {
        console.log(
          `Successfully fetched ${symbol}: ${data.o.length} data points, last O=${data.o[data.o.length - 1]}, last C=${data.c[data.c.length - 1]}`,
        )
        return data
      } else {
        console.error(`Invalid TradingView response for ${symbol}:`, {
          status: data?.s,
          hasO: Array.isArray(data?.o),
          hasC: Array.isArray(data?.c),
          oLength: data?.o?.length,
          cLength: data?.c?.length,
          dataKeys: data ? Object.keys(data) : null,
          nextTime: data?.nextTime,
        })
        return null
      }
    } catch (error) {
      console.error(`Error fetching chart data for ${symbol}:`, error)
      return null
    }
  }

  // Check if gold type is active
  async isGoldTypeActive(goldType) {
    const status = await GoldStatus.getStatus(goldType)
    return status && status.status === "ONLINE"
  }

  // Fetch spot price from TradingView (XAUUSD) with buyIn and sellOut
  async fetchSpotFromTradingView(resolution = 60, lookbackSec = 3600) {
    try {
      const url = new URL(TRADING_VIEW_API)
      const nowSec = Math.floor(Date.now() / 1000)
      url.searchParams.append("symbol", "XAUUSD")
      url.searchParams.append("resolution", String(resolution))
      url.searchParams.append("from", String(nowSec - lookbackSec))
      url.searchParams.append("to", String(nowSec))
      url.searchParams.append("countback", "2")
      url.searchParams.append("currencyCode", "USD")

      const response = await fetch(url.toString())
      const data = await response.json()
      if (!data) return null

      const lastClose = data.c && Array.isArray(data.c) ? Number(data.c[data.c.length - 1]) : null
      const lastOpen = data.o && Array.isArray(data.o) ? Number(data.o[data.o.length - 1]) : null

      return {
        buyIn: Number.isFinite(lastOpen) ? lastOpen : null,
        sellOut: Number.isFinite(lastClose) ? lastClose : null,
        price: Number.isFinite(lastClose) ? lastClose : null,
        source: "TRADINGVIEW",
      }
    } catch (err) {
      console.error("fetchSpotFromTradingView error:", err)
      return null
    }
  }

  // Update prices in database
  async updatePrices() {
    if (this.isUpdating) return
    this.isUpdating = true

    try {
      const mtsData = await this.fetchMTSPrices()

      const allStatuses = await GoldStatus.getAllStatuses()
      const statusMap = new Map(allStatuses.map((s) => [s.goldType, s.status]))

      const tvSpot = await this.fetchSpotFromTradingView().catch(() => null)

      const parseLatestClose = (data) => {
        if (!data || !Array.isArray(data.c) || data.c.length === 0) return null
        const val = Number(data.c[data.c.length - 1])
        return Number.isFinite(val) ? val : null
      }

      const parseLatestOHLC = (data) => {
        if (!data) {
          console.log("parseLatestOHLC: data is null/undefined")
          return { buyIn: null, sellOut: null }
        }
        if (!Array.isArray(data.o) || !Array.isArray(data.c)) {
          console.log("parseLatestOHLC: data.o or data.c is not an array", {
            hasO: !!data.o,
            hasC: !!data.c,
            oIsArray: Array.isArray(data.o),
            cIsArray: Array.isArray(data.c),
            dataKeys: Object.keys(data),
          })
          return { buyIn: null, sellOut: null }
        }
        if (data.o.length === 0) {
          console.log("parseLatestOHLC: data.o array is empty")
          return { buyIn: null, sellOut: null }
        }
        const lastIndex = data.o.length - 1
        const buyIn = Number.isFinite(Number(data.o[lastIndex])) ? Number(data.o[lastIndex]) : null
        const sellOut = Number.isFinite(Number(data.c[lastIndex])) ? Number(data.c[lastIndex]) : null
        console.log(`parseLatestOHLC: parsed buyIn=${buyIn}, sellOut=${sellOut} from index ${lastIndex}`)
        return { buyIn, sellOut }
      }

      const now = Math.floor(Date.now() / 1000)
      const fromUnix = now - 86400 * 7
      const toUnix = now
      const [asso96Data, thai965Data, thai9999Data] = await Promise.all([
        this.fetchChartData("GLDGTA", 60, fromUnix, toUnix).catch(() => null),
        this.fetchChartData("GLD965", 60, fromUnix, toUnix).catch(() => null),
        this.fetchChartData("GLD9999", 60, fromUnix, toUnix).catch(() => null),
      ])

      console.log("TradingView data fetched:", {
        GLD965: thai965Data
          ? {
              hasO: !!thai965Data.o,
              hasC: !!thai965Data.c,
              oLength: thai965Data.o?.length,
              lastO: thai965Data.o?.[thai965Data.o.length - 1],
              lastC: thai965Data.c?.[thai965Data.c.length - 1],
            }
          : "null",
        GLD9999: thai9999Data
          ? {
              hasO: !!thai9999Data.o,
              hasC: !!thai9999Data.c,
              oLength: thai9999Data.o?.length,
              lastO: thai9999Data.o?.[thai9999Data.o.length - 1],
              lastC: thai9999Data.c?.[thai9999Data.c.length - 1],
            }
          : "null",
      })

      const xauusdData = await this.fetchChartData("XAUUSD", 60, fromUnix, toUnix).catch(() => null)
      console.log(
        "XAUUSD data:",
        xauusdData
          ? {
              hasO: !!xauusdData.o,
              hasC: !!xauusdData.c,
              oLength: xauusdData.o?.length,
              cLength: xauusdData.c?.length,
              lastO: xauusdData.o?.[xauusdData.o.length - 1],
              lastC: xauusdData.c?.[xauusdData.c.length - 1],
            }
          : "null",
      )
      const spotOHLC = parseLatestOHLC(xauusdData)

      const fallback = Number(
        mtsData?.spot?.price ??
          mtsData?.spotPrice ??
          mtsData?.gold9999?.buyIn ??
          mtsData?.gold965?.buyIn ??
          null,
      )
      
      const spotPrice =
        spotOHLC.sellOut ??
        (typeof tvSpot === "object" && tvSpot?.price && Number.isFinite(tvSpot.price) ? tvSpot.price : null) ??
        (Number.isFinite(fallback) ? fallback : null)

      const newLatestPrices = {
        timestamp: Date.now(),
        gold965_asso: {
          buyIn: Number(mtsData?.gold965?.buyInAsso ?? parseLatestClose(asso96Data)),
          sellOut: Number(mtsData?.gold965?.sellOutAsso ?? parseLatestClose(asso96Data)),
          price: Number(mtsData?.gold965?.buyInAsso ?? parseLatestClose(asso96Data)),
          source: "ASSOCIATION",
        },
        gold9999: {
          buyIn: parseLatestOHLC(thai9999Data).buyIn,
          sellOut: parseLatestOHLC(thai9999Data).sellOut,
          price: parseLatestOHLC(thai9999Data).sellOut ?? parseLatestOHLC(thai9999Data).buyIn,
          source: "TRADINGVIEW",
        },
        gold965: {
          buyIn: parseLatestOHLC(thai965Data).buyIn,
          sellOut: parseLatestOHLC(thai965Data).sellOut,
          price: parseLatestOHLC(thai965Data).sellOut ?? parseLatestOHLC(thai965Data).buyIn,
          source: "TRADINGVIEW",
        },
        gold965_thai: {
          buyIn: parseLatestClose(thai965Data),
          sellOut: parseLatestClose(thai965Data),
          price: parseLatestClose(thai965Data),
          source: "TRADINGVIEW",
        },
        gold9999_mts: {
          buyIn: Number(mtsData?.gold9999?.buyIn ?? null),
          sellOut: Number(mtsData?.gold9999?.sellOut ?? null),
          price: Number(mtsData?.gold9999?.buyIn ?? null),
          source: "MTS",
        },
        gold965_mts: {
          buyIn: Number(mtsData?.gold965?.buyIn ?? null),
          sellOut: Number(mtsData?.gold965?.sellOut ?? null),
          price: Number(mtsData?.gold965?.buyIn ?? null),
          source: "MTS",
        },
        spot: {
          buyIn: spotOHLC.buyIn,
          sellOut: spotOHLC.sellOut,
          price: spotOHLC.sellOut ?? spotPrice,
          source: spotOHLC.buyIn != null || spotOHLC.sellOut != null ? "TRADINGVIEW" : "INFERRED",
        },
      }

      // --------------------------
      //  apply ONLINE / PAUSE / STOP
      // --------------------------
      const controlledPrices = {}

      for (const goldTypeKey in newLatestPrices) {
        if (goldTypeKey === "timestamp") {
          controlledPrices[goldTypeKey] = newLatestPrices[goldTypeKey]
          continue
        }

        let goldType = goldTypeKey.toUpperCase()

        if (goldType === "GOLD9999") goldType = "GOLD_9999"
        if (goldType === "GOLD965") goldType = "GOLD_965"

        const status = statusMap.get(goldType) || "ONLINE"

        console.log(`Checking status for ${goldTypeKey} → ${goldType}: status=${status}`)

        if (status === "STOP") {
          controlledPrices[goldTypeKey] = {
            buyIn: 0,
            sellOut: 0,
            price: 0,
            source: newLatestPrices[goldTypeKey]?.source || "STOPPED",
          }
        } else if (status === "PAUSE") {
          controlledPrices[goldTypeKey] = this.lastPrices?.[goldTypeKey] || newLatestPrices[goldTypeKey]
        } else {
          controlledPrices[goldTypeKey] = newLatestPrices[goldTypeKey]
        }
      }

      const updatedKeys = Object.keys(controlledPrices).filter(
        (k) => k !== "timestamp" && controlledPrices[k] && Object.values(controlledPrices[k]).some((v) => v != null),
      )
      console.log(`Price update @ ${new Date().toISOString()} updated: ${updatedKeys.join(", ") || "none"}`)
      console.log("Price payload:", JSON.stringify(controlledPrices))
      console.log(
        "MTS Prices:",
        JSON.stringify({
          gold9999_mts: controlledPrices.gold9999_mts,
          gold965_mts: controlledPrices.gold965_mts,
        }),
      )

      try {
        await connectDatabase()
        const database = getDatabase()
        const coll = database.collection("gold_price_history")
        await coll.insertOne({ ts: new Date(), payload: controlledPrices })
        console.log("Price history saved to MongoDB (collection: gold_price_history)")
      } catch (e) {
        const fs = await import("fs/promises")
        await fs.appendFile(
          "server_price_updates.log",
          `${new Date().toISOString()} ${JSON.stringify(controlledPrices)}\n`,
        )
        console.log("Price history appended to server_price_updates.log")
      }

      this.lastPrices = controlledPrices
      this.notifySubscribers(controlledPrices)
    } catch (error) {
      console.error("Error updating prices:", error)
    } finally {
      this.isUpdating = false
    }
  }

  startPriceUpdates(intervalMs = 30 * 1000) {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval)
    }
    this.updatePrices()
    this.priceUpdateInterval = setInterval(() => {
      this.updatePrices()
    }, intervalMs)
    console.log("Price update service started")
  }

  stopPriceUpdates() {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval)
      this.priceUpdateInterval = null
      console.log("Price update service stopped")
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback)
    try {
      if (this.lastPrices) {
        callback(this.lastPrices)
      }
    } catch (err) {
      console.error("Error in immediate subscribe callback:", err)
    }
    return () => this.subscribers.delete(callback)
  }

  notifySubscribers(payload) {
    this.subscribers.forEach((callback) => {
      try {
        callback(payload)
      } catch (error) {
        console.error("Error notifying subscriber:", error)
      }
    })
  }
}

export const goldPriceService = new GoldPriceService()
