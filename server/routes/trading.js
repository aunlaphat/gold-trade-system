// server/routes/trading.js
import express from "express"
import { Transaction } from "../models/Transaction.js"
import { getDatabase } from "../config/database.js"
import { authMiddleware } from "../middleware/auth.js"
import { GoldStatus } from "../models/GoldStatus.js"
import { goldPriceService } from "../services/goldPriceService.js"
import { exchangeRateService } from "../services/exchangeRateService.js"

const router = express.Router()

// ─────────────────────────────────────────────
// POST /api/trading/execute  (หลัก ๆ ที่เราแก้)
// ─────────────────────────────────────────────
router.post("/execute", authMiddleware, async (req, res) => {
  const { ObjectId } = await import("mongodb")
  const userId = new ObjectId(req.userId)
  const { goldType, action, amount, currency: tradeCurrency } = req.body

  console.log(
    `[Trading] User ${userId} attempting to ${action} ${amount} of ${goldType} using ${tradeCurrency}.`
  )

  try {
    // 0) validate input
    if (!goldType || !action || !amount || !tradeCurrency) {
      console.warn(
        `[Trading] Missing required fields for user ${userId}. Body: ${JSON.stringify(req.body)}`
      )
      return res.status(400).json({ error: "Trade Error", details: "Missing required fields" })
    }

    if (!["BUY", "SELL"].includes(action)) {
      console.warn(`[Trading] Invalid action for user ${userId}: ${action}.`)
      return res.status(400).json({ error: "Trade Error", details: "Invalid action" })
    }

    if (amount <= 0) {
      console.warn(`[Trading] Invalid amount for user ${userId}: ${amount}.`)
      return res.status(400).json({ error: "Trade Error", details: "Amount must be greater than 0" })
    }

    // 1) check gold status
    const status = await GoldStatus.getStatus(goldType)
    if (!status) {
      console.warn(`[Trading] Gold type ${goldType} not found for user ${userId}.`)
      return res.status(400).json({ error: "Trade Error", details: "Gold type not found" })
    }

    if (status.status === "STOP") {
      console.warn(`[Trading] Trading is stopped for ${goldType} for user ${userId}.`)
      return res.status(400).json({ error: "Trade Error", details: "Trading is stopped for this gold type" })
    }

    if (status.status === "PAUSE") {
      console.warn(`[Trading] Trading is paused for ${goldType} for user ${userId}.`)
      return res.status(400).json({ error: "Trade Error", details: "Trading is paused for this gold type" })
    }

    console.log(`[Trading] Gold status for ${goldType} is ${status.status}.`)

    // 2) get latest prices
    const latestPrices = goldPriceService.lastPrices
    if (!latestPrices) {
      console.error(`[Trading] Price data not available for user ${userId}.`)
      return res.status(400).json({ error: "Trade Error", details: "Price data not available" })
    }

    const priceKeyMap = {
      SPOT: "spot",
      GOLD_9999: "gold9999",
      GOLD_965: "gold965",
      GOLD_9999_MTS: "gold9999_mts",
      GOLD_965_MTS: "gold965_mts",
      GOLD_965_ASSO: "gold965_asso",
    }

    const priceKey = priceKeyMap[goldType]
    if (!priceKey) {
      console.warn(`[Trading] Invalid gold type key mapping for user ${userId}: ${goldType}.`)
      return res.status(400).json({ error: "Trade Error", details: "Invalid gold type" })
    }

    const priceData = latestPrices[priceKey]
    if (!priceData) {
      console.error(
        `[Trading] Price data not found for priceKey ${priceKey} for user ${userId}.`
      )
      return res.status(400).json({ error: "Trade Error", details: "Price not available for this gold type" })
    }

    // 2.1 base currency ของทอง (ให้ match กับ frontend)
    const getBaseCurrency = (type) => {
      // ปรับ logic ได้ตามจริง ถ้าคุณกำหนดอื่น
      if (type === "SPOT") return "USD"
      return "THB"
    }

    const baseCurrency = getBaseCurrency(goldType) // "THB" หรือ "USD"

    // 2.2 ราคาใน base currency
    const priceBase = action === "BUY" ? priceData.buyIn : priceData.sellOut
    if (!priceBase || priceBase <= 0) {
      console.error(
        `[Trading] Price not available for ${action} ${goldType} for user ${userId}. PriceData: ${JSON.stringify(
          priceData
        )}.`
      )
      return res.status(400).json({ error: "Trade Error", details: "Price not available" })
    }

    // 3) currency ที่ใช้เทรด (มาจาก client)
    const currency = tradeCurrency // "THB" หรือ "USD"
    console.log(
      `[Trading] Gold type ${goldType} trade will use currency: ${currency}. BaseCurrency: ${baseCurrency}.`
    )

    // 3.1 แปลงราคาไปสกุลที่เทรดจริง
    let priceTrade

    if (baseCurrency === currency) {
      // ไม่ต้องแปลง
      priceTrade = priceBase
    } else {
      // ต้องแปลง THB <-> USD
      const rates = exchangeRateService.lastRates
      const usdThb = rates && rates.USD // 1 USD = usdThb THB เช่น 36.50

      if (!usdThb || usdThb <= 0) {
        console.error(`[Trading] Exchange rate not available for user ${userId}.`)
        return res.status(400).json({ error: "Trade Error", details: "Exchange rate not available" })
      }

      const convert = (value, from, to) => {
        if (from === to) return value
        if (from === "THB" && to === "USD") return value / usdThb
        if (from === "USD" && to === "THB") return value * usdThb
        throw new Error(`Unsupported currency conversion: ${from} -> ${to}`)
      }

      priceTrade = convert(priceBase, baseCurrency, currency)
    }

    const totalCost = priceTrade * amount

    console.log(
      `[Trading] Price for ${action} ${goldType}: base=${priceBase} ${baseCurrency}, trade=${priceTrade} ${currency}, total=${totalCost} ${currency}.`
    )

    // 4) wallet
    const wallet = await getDatabase().collection("wallets").findOne({ userId })
    if (!wallet) {
      console.warn(`[Trading] Wallet not found for user ${userId}.`)
      return res.status(404).json({ error: "Trade Error", details: "Wallet not found" })
    }

    const balance =
      typeof wallet.balance === "number"
        ? { THB: wallet.balance, USD: 0 }
        : wallet.balance || { THB: 0, USD: 0 }

    const currentHoldings = (wallet.goldHoldings && wallet.goldHoldings[goldType]) || 0
    const currentAverageCost =
      (wallet.averageCosts && wallet.averageCosts[goldType]) || 0

    console.log(
      `[Trading] User ${userId} wallet balances: THB ${balance.THB}, USD ${balance.USD}. Gold holdings: ${JSON.stringify(
        wallet.goldHoldings
      )}.`
    )

    // 5) check balance / holdings
    if (action === "BUY") {
      if ((balance[currency] || 0) < totalCost) {
        console.warn(
          `[Trading] Insufficient ${currency} balance for user ${userId}. Required: ${totalCost}, Available: ${
            balance[currency] || 0
          }.`
        )
        return res.status(400).json({
          error: "Trade Error",
          details: `Insufficient ${currency} balance. Required: ${totalCost.toFixed(
            2
          )}, Available: ${(balance[currency] || 0).toFixed(2)}`,
        })
      }
      console.log(`[Trading] User ${userId} has sufficient ${currency} balance for BUY.`)
    } else {
      if (currentHoldings < amount) {
        console.warn(
          `[Trading] Insufficient ${goldType} holdings for user ${userId}. Required: ${amount}, Available: ${currentHoldings}.`
        )
        return res.status(400).json({
          error: "Trade Error",
          details: `Insufficient ${goldType} holdings. Required: ${amount.toFixed(
            4
          )}, Available: ${currentHoldings.toFixed(4)}`,
        })
      }
      console.log(`[Trading] User ${userId} has sufficient ${goldType} holdings for SELL.`)
    }

    // 6) create transaction record (ใช้ราคา / totalCost ใน currency ที่เทรดจริง)
    const transaction = await Transaction.create({
      userId,
      goldType,
      action,
      amount,
      price: priceTrade,
      totalCost,
      currency,
      status: "PENDING",
    })

    console.log(`[Trading] Transaction created with ID: ${transaction._id}. Status: PENDING.`)

    // 7) update wallet
    const updateOps = {
      $set: { updatedAt: new Date() },
    }

    if (action === "BUY") {
      updateOps.$inc = {
        [`balance.${currency}`]: -totalCost,
        [`goldHoldings.${goldType}`]: amount,
      }

      // averageCost เก็บเป็น baseCurrency
      const newTotalHoldings = currentHoldings + amount
      const newAverageCost =
        newTotalHoldings > 0
          ? (currentAverageCost * currentHoldings + priceBase * amount) / newTotalHoldings
          : 0

      updateOps.$set[`averageCosts.${goldType}`] = newAverageCost

      console.log(
        `[Trading] BUY: -${totalCost} ${currency}, +${amount} ${goldType}. New avgCost(${baseCurrency})=${newAverageCost}.`
      )
    } else {
      updateOps.$inc = {
        [`balance.${currency}`]: totalCost,
        [`goldHoldings.${goldType}`]: -amount,
      }

      if (currentHoldings - amount <= 0) {
        updateOps.$set[`averageCosts.${goldType}`] = 0
      } else {
        // คง avg cost เดิม
        updateOps.$set[`averageCosts.${goldType}`] = currentAverageCost
      }

      console.log(
        `[Trading] SELL: +${totalCost} ${currency}, -${amount} ${goldType}. Holdings after=${currentHoldings - amount}.`
      )
    }

    const updateResult = await getDatabase().collection("wallets").updateOne({ userId }, updateOps)
    if (updateResult.modifiedCount === 0) {
      console.error(`[Trading] Wallet update failed for user ${userId}. Document not modified.`)
      return res.status(500).json({ error: "Trade Failed", details: "Wallet update issue." })
    }

    console.log(`[Trading] Wallet updated for user ${userId}.`)

    // 8) update transaction status
    await Transaction.updateStatus(transaction._id, "COMPLETED")
    console.log(`[Trading] Transaction ${transaction._id} status updated to COMPLETED.`)

    const updatedWallet = await getDatabase().collection("wallets").findOne({ userId })

    res.json({
      success: true,
      transaction,
      wallet: updatedWallet,
    })
  } catch (error) {
    console.error(
      `[Trading] Trade execution error for user ${req.userId}:`,
      error && error.message,
      error && error.stack
    )
    res.status(500).json({ error: "Trade execution failed", details: error.message })
  } finally {
    console.log(`[Trading] Trade operation finished for user ${userId}.`)
  }
})

// ─────────────────────────────────────────────
// GET /api/trading/history
// ─────────────────────────────────────────────
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.findByUserId(req.userId)
    res.json(transactions)
  } catch (error) {
    console.error("Get transactions error:", error)
    res.status(500).json({ error: "Failed to get transactions", details: error.message })
  }
})

// ─────────────────────────────────────────────
// POST /api/trading/execute-bulk  (ของเดิม แทบไม่ต้องยุ่ง)
// ─────────────────────────────────────────────
router.post("/execute-bulk", authMiddleware, async (req, res) => {
  try {
    const { trades } = req.body

    if (!Array.isArray(trades) || trades.length === 0) {
      return res.status(400).json({ error: "Bulk Trade Error", details: "Invalid trades array" })
    }

    const { ObjectId } = await import("mongodb")
    const userId = new ObjectId(req.userId)

    const validTrades = []
    for (const trade of trades) {
      const { goldType, action, amount, price } = trade
      if (!goldType || !action || !amount || amount <= 0 || !price || price <= 0) {
        console.warn(
          `[Trading] Invalid trade in bulk operation for user ${userId}: ${JSON.stringify(
            trade
          )}. Skipping.`
        )
        continue
      }

      const status = await GoldStatus.getStatus(goldType)
      if (!status) {
        console.warn(
          `[Trading] Gold type ${goldType} not found in bulk operation for user ${userId}. Skipping.`
        )
        continue
      }

      if (status.status === "STOP") {
        console.warn(
          `[Trading] Trading is stopped for ${goldType} in bulk operation for user ${userId}. Skipping.`
        )
        continue
      }

      if (status.status === "PAUSE") {
        console.warn(
          `[Trading] Trading is paused for ${goldType} in bulk operation for user ${userId}. Skipping.`
        )
        continue
      }

      validTrades.push({
        userId,
        goldType,
        action,
        amount,
        price,
        totalCost: price * amount,
        currency: trade.currency || "THB",
        status: "PENDING",
      })
    }

    if (validTrades.length === 0) {
      return res.status(400).json({ error: "Bulk Trade Error", details: "No valid trades to execute" })
    }

    const result = await Transaction.createBulk(validTrades)

    res.json({
      success: true,
      insertedCount: result.insertedCount,
      insertedIds: Object.values(result.insertedIds),
    })
  } catch (error) {
    console.error("Bulk trade execution error:", error)
    res.status(500).json({ error: "Bulk trade execution failed", details: error.message })
  }
})

export default router
