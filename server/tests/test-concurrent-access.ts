const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017"
const DB_NAME = process.env.DB_NAME || "gold_trading_system"
const API_URL = process.env.API_URL || "http://localhost:5000"

interface TestResult {
  testId: string
  userId: number
  success: boolean
  responseTime: number
  error?: string
}

async function createTestUser(userId: number): Promise<string | null> {
  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `testuser${userId}@test.com`,
        username: `testuser${userId}`,
        password: "test123456",
      }),
    })

    if (!response.ok) {
      // User might already exist, try login
      const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: `testuser${userId}@test.com`,
          password: "test123456",
        }),
      })

      if (loginResponse.ok) {
        const data = await loginResponse.json()
        return data.token
      }
      return null
    }

    const data = await response.json()
    return data.token
  } catch (error) {
    console.error(`Failed to create test user ${userId}:`, error)
    return null
  }
}

async function simulateUserAccess(userId: number): Promise<TestResult> {
  const startTime = Date.now()

  try {
    // Create/login user
    const token = await createTestUser(userId)

    if (!token) {
      return {
        testId: "TC-001",
        userId,
        success: false,
        responseTime: Date.now() - startTime,
        error: "Failed to authenticate",
      }
    }

    // Test API calls
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }

    // Get wallet
    await fetch(`${API_URL}/api/wallet`, { headers })

    // Get prices
    await fetch(`${API_URL}/api/prices/current`, { headers })

    // Get transaction history
    await fetch(`${API_URL}/api/trading/history`, { headers })

    return {
      testId: "TC-001",
      userId,
      success: true,
      responseTime: Date.now() - startTime,
    }
  } catch (error: any) {
    return {
      testId: "TC-001",
      userId,
      success: false,
      responseTime: Date.now() - startTime,
      error: error.message,
    }
  }
}

async function runConcurrentAccessTest(userCount = 100) {
  console.log(`\nTC-001: Starting Concurrent Access Test with ${userCount} users...\n`)

  const startTime = Date.now()

  // Create all user promises
  const userPromises = Array.from({ length: userCount }, (_, i) => simulateUserAccess(i + 1))

  // Execute all requests concurrently
  const results = await Promise.all(userPromises)

  const totalTime = Date.now() - startTime
  const successCount = results.filter((r) => r.success).length
  const failCount = results.filter((r) => !r.success).length
  const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length

  console.log("=".repeat(60))
  console.log("TC-001: Concurrent Access Test Results")
  console.log("=".repeat(60))
  console.log(`Total Users: ${userCount}`)
  console.log(`Successful: ${successCount} (${((successCount / userCount) * 100).toFixed(2)}%)`)
  console.log(`Failed: ${failCount} (${((failCount / userCount) * 100).toFixed(2)}%)`)
  console.log(`Total Time: ${totalTime}ms`)
  console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`)
  console.log(`Status: ${successCount >= userCount * 0.95 ? "✅ PASS" : "❌ FAIL"}`)
  console.log("=".repeat(60))

  // Show failed requests if any
  if (failCount > 0) {
    console.log("\nFailed Requests:")
    results
      .filter((r) => !r.success)
      .slice(0, 10)
      .forEach((r) => {
        console.log(`- User ${r.userId}: ${r.error}`)
      })
    if (failCount > 10) {
      console.log(`... and ${failCount - 10} more`)
    }
  }

  return {
    passed: successCount >= userCount * 0.95,
    successRate: (successCount / userCount) * 100,
    avgResponseTime,
  }
}

// Run test if executed directly
if (process.argv[1].endsWith("test-concurrent-access.ts")) {
  const userCount = Number.parseInt(process.argv[2] || "100")
  runConcurrentAccessTest(userCount)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Test failed:", err)
      process.exit(1)
    })
}


export { runConcurrentAccessTest }
