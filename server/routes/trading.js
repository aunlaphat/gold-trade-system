import express from "express"
import { Transaction } from "../models/Transaction.js"
import { getDatabase, getClient, connectDatabase } from "../config/database.js"
import { authMiddleware } from "../middleware/auth.js"
import { GoldStatus } from "../models/GoldStatus.js"
import { goldPriceService } from "../services/goldPriceService.js"
import { exchangeRateService } from "../services/exchangeRateService.js"

const router = express.Router()

router.post("/execute", authMiddleware, async (req, res) => {
  const { ObjectId } = await import("mongodb")
  const userId = new ObjectId(req.userId)
  const { goldType, action, amount, currency: tradeCurrency } = req.body
  console.log(`[Trading] User ${userId} attempting to ${action} ${amount} of ${goldType} using ${tradeCurrency}.`)

  try {
    if (!goldType || !action || !amount || !tradeCurrency) {
      console.warn(`[Trading] Missing required fields for user ${userId}. Body: ${JSON.stringify(req.body)}`)
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

    // 1. Check gold type status
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

    // 2. Get latest price from goldPriceService
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
      console.error(`[Trading] Price data not found for priceKey ${priceKey} for user ${userId}.`)
      return res.status(400).json({ error: "Trade Error", details: "Price not available for this gold type" })
    }

    const price = action === "BUY" ? priceData.buyIn : priceData.sellOut
    if (!price || price <= 0) {
      console.error(`[Trading] Price not available for ${action} ${goldType} for user ${userId}. PriceData: ${JSON.stringify(priceData)}.`)
      return res.status(400).json({ error: "Trade Error", details: "Price not available" })
    }
    const totalCost = price * amount
    console.log(`[Trading] Price for ${action} ${goldType}: ${price}. Total cost: ${totalCost}.`)

    // 3. Determine currency needed
    const currency = tradeCurrency
    console.log(`[Trading] Gold type ${goldType} trade will use currency: ${currency}.`)

    // 4. Get wallet
    const wallet = await getDatabase().collection("wallets").findOne({ userId })
    if (!wallet) {
      console.warn(`[Trading] Wallet not found for user ${userId}.`)
      return res.status(404).json({ error: "Trade Error", details: "Wallet not found" })
    }

    const balance = typeof wallet.balance === "number"
      ? { THB: wallet.balance, USD: 0 }
      : wallet.balance || { THB: 0, USD: 0 }
    console.log(`[Trading] User ${userId} wallet balances: THB ${balance.THB}, USD ${balance.USD}. Gold holdings: ${JSON.stringify(wallet.goldHoldings)}.`)

    // 5. Check balance/holdings
    if (action === "BUY") {
      if (balance[currency] < totalCost) {
        console.warn(`[Trading] Insufficient ${currency} balance for user ${userId}. Required: ${totalCost}, Available: ${balance[currency]}.`)
        return res.status(400).json({ 
          error: "Trade Error",
          details: `Insufficient ${currency} balance. Required: ${totalCost.toFixed(2)}, Available: ${balance[currency].toFixed(2)}`,
        })
      }
      console.log(`[Trading] User ${userId} has sufficient ${currency} balance for BUY.`)
    } else { // SELL
      const currentHoldings = wallet.goldHoldings?.[goldType] || 0
      if (currentHoldings < amount) {
        console.warn(`[Trading] Insufficient ${goldType} holdings for user ${userId}. Required: ${amount}, Available: ${currentHoldings}.`)
        return res.status(400).json({ 
          error: "Trade Error",
          details: `Insufficient ${goldType} holdings. Required: ${amount.toFixed(4)}, Available: ${currentHoldings.toFixed(4)}`,
        })
      }
      console.log(`[Trading] User ${userId} has sufficient ${goldType} holdings for SELL.`)
    }

    // 6. Create transaction record
    const transaction = await Transaction.create({
      userId,
      goldType,
      action,
      amount,
      price,
      totalCost,
      currency,
      status: "PENDING",
    })
    console.log(`[Trading] Transaction created with ID: ${transaction._id}. Status: PENDING.`)

    // 7. Update wallet
    const updateOps = {
      $set: { updatedAt: new Date() },
    }

    const currentHoldings = wallet.goldHoldings?.[goldType] || 0
    const currentAverageCost = wallet.averageCosts?.[goldType] || 0

    if (action === "BUY") {
      updateOps.$inc = {
        [`balance.${currency}`]: -totalCost,
        [`goldHoldings.${goldType}`]: amount,
      }
      // Recalculate average cost for BUY transactions
      const newTotalHoldings = currentHoldings + amount
      const newAverageCost = newTotalHoldings > 0
        ? ((currentAverageCost * currentHoldings) + (price * amount)) / newTotalHoldings
        : 0 // If holdings become 0, average cost is 0
      updateOps.$set[`averageCosts.${goldType}`] = newAverageCost
      console.log(`[Trading] BUY operation: Decreasing ${currency} by ${totalCost}, Increasing ${goldType} by ${amount}. New average cost: ${newAverageCost}.`)
    } else { // SELL
      updateOps.$inc = {
        [`balance.${currency}`]: totalCost,
        [`goldHoldings.${goldType}`]: -amount,
      }
      // Average cost remains the same for SELL transactions (cost of remaining units)
      // If holdings become 0, average cost should be reset to 0
      if (currentHoldings - amount <= 0) {
        updateOps.$set[`averageCosts.${goldType}`] = 0
      }
      console.log(`[Trading] SELL operation: Increasing ${currency} by ${totalCost}, Decreasing ${goldType} by ${amount}.`)
    }

    const updateResult = await getDatabase().collection("wallets").updateOne({ userId }, updateOps)
    if (updateResult.modifiedCount === 0) {
      console.error(`[Trading] Wallet update failed for user ${userId}. Document not modified.`)
      return res.status(500).json({ error: "Trade Failed", details: "Wallet update issue." })
    }
    console.log(`[Trading] Wallet updated for user ${userId}.`)

    // 8. Update transaction status
    await Transaction.updateStatus(transaction._id, "COMPLETED")
    console.log(`[Trading] Transaction ${transaction._id} status updated to COMPLETED.`)

    const updatedWallet = await getDatabase().collection("wallets").findOne({ userId })

    res.json({ 
      success: true, 
      transaction,
      wallet: updatedWallet,
    })
  } catch (error) {
    console.error(`[Trading] Trade execution error for user ${req.userId}:`, error.message, error.stack)
    res.status(500).json({ error: "Trade execution failed", details: error.message })
  } finally {
    console.log(`[Trading] Trade operation finished for user ${userId}.`)
  }
})

// Get user transactions
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.findByUserId(req.userId)
    res.json(transactions)
  } catch (error) {
    console.error("Get transactions error:", error)
    res.status(500).json({ error: "Failed to get transactions", details: error.message })
  }
})

// Bulk trade execution (for testing concurrent transactions)
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
        console.warn(`[Trading] Invalid trade in bulk operation for user ${userId}: ${JSON.stringify(trade)}. Skipping.`)
        continue // Skip invalid trade data
      }

      const status = await GoldStatus.getStatus(goldType)
      if (!status) {
        console.warn(`[Trading] Gold type ${goldType} not found in bulk operation for user ${userId}. Skipping.`)
        continue
      }

      if (status.status === "STOP") {
        console.warn(`[Trading] Trading is stopped for ${goldType} in bulk operation for user ${userId}. Skipping.`)
        // Optionally, you could return an error for the entire bulk operation here
        // For now, we'll just skip it.
        continue
      }

      if (status.status === "PAUSE") {
        console.warn(`[Trading] Trading is paused for ${goldType} in bulk operation for user ${userId}. Skipping.`)
        continue
      }

      validTrades.push({
        userId,
        goldType,
        action,
        amount,
        price,
        totalCost: price * amount,
        currency: trade.currency || "THB", // Assume THB if not provided for bulk
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
