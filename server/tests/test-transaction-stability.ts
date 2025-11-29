/**
 * TC-002: Transaction Stability Test
 * Test 100+ concurrent transactions for Gold 99.99%
 */

const API_URL = process.env.API_URL || "http://localhost:5000"

interface TransactionTestResult {
  testId: string
  transactionId: number
  success: boolean
  responseTime: number
  error?: string
}

// ─────────────────────────────────────────────
// 1) สร้าง admin เพื่อใช้ตั้งสถานะ GOLD_9999 = ONLINE
// ─────────────────────────────────────────────
async function getAdminToken(): Promise<string | null> {
  try {
    const timestamp = Date.now()
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `admintx${timestamp}@test.com`,
        username: `admintx${timestamp}`,
        password: "admin123456",
        role: "admin", // ให้เป็น admin
      }),
    })

    if (!response.ok) {
      console.error("getAdminToken: register admin failed", await response.text())
      return null
    }

    const data = await response.json()
    return data.token ?? null
  } catch (error) {
    console.error("Failed to get admin token:", error)
    return null
  }
}

// ตั้งสถานะ GOLD_9999 (และ/หรือ GOLD_9999_MTS) ให้เป็น ONLINE ก่อนเทส
async function ensureGoldOnline(adminToken: string): Promise<void> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminToken}`,
  }

  // gold type หลักที่ TC-002 ใช้คือ GOLD_9999
  const goldTypes = ["GOLD_9999"]

  for (const goldType of goldTypes) {
    const resp = await fetch(`${API_URL}/api/admin/status/${goldType}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ status: "ONLINE" }),
    })

    if (!resp.ok) {
      const body = await resp.text()
      console.warn(`ensureGoldOnline: failed to set ${goldType} ONLINE`, resp.status, body)
    } else {
      console.log(`ensureGoldOnline: ${goldType} set to ONLINE`)
    }
  }
}

// ─────────────────────────────────────────────
// 2) สร้าง user ธรรมดา + เติมเงิน/ทอง ให้เทรดได้
// ─────────────────────────────────────────────
async function createTestUserWithBalance(): Promise<string | null> {
  try {
    // Create test user
    const timestamp = Date.now()
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `txtest${timestamp}@test.com`,
        username: `txtest${timestamp}`,
        password: "test123456",
      }),
    })

    if (!response.ok) {
      console.error("createTestUserWithBalance: register failed", await response.text())
      return null
    }

    const data = await response.json()
    const token = data.token as string | undefined

    if (!token) {
      console.error("createTestUserWithBalance: no token returned")
      return null
    }

    // Add THB balance to wallet
    await fetch(`${API_URL}/api/wallet/deposit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: 10_000_000, currency: "THB" }), // 10M THB
    })

    // เติม GOLD_9999 เพิ่มให้พอขายได้
    await fetch(`${API_URL}/api/wallet/deposit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: 1000, currency: "GOLD_9999" }),
    })

    return token
  } catch (error) {
    console.error("Failed to create test user with balance:", error)
    return null
  }
}

// ─────────────────────────────────────────────
// 3) ยิง 1 transaction (BUY/SELL)
// ─────────────────────────────────────────────
async function executeTransaction(token: string, transactionId: number): Promise<TransactionTestResult> {
  const startTime = Date.now()

  try {
    const response = await fetch(`${API_URL}/api/trading/execute`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        goldType: "GOLD_9999",
        action: transactionId % 2 === 0 ? "BUY" : "SELL",
        amount: 0.1, // เล็ก ๆ พอ
        currency: "THB",
      }),
    })

    const success = response.ok
    const data = success ? await response.json() : await response.text()

    return {
      testId: "TC-002",
      transactionId,
      success,
      responseTime: Date.now() - startTime,
      error: success ? undefined : data,
    }
  } catch (error: any) {
    return {
      testId: "TC-002",
      transactionId,
      success: false,
      responseTime: Date.now() - startTime,
      error: error.message,
    }
  }
}

// ─────────────────────────────────────────────
// 4) main: runTransactionStabilityTest
// ─────────────────────────────────────────────
async function runTransactionStabilityTest(transactionCount = 100) {
  console.log(`\nTC-002: Starting Transaction Stability Test with ${transactionCount} transactions...\n`)

  // 4.1 สร้าง admin เพื่อ online สถานะ GOLD_9999
  console.log("Creating admin user to set GOLD_9999 ONLINE...")
  const adminToken = await getAdminToken()
  if (!adminToken) {
    console.error("❌ Failed to create admin user")
    return { passed: false }
  }

  await ensureGoldOnline(adminToken)

  // เผื่อมี delay เล็กน้อย (เช่น cache, background update)
  await new Promise((resolve) => setTimeout(resolve, 500))

  // 4.2 สร้าง user ที่จะใช้งานเทรด
  console.log("Creating test user with balance...")
  const token = await createTestUserWithBalance()

  if (!token) {
    console.error("❌ Failed to create test user")
    return { passed: false }
  }

  console.log("Test user created. Starting transactions...\n")

  const startTime = Date.now()

  // Execute transactions concurrently
  const transactionPromises = Array.from({ length: transactionCount }, (_, i) =>
    executeTransaction(token, i + 1),
  )

  const results = await Promise.all(transactionPromises)

  const totalTime = Date.now() - startTime
  const successCount = results.filter((r) => r.success).length
  const failCount = results.filter((r) => !r.success).length
  const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length

  console.log("=".repeat(60))
  console.log("TC-002: Transaction Stability Test Results")
  console.log("=".repeat(60))
  console.log(`Total Transactions: ${transactionCount}`)
  console.log(`Successful: ${successCount} (${((successCount / transactionCount) * 100).toFixed(2)}%)`)
  console.log(`Failed: ${failCount} (${((failCount / transactionCount) * 100).toFixed(2)}%)`)
  console.log(`Total Time: ${totalTime}ms`)
  console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`)
  console.log(`Transactions/sec: ${(transactionCount / (totalTime / 1000)).toFixed(2)}`)
  console.log(`Status: ${successCount >= transactionCount * 0.95 ? "✅ PASS" : "❌ FAIL"}`)
  console.log("=".repeat(60))

  if (failCount > 0) {
    console.log("\nFailed Transactions:")
    results
      .filter((r) => !r.success)
      .slice(0, 10)
      .forEach((r) => {
        console.log(`- Transaction ${r.transactionId}: ${r.error}`)
      })
    if (failCount > 10) {
      console.log(`... and ${failCount - 10} more`)
    }
  }

  return {
    passed: successCount >= transactionCount * 0.95,
    successRate: (successCount / transactionCount) * 100,
    avgResponseTime,
    throughput: transactionCount / (totalTime / 1000),
  }
}

// Run test if executed directly
if (process.argv[1].endsWith("test-transaction-stability.ts")) {
  const txCount = Number.parseInt(process.argv[2] || "100")
  runTransactionStabilityTest(txCount)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Test failed:", err)
      process.exit(1)
    })
}

export { runTransactionStabilityTest }
