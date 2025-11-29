import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import cors from "cors"
import { connectDatabase } from "./config/database.js"
import { goldPriceService } from "./services/goldPriceService.js"
import { exchangeRateService } from "./services/exchangeRateService.js"
import { goldStatusService } from "./services/goldStatusService.js"

// Import routes
import authRoutes from "./routes/auth.js"
import walletRoutes from "./routes/wallet.js"
import pricesRouter from "./routes/prices.js"
import adminRoutes from "./routes/admin.js"
import tradingRoutes from "./routes/trading.js"

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
})

// Middleware
app.use(cors({ origin: true })) 
app.use(express.json())

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/wallet", walletRoutes)
app.use("/api/prices", pricesRouter)
app.use("/api/admin", adminRoutes) // Use new admin routes
app.use("/api/trading", tradingRoutes)

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

// WebSocket connection
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id)
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id)
  })

  // Subscribe to status updates and broadcast to this client
  const unsubscribeStatus = goldStatusService.subscribe((updatedStatus) => {
    socket.emit("statusUpdate", updatedStatus)
  })

  // Subscribe to price updates and broadcast to this client
  const unsubscribePrice = goldPriceService.subscribe((latestPrices) => {
    if (latestPrices) {
      const pricesArray = Object.entries(latestPrices)
        .map(([key, value]) => {
          if (!value || key === "timestamp") return null
          const goldTypeMap = {
            spot: "SPOT",
            gold9999: "GOLD_9999",
            gold965: "GOLD_965",
            gold965_asso: "GOLD_965_ASSO",
            gold9999_mts: "GOLD_9999_MTS",
            gold965_mts: "GOLD_965_MTS",
          }
          const goldType = goldTypeMap[key]
          return goldType ? { goldType, ...value } : null
        })
        .filter(Boolean) // Remove null entries

      socket.emit("priceUpdate", pricesArray) // Emit to this specific socket
    }
  })

  socket.on("disconnect", () => {
    unsubscribeStatus()
    unsubscribePrice()
  })
})

// Start server
const PORT = process.env.PORT || 5000

async function startServer() {
  try {
    // Connect to database
    await connectDatabase()

    const { GoldStatus } = await import("./models/GoldStatus.js")
    const defaultGoldTypes = [
      "SPOT",
      "GOLD_9999",
      "GOLD_965",
      "GOLD_9999_MTS",
      "GOLD_965_MTS",
      "GOLD_965_ASSO",
    ]
    for (const type of defaultGoldTypes) {
      const existingStatus = await GoldStatus.getStatus(type)
      if (!existingStatus) {
        await GoldStatus.updateStatus(type, "ONLINE")
        console.log(`[Server] Initialized status for ${type} to ONLINE.`)
      }
    }
    await goldStatusService.initializeStatuses() // Initialize the new status service

    // Start price updates
    goldPriceService.startPriceUpdates(60 * 1000)

    // Start exchange rate updates
    exchangeRateService.startUpdates()

    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
      console.log(`WebSocket server ready`)
    })
  } catch (error) {
    console.error("Failed to start server:", error)
    process.exit(1)
  }
}

startServer()

process.on("SIGINT", () => {
  console.log("Shutting down gracefully...")
  goldPriceService.stopPriceUpdates()
  exchangeRateService.stopUpdates()
  httpServer.close(() => {
    console.log("Server closed")
    process.exit(0)
  })
})
