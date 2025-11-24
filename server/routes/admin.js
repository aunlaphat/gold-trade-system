import express from "express"
import { GoldStatus } from "../models/GoldStatus.js"
import { GoldPrice } from "../models/GoldPrice.js"
import { authMiddleware, adminAuthMiddleware } from "../middleware/auth.js"
import { goldStatusService } from "../services/goldStatusService.js" // Import new status service

const router = express.Router()

// Get all statuses (Admin only)
router.get("/status", authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    const statuses = await GoldStatus.getAllStatuses()
    res.json(statuses)
  } catch (error) {
    console.error("Admin: Get statuses error:", error)
    res.status(500).json({ error: "Admin Error", details: "Failed to get statuses" })
  }
})

// Update status (Admin only)
router.put("/status/:goldType", authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    const { goldType } = req.params
    const { status } = req.body

    const validStatuses = ["ONLINE", "PAUSE", "STOP"]
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Admin Error", details: "Invalid status" })
    }

    // If STOP, set price to 0
    if (status === "STOP") {
      await GoldPrice.updatePrice(goldType, {
        buyIn: 0,
        sellOut: 0,
        price: 0,
      })
    }

    await goldStatusService.updateAndNotifyStatus(goldType, status) // Use the new service to update and notify

    res.json({ success: true, goldType, status })
  } catch (error) {
    console.error("Admin: Update status error:", error)
    res.status(500).json({ error: "Admin Error", details: error.message })
  }
})

export default router
