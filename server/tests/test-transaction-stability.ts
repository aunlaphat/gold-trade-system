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

    const data = await response.json()
    const token = data.token

    // Add balance to wallet
    await fetch(`${API_URL}/api/wallet/deposit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: 10000000 }), // 10M THB for testing
    })

    return token
  } catch (error) {
    console.error("Failed to create test user with balance:", error)
    return null
  }
}

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
        amount: 0.1, // Small amount for testing
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

async function runTransactionStabilityTest(transactionCount = 100) {
  console.log(`\nTC-002: Starting Transaction Stability Test with ${transactionCount} transactions...\n`)

  // Create test user with sufficient balance
  console.log("Creating test user with balance...")
  const token = await createTestUserWithBalance()

  if (!token) {
    console.error("❌ Failed to create test user")
    return { passed: false }
  }

  console.log("Test user created. Starting transactions...\n")

  const startTime = Date.now()

  // Execute transactions concurrently
  const transactionPromises = Array.from({ length: transactionCount }, (_, i) => executeTransaction(token, i + 1))

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

  // Show failed transactions if any
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
