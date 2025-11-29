import express from "express"
import { getDatabase } from "../config/database.js"
import { authMiddleware } from "../middleware/auth.js"
import { exchangeRateService } from "../services/exchangeRateService.js"
import { goldPriceService } from "../services/goldPriceService.js" // Import goldPriceService

const router = express.Router()

// Get wallet balance
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { ObjectId } = await import("mongodb")
    const userId = new ObjectId(req.userId)
    console.log(`[Wallet] User ${userId} requesting wallet balance.`)

    const wallet = await getDatabase()
      .collection("wallets")
      .findOne({ userId })

    if (!wallet) {
      console.warn(`[Wallet] Wallet not found for user ${userId}.`)
      return res.status(404).json({ error: "Wallet Error", details: "Wallet not found" })
    }

    // Ensure balance is an object with THB and USD
    if (typeof wallet.balance === "number") {
      console.log(`[Wallet] Migrating old balance format for user ${userId}.`)
      wallet.balance = {
        THB: wallet.balance,
        USD: 0,
      }
    }

    // Ensure averageCosts is an object
    if (!wallet.averageCosts) {
      wallet.averageCosts = {}
    }

    const rates = exchangeRateService.getRates()
    const currentPrices = goldPriceService.lastPrices // Get latest prices

    console.log(`[Wallet] Successfully retrieved wallet for user ${userId}. Balances: THB ${wallet.balance.THB}, USD ${wallet.balance.USD}.`)
    res.json({ 
      ...wallet, 
      exchangeRates: rates,
      currentMarketPrices: currentPrices, // Include current market prices
    })
  } catch (error) {
    console.error(`[Wallet] Get wallet error for user ${req.userId}:`, error.message, error.stack)
    res.status(500).json({ error: "Failed to get wallet", details: error.message })
  }
})

router.post("/deposit", authMiddleware, async (req, res) => {
  try {
    const { amount, currency } = req.body
    const { ObjectId } = await import("mongodb")
    const userId = new ObjectId(req.userId)
    console.log(`[Wallet] User ${userId} attempting to deposit ${amount} ${currency || "THB"}.`)

    if (!amount || amount <= 0) {
      console.warn(`[Wallet] Invalid deposit amount for user ${userId}: ${amount}.`)
      return res.status(400).json({ error: "Deposit Error", details: "Invalid amount" })
    }

    if (!currency) {
      console.warn(`[Wallet] Missing currency for deposit for user ${userId}.`)
      return res.status(400).json({ error: "Deposit Error", details: "Currency is required" })
    }

    const wallet = await getDatabase()
      .collection("wallets")
      .findOne({ userId })

    if (!wallet) {
      console.warn(`[Wallet] Wallet not found for user ${userId} during deposit.`)
      return res.status(404).json({ error: "Deposit Error", details: "Wallet not found" })
    }

    let updateField
    if (["THB", "USD"].includes(currency)) {
      updateField = `balance.${currency}`
    } else if (["SPOT", "GOLD_9999", "GOLD_965", "GOLD_9999_MTS", "GOLD_965_MTS", "GOLD_965_ASSO"].includes(currency)) {
      updateField = `goldHoldings.${currency}`
    } else {
      console.warn(`[Wallet] Invalid currency type for deposit for user ${userId}: ${currency}.`)
      return res.status(400).json({ error: "Deposit Error", details: "Invalid currency type" })
    }

    const updateResult = await getDatabase()
      .collection("wallets")
      .updateOne(
        { userId },
        {
          $inc: { [updateField]: amount },
          $set: { updatedAt: new Date() },
        },
      )

    if (updateResult.modifiedCount === 0) {
      console.error(`[Wallet] Deposit update failed for user ${userId}. Document not modified.`)
      return res.status(500).json({ error: "Deposit Failed", details: "Wallet update issue." })
    }

    const updatedWallet = await getDatabase().collection("wallets").findOne({ userId })
    if (!updatedWallet) {
      console.error(`[Wallet] Deposit failed for user ${userId}. Updated wallet not found after update.`)
      return res.status(500).json({ error: "Deposit Failed", details: "Could not retrieve updated wallet." })
    }

    console.log(`[Wallet] Deposit successful for user ${userId}. New ${currency} balance: ${updatedWallet.balance?.[currency] || updatedWallet.goldHoldings?.[currency]}.`)
    res.json(updatedWallet)
  } catch (error) {
    console.error(`[Wallet] Deposit error for user ${req.userId}:`, error.message, error.stack)
    res.status(500).json({ error: "Deposit Failed", details: error.message })
  }
})

router.post("/withdraw", authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body
    const { ObjectId } = await import("mongodb")
    const userId = new ObjectId(req.userId)
    console.log(`[Wallet] User ${userId} attempting to withdraw ${amount} THB.`)

    if (!amount || amount <= 0) {
      console.warn(`[Wallet] Invalid withdrawal amount for user ${userId}: ${amount}.`)
      return res.status(400).json({ error: "Withdrawal Error", details: "Invalid amount" })
    }

    const wallet = await getDatabase()
      .collection("wallets")
      .findOne({ userId })

    if (!wallet) {
      console.warn(`[Wallet] Wallet not found for user ${userId} during withdrawal.`)
      return res.status(404).json({ error: "Withdrawal Error", details: "Wallet not found" })
    }

    const thbBalance = typeof wallet.balance === "number" ? wallet.balance : (wallet.balance?.THB || 0)

    if (thbBalance < amount) {
      console.warn(`[Wallet] Insufficient THB balance for user ${userId}. Attempted: ${amount}, Available: ${thbBalance}.`)
      return res.status(400).json({ error: "Withdrawal Error", details: "Insufficient balance" })
    }

    const updateOp = typeof wallet.balance === "number"
      ? {
          $set: {
            balance: { THB: wallet.balance - amount, USD: wallet.balance?.USD || 0 },
            updatedAt: new Date(),
          },
        }
      : {
          $inc: { "balance.THB": -amount },
          $set: { updatedAt: new Date() },
        }

    const updateResult = await getDatabase()
      .collection("wallets")
      .updateOne({ userId }, updateOp)

    if (updateResult.modifiedCount === 0) {
      console.error(`[Wallet] Withdraw update failed for user ${userId}. Document not modified.`)
      return res.status(500).json({ error: "Withdrawal Failed", details: "Wallet update issue." })
    }

    const updatedWallet = await getDatabase().collection("wallets").findOne({ userId })
    if (!updatedWallet) {
      console.error(`[Wallet] Withdraw failed for user ${userId}. Updated wallet not found after update.`)
      return res.status(500).json({ error: "Withdrawal Failed", details: "Could not retrieve updated wallet." })
    }

    console.log(`[Wallet] Withdrawal successful for user ${userId}. New THB balance: ${updatedWallet.balance.THB}.`)
    res.json(updatedWallet)
  } catch (error) {
    console.error(`[Wallet] Withdraw error for user ${req.userId}:`, error.message, error.stack)
    res.status(500).json({ error: "Withdrawal Failed", details: error.message })
  }
})

router.post("/exchange", authMiddleware, async (req, res) => {
  try {
    const { fromCurrency, toCurrency, amount } = req.body
    const { ObjectId } = await import("mongodb")
    const userId = new ObjectId(req.userId)
    console.log(`[Wallet] User ${userId} attempting to exchange ${amount} ${fromCurrency} to ${toCurrency}.`)

    if (!fromCurrency || !toCurrency || !amount || amount <= 0) {
      console.warn(`[Wallet] Invalid exchange parameters for user ${userId}.`)
      return res.status(400).json({ error: "Exchange Error", details: "Invalid parameters" })
    }

    if (!["THB", "USD"].includes(fromCurrency) || !["THB", "USD"].includes(toCurrency)) {
      console.warn(`[Wallet] Invalid currency specified for user ${userId}. From: ${fromCurrency}, To: ${toCurrency}.`)
      return res.status(400).json({ error: "Exchange Error", details: "Invalid currency. Must be THB or USD" })
    }

    if (fromCurrency === toCurrency) {
      console.warn(`[Wallet] Attempted to exchange same currency for user ${userId}: ${fromCurrency}.`)
      return res.status(400).json({ error: "Exchange Error", details: "Cannot exchange same currency" })
    }

    const wallet = await getDatabase()
      .collection("wallets")
      .findOne({ userId })

    if (!wallet) {
      console.warn(`[Wallet] Wallet not found for user ${userId} during exchange.`)
      return res.status(404).json({ error: "Exchange Error", details: "Wallet not found" })
    }

    const balance = typeof wallet.balance === "number"
      ? { THB: wallet.balance, USD: 0 }
      : wallet.balance || { THB: 0, USD: 0 }

    if (balance[fromCurrency] < amount) {
      console.warn(`[Wallet] Insufficient ${fromCurrency} balance for user ${userId}. Attempted: ${amount}, Available: ${balance[fromCurrency]}.`)
      return res.status(400).json({ error: "Exchange Error", details: "Insufficient balance" })
    }

    const rates = exchangeRateService.getRates()
    let convertedAmount

    if (fromCurrency === "THB" && toCurrency === "USD") {
      convertedAmount = exchangeRateService.thbToUsd(amount)
    } else {
      convertedAmount = exchangeRateService.usdToThb(amount)
    }

    if (!convertedAmount) {
      console.error(`[Wallet] Exchange rate not available for ${fromCurrency} to ${toCurrency} for user ${userId}.`)
      return res.status(500).json({ error: "Exchange Failed", details: "Exchange rate not available" })
    }

    const updateOp = {
      $inc: {
        [`balance.${fromCurrency}`]: -amount,
        [`balance.${toCurrency}`]: convertedAmount,
      },
      $set: { updatedAt: new Date() },
    }

    const updateResult = await getDatabase()
      .collection("wallets")
      .updateOne({ userId }, updateOp)

    if (updateResult.modifiedCount === 0) {
      console.error(`[Wallet] Exchange update failed for user ${userId}. Document not modified.`)
      return res.status(500).json({ error: "Exchange Failed", details: "Wallet update issue." })
    }

    const updatedWallet = await getDatabase().collection("wallets").findOne({ userId })
    if (!updatedWallet) {
      console.error(`[Wallet] Exchange failed for user ${userId}. Updated wallet not found after update.`)
      return res.status(500).json({ error: "Exchange Failed", details: "Could not retrieve updated wallet." })
    }

    console.log(`[Wallet] Exchange successful for user ${userId}. Exchanged ${amount} ${fromCurrency} to ${convertedAmount.toFixed(2)} ${toCurrency}. New balances: THB ${updatedWallet.balance.THB}, USD ${updatedWallet.balance.USD}.`)
    res.json({
      success: true,
      wallet: updatedWallet,
      exchangeRate: fromCurrency === "THB" ? rates.USD : 1 / rates.USD,
      convertedAmount,
    })
  } catch (error) {
    console.error(`[Wallet] Exchange error for user ${req.userId}:`, error.message, error.stack)
    res.status(500).json({ error: "Exchange Failed", details: error.message })
  }
})

export default router
