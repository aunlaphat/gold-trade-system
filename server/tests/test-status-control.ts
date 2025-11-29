/**
 * TC-003: Price Status Control Test
 * Test status controls (ONLINE, PAUSE, STOP) for gold prices
 */

const API_URL = process.env.API_URL || "http://localhost:5000"

async function getAdminToken(): Promise<string | null> {
  try {
    const timestamp = Date.now()
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `admin${timestamp}@test.com`,
        username: `admin${timestamp}`,
        password: "admin123456",
        role: "admin",
      }),
    })

    const data = await response.json()
    return data.token
  } catch (error) {
    console.error("Failed to get admin token:", error)
    return null
  }
}

async function testStatusChange(
  goldType: string,
  status: "ONLINE" | "PAUSE" | "STOP",
  adminToken: string,
): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/admin/status/${goldType}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      console.error(`Status change failed: ${response.status} ${response.statusText}`)
      return false
    }

    const statusResponse = await fetch(`${API_URL}/api/admin/status`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    })
    const statuses = await statusResponse.json()
    const goldStatus = statuses.find((s: any) => s.goldType === goldType)

    return goldStatus?.status === status
  } catch (error) {
    console.error(`Failed to test status change for ${goldType}:`, error)
    return false
  }
}

async function verifyPriceOnStop(goldType: string): Promise<boolean> {
  try {
    // รอให้ service อัปเดตราคาหลังเปลี่ยน status
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const response = await fetch(`${API_URL}/api/prices/current`)
    const prices = await response.json()

    // map goldType → key ใน JSON ของ /api/prices/current
    const keyMap: Record<string, string> = {
      SPOT: "spot",
      GOLD_9999: "gold9999",
      GOLD_965: "gold965",
      GOLD_9999_MTS: "gold9999_mts",
      GOLD_965_MTS: "gold965_mts",
      GOLD_965_ASSO: "gold965_asso",
    }

    const key = keyMap[goldType] ?? goldType.toLowerCase()
    const price = prices[key]

    if (!price) {
      console.warn(`[TC-003] Price data not found for key='${key}' (goldType=${goldType}).`)
      return false
    }

    const buyIn = price.buyIn ?? price.price
    const sellOut = price.sellOut ?? price.price
    const p = price.price ?? buyIn ?? sellOut

    return buyIn === 0 && sellOut === 0 && p === 0
  } catch (error) {
    console.error(`Failed to verify price for ${goldType}:`, error)
    return false
  }
}

async function runStatusControlTest() {
  console.log("\nTC-003: Starting Price Status Control Test...\n")

  console.log("Creating admin user...")
  const adminToken = await getAdminToken()

  if (!adminToken) {
    console.error("❌ Failed to create admin user")
    return { passed: false, successRate: 0, results: [] }
  }

  console.log("✅ Admin user created\n")

  const goldTypes = ["SPOT", "GOLD_9999", "GOLD_965"] as const
  const statuses: ("ONLINE" | "PAUSE" | "STOP")[] = ["ONLINE", "PAUSE", "STOP"]

  let totalTests = 0
  let passedTests = 0
  const results: Array<{ goldType: string; status: string; passed: boolean }> = []

  for (const goldType of goldTypes) {
    console.log(`\nTesting ${goldType}:`)

    for (const status of statuses) {
      totalTests++
      console.log(`  Setting status to ${status}...`)

      const success = await testStatusChange(goldType, status, adminToken)

      if (success) {
        if (status === "STOP") {
          const priceIsZero = await verifyPriceOnStop(goldType)
          if (priceIsZero) {
            console.log(`    ✅ Status changed to ${status} and price set to 0`)
            passedTests++
            results.push({ goldType, status, passed: true })
          } else {
            console.log(`    ❌ Status changed but price not 0`)
            results.push({ goldType, status, passed: false })
          }
        } else {
          console.log(`    ✅ Status changed to ${status}`)
          passedTests++
          results.push({ goldType, status, passed: true })
        }
      } else {
        console.log(`    ❌ Failed to change status to ${status}`)
        results.push({ goldType, status, passed: false })
      }

      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    await testStatusChange(goldType, "ONLINE", adminToken)
  }

  console.log("\n" + "=".repeat(60))
  console.log("TC-003: Price Status Control Test Results")
  console.log("=".repeat(60))
  console.log(`Total Tests: ${totalTests}`)
  console.log(`Passed: ${passedTests}`)
  console.log(`Failed: ${totalTests - passedTests}`)
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`)
  console.log(`Status: ${passedTests === totalTests ? "✅ PASS" : "❌ FAIL"}`)
  console.log("=".repeat(60))

  return {
    passed: passedTests === totalTests,
    successRate: (passedTests / totalTests) * 100,
    results,
  }
}

if (process.argv[1].endsWith("test-status-control.ts")) {
  runStatusControlTest()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Test failed:", err)
      process.exit(1)
    })
}

export { runStatusControlTest }
