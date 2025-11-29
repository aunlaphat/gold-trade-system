import express from "express"
import { GoldStatus } from "../models/GoldStatus.js"
import { GoldPrice } from "../models/GoldPrice.js"
import { authMiddleware, adminAuthMiddleware } from "../middleware/auth.js"
import { goldStatusService } from "../services/goldStatusService.js"
import { goldPriceService } from "../services/goldPriceService.js"

const router = express.Router()

// helper: map goldType ใน DB → key ใน lastPrices (/api/prices/current)
function mapGoldTypeToLastPriceKey(goldType) {
  const t = (goldType || "").toUpperCase()

  switch (t) {
    case "SPOT":
      return "spot"

    // global
    case "GOLD_9999":
      return "gold9999"
    case "GOLD_965":
      return "gold965"

    // MTS
    case "GOLD_9999_MTS":
      return "gold9999_mts"
    case "GOLD_965_MTS":
      return "gold965_mts"

    // association
    case "GOLD_965_ASSO":
      return "gold965_asso"

    default:
      return null
  }
}

// -----------------------------
// GET /api/admin/status
// -----------------------------
router.get("/status", authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    const statuses = await GoldStatus.getAllStatuses()
    res.json(statuses)
  } catch (error) {
    console.error("Admin: Get statuses error:", error)
    res.status(500).json({ error: "Admin Error", details: "Failed to get statuses" })
  }
})

// -----------------------------
// PUT /api/admin/status/:goldType
// -----------------------------
router.put("/status/:goldType", authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    const { goldType } = req.params
    const { status } = req.body

    const validStatuses = ["ONLINE", "PAUSE", "STOP"]
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Admin Error", details: "Invalid status" })
    }

    // 1) อัปเดตตารางราคา (ถ้ามี) – optional
    if (status === "STOP") {
      try {
        await GoldPrice.updatePrice(goldType, {
          buyIn: 0,
          sellOut: 0,
          price: 0,
        })
      } catch (e) {
        // ไม่ต้องให้ทั้งระบบล้ม แค่ log ไว้
        console.warn("GoldPrice.updatePrice failed (can be ignored if not used):", e)
      }
    }

    // 2) อัปเดตสถานะใน GoldStatus + broadcast ถ้ามี
    await goldStatusService.updateAndNotifyStatus(goldType, status)

    // 3) ปรับค่าใน memory: goldPriceService.lastPrices ทันที
    const key = mapGoldTypeToLastPriceKey(goldType)
    if (key && goldPriceService.lastPrices) {
      const current = goldPriceService.lastPrices[key] || {}
      if (status === "STOP") {
        // บังคับให้เป็น 0 ทั้งหมด
        goldPriceService.lastPrices[key] = {
          ...current,
          buyIn: 0,
          sellOut: 0,
          price: 0,
          source: current.source || "STOPPED",
        }
      } else if (status === "PAUSE") {
        // PAUSE → ไม่แตะต้อง lastPrices ตอนนี้ ให้ service คุมเองตอนอัปเดตรอบถัดไป
        // (lastPrices ตอนนี้คือค่าก่อนหน้าอยู่แล้ว)
      } else if (status === "ONLINE") {
        // ONLINE → ปล่อยให้รอบ update ถัดไปดึงราคาจริงมาเขียนทับ
        // ถ้าอยาก force refresh ทันที สามารถ uncomment บรรทัดด้านล่างได้
        // goldPriceService.updatePrices().catch(err => console.error("force updatePrices failed:", err))
      }

      // แจ้ง subscriber (เช่น WebSocket) ว่ามีการเปลี่ยนแปลงทันที
      try {
        goldPriceService.notifySubscribers(goldPriceService.lastPrices)
      } catch (e) {
        console.error("notifySubscribers error after status change:", e)
      }
    }

    res.json({ success: true, goldType, status })
  } catch (error) {
    console.error("Admin: Update status error:", error)
    res.status(500).json({ error: "Admin Error", details: error.message || "Unknown error" })
  }
})

export default router
