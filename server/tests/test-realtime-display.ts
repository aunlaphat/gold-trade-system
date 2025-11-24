/**
 * TC-004: Real-Time Display Test
 * Test if prices update in real-time via WebSocket
 */

import { io, type Socket } from "socket.io-client"

const API_URL = process.env.API_URL || "http://localhost:5000"

async function runRealtimeDisplayTest(duration = 30000): Promise<any> {
  console.log("\nTC-004: Starting Real-Time Display Test...\n")
  console.log(`Test Duration: ${duration / 1000} seconds\n`)

  return new Promise((resolve) => {
    let updateCount = 0
    let lastUpdate: any = null
    const updates: any[] = []

    const socket: Socket = io(API_URL, {
      transports: ["websocket", "polling"],
    })

    socket.on("connect", () => {
      console.log("WebSocket connected")
      console.log("Listening for price updates...\n")
    })

    socket.on("priceUpdate", (prices: any) => {
      updateCount++
      lastUpdate = new Date()
      updates.push({
        timestamp: lastUpdate,
        priceCount: prices.length,
        prices: prices.map((p: any) => ({
          goldType: p.goldType,
          buyIn: p.buyIn,
          sellOut: p.sellOut,
          price: p.price,
        })),
      })

      console.log(`[${lastUpdate.toISOString()}] Update #${updateCount} received (${prices.length} prices)`)
    })

    socket.on("disconnect", () => {
      console.log("\nWebSocket disconnected")
    })

    socket.on("error", (error) => {
      console.error("WebSocket error:", error)
    })

    // Run test for specified duration
    setTimeout(() => {
      socket.disconnect()

      const avgUpdateInterval = updates.length > 1 ? duration / (updates.length - 1) / 1000 : 0

      console.log("\n" + "=".repeat(60))
      console.log("TC-004: Real-Time Display Test Results")
      console.log("=".repeat(60))
      console.log(`Test Duration: ${duration / 1000} seconds`)
      console.log(`Total Updates Received: ${updateCount}`)
      console.log(`Average Update Interval: ${avgUpdateInterval.toFixed(2)} seconds`)
      console.log(`Updates Per Minute: ${(updateCount / (duration / 60000)).toFixed(2)}`)
      console.log(`Status: ${updateCount > 0 ? "✅ PASS" : "❌ FAIL"}`)
      console.log("=".repeat(60))

      if (updates.length > 0) {
        console.log("\nSample Updates:")
        updates.slice(0, 3).forEach((update, idx) => {
          console.log(`\nUpdate #${idx + 1} at ${update.timestamp.toISOString()}:`)
          update.prices.forEach((p: any) => {
            if (p.buyIn !== undefined) {
              console.log(`  ${p.goldType}: Buy ${p.buyIn}, Sell ${p.sellOut}`)
            } else {
              console.log(`  ${p.goldType}: ${p.price}`)
            }
          })
        })
      }

      resolve({
        passed: updateCount > 0,
        updateCount,
        avgUpdateInterval,
        updates,
      })
    }, duration)
  })
}

// Run test if executed directly
if (process.argv[1].endsWith("test-realtime-display.ts")) {
  const duration = Number.parseInt(process.argv[2] || "30000")
  runRealtimeDisplayTest(duration)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Test failed:", err)
      process.exit(1)
    })
}

export { runRealtimeDisplayTest }
