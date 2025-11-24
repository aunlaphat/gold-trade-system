import express from "express"
import { GoldStatus } from "../models/GoldStatus.js"
import { GoldPrice } from "../models/GoldPrice.js"

const router = express.Router()

// Get all statuses
router.get("/", async (req, res) => {
  try {
    const statuses = await GoldStatus.getAllStatuses()
    res.json(statuses)
  } catch (error) {
    console.error("[v0] Get statuses error:", error)
    res.status(500).json({ error: "Failed to get statuses" })
  }
})

// Update status (Admin only - add auth middleware in production)
router.put("/:goldType", async (req, res) => {
  try {
    const { goldType } = req.params
    const { status } = req.body

    const validStatuses = ["ONLINE", "PAUSE", "STOP"]
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" })
    }

    // If STOP, set price to 0
    if (status === "STOP") {
      await GoldPrice.updatePrice(goldType, {
        buyIn: 0,
        sellOut: 0,
        price: 0,
      })
    }

    await GoldStatus.updateStatus(goldType, status)

    res.json({ success: true, goldType, status })
  } catch (error) {
    console.error("[v0] Update status error:", error)
    res.status(500).json({ error: "Failed to update status" })
  }
})

export default router
