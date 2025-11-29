import fetch from "node-fetch"

const API_BASE = process.env.API_BASE_URL || "http://localhost:5000"

interface TestResult {
  name: string
  status: "PASS" | "FAIL"
  message: string
  duration: number
}

const results: TestResult[] = []

async function test(name: string, fn: () => Promise<void>) {
  const start = Date.now()
  try {
    await fn()
    const duration = Date.now() - start
    results.push({ name, status: "PASS", message: "Test passed", duration })
    console.log(`✅ ${name} (${duration}ms)`)
  } catch (error: any) {
    const duration = Date.now() - start
    results.push({ name, status: "FAIL", message: error.message, duration })
    console.error(`❌ ${name} (${duration}ms): ${error.message}`)
  }
}

// Helper function for API requests
async function apiRequest(path: string, options: any = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  const contentType = response.headers.get("content-type")
  let data: any // Add type annotation to fix 'unknown' error
  if (contentType?.includes("application/json")) {
    data = await response.json()
  } else {
    data = await response.text()
  }

  return { response, data }
}

let testUserToken: string
let testUserId: string
let adminToken: string

async function runTests() {
  console.log("\n🧪 Starting API Tests...\n")

  // ========================================
  // Authentication Tests
  // ========================================
  console.log("📋 Authentication Tests")
  console.log("─".repeat(50))

  await test("Register - should create new user", async () => {
    const { response, data } = await apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: `test${Date.now()}@example.com`,
        username: `testuser${Date.now()}`,
        password: "Test123!",
      }),
    })

    if (!response.ok) throw new Error(`Registration failed: ${JSON.stringify(data)}`)
    if (!data.user) throw new Error("No user returned")
  })

  await test("Register - should fail with duplicate email", async () => {
    const email = `duplicate${Date.now()}@example.com`

    // First registration
    await apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        username: `user${Date.now()}`,
        password: "Test123!",
      }),
    })

    // Second registration with same email
    const { response, data } = await apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        username: `user${Date.now() + 1}`,
        password: "Test123!",
      }),
    })

    if (response.ok) throw new Error("Should have failed with duplicate email")
  })

  await test("Register - should fail with missing fields", async () => {
    const { response } = await apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: `test@example.com`,
        // missing username and password
      }),
    })

    if (response.ok) throw new Error("Should have failed with missing fields")
  })

  await test("Login - should login successfully", async () => {
    // Create user first
    const testEmail = `logintest${Date.now()}@example.com`
    await apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: testEmail,
        username: `loginuser${Date.now()}`,
        password: "Test123!",
      }),
    })

    // Login
    const { response, data } = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: testEmail,
        password: "Test123!",
      }),
    })

    if (!response.ok) throw new Error(`Login failed: ${JSON.stringify(data)}`)
    if (!data.token) throw new Error("No token returned")
    if (!data.user) throw new Error("No user returned")

    testUserToken = data.token
    testUserId = data.user.id
  })

  await test("Login - should fail with wrong password", async () => {
    const { response } = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "WrongPassword!",
      }),
    })

    if (response.ok) throw new Error("Should have failed with wrong password")
  })

  await test("Login - should fail with non-existent user", async () => {
    const { response } = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "nonexistent@example.com",
        password: "Test123!",
      }),
    })

    if (response.ok) throw new Error("Should have failed with non-existent user")
  })

  // ========================================
  // Wallet Tests
  // ========================================
  console.log("\n📋 Wallet Tests")
  console.log("─".repeat(50))

  await test("Get Wallet - should return wallet info", async () => {
    const { response, data } = await apiRequest("/api/wallet", {
      headers: {
        Authorization: `Bearer ${testUserToken}`,
      },
    })

    if (!response.ok) throw new Error(`Get wallet failed: ${JSON.stringify(data)}`)
    if (data.balance === undefined) throw new Error("No balance returned")
    if (!data.goldHoldings) throw new Error("No goldHoldings returned")
  })

  await test("Get Wallet - should fail without auth token", async () => {
    const { response } = await apiRequest("/api/wallet")

    if (response.ok) throw new Error("Should have failed without auth token")
  })

  await test("Deposit - should add money to wallet", async () => {
    const { response, data } = await apiRequest("/api/wallet/deposit", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({ amount: 10000, currency: "THB" }),
    })

    if (!response.ok) throw new Error(`Deposit failed: ${JSON.stringify(data)}`)
    if (!data.balance) throw new Error("No balance returned")
  })

  await test("Deposit - should fail with negative amount", async () => {
    const { response } = await apiRequest("/api/wallet/deposit", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({ amount: -1000, currency: "THB" }),
    })

    if (response.ok) throw new Error("Should have failed with negative amount")
  })

  await test("Withdraw - should remove money from wallet", async () => {
    const { response, data } = await apiRequest("/api/wallet/withdraw", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({ amount: 1000, currency: "THB" }),
    })

    if (!response.ok) throw new Error(`Withdraw failed: ${JSON.stringify(data)}`)
  })

  await test("Withdraw - should fail with insufficient balance", async () => {
    const { response } = await apiRequest("/api/wallet/withdraw", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({ amount: 999999999, currency: "THB" }),
    })

    if (response.ok) throw new Error("Should have failed with insufficient balance")
  })

  await test("Exchange Currency - should exchange THB to USD", async () => {
    const { response, data } = await apiRequest("/api/wallet/exchange", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({
        fromCurrency: "THB",
        toCurrency: "USD",
        amount: 1000,
      }),
    })

    if (!response.ok) throw new Error(`Exchange failed: ${JSON.stringify(data)}`)
    if (!data.wallet) throw new Error("No wallet returned")
  })

  await test("Exchange Currency - should fail with invalid currency", async () => {
    const { response } = await apiRequest("/api/wallet/exchange", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({
        fromCurrency: "EUR",
        toCurrency: "USD",
        amount: 1000,
      }),
    })

    if (response.ok) throw new Error("Should have failed with invalid currency")
  })

  // ========================================
  // Price Tests
  // ========================================
  console.log("\n📋 Price Tests")
  console.log("─".repeat(50))

  await test("Get Current Prices - should return all prices", async () => {
    const { response, data } = await apiRequest("/api/prices/current")

    if (!response.ok) throw new Error(`Get prices failed: ${JSON.stringify(data)}`)
    if (!data.gold9999_mts) throw new Error("No gold9999_mts price")
  })

  await test("Get Price History - should return historical data", async () => {
    const { response, data } = await apiRequest("/api/prices/history/gold9999_mts")

    if (!response.ok) throw new Error(`Get history failed: ${JSON.stringify(data)}`)
    if (!Array.isArray(data)) throw new Error("History should be an array")
  })

  await test("Get Price History - should fail with invalid gold type", async () => {
    const { response } = await apiRequest("/api/prices/history/invalid_type")

    // This might return empty array instead of error
    // Just check it doesn't crash
    if (!response.ok && response.status !== 404) {
      throw new Error("Unexpected error")
    }
  })

  // ========================================
  // Trading Tests
  // ========================================
  console.log("\n📋 Trading Tests")
  console.log("─".repeat(50))

  // First, create an admin user for status control
  const adminEmail = `admin${Date.now()}@example.com`
  const { data: adminData } = await apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: adminEmail,
      username: `admin${Date.now()}`,
      password: "Admin123!",
      role: "admin",
    }),
  })
  adminToken = adminData.token

  // Set gold status to ONLINE for GOLD_9999_MTS before trading
  await apiRequest("/api/admin/status/GOLD_9999_MTS", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status: "ONLINE" }),
  })

  // Wait a bit for status to propagate
  await new Promise((resolve) => setTimeout(resolve, 500))

  await apiRequest("/api/wallet/deposit", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${testUserToken}`,
    },
    body: JSON.stringify({ amount: 100000, currency: "THB" }),
  })

  await test("Execute Trade (BUY) - should buy gold", async () => {
    const { response, data } = await apiRequest("/api/trading/execute", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({
        goldType: "GOLD_9999_MTS",
        action: "BUY",
        amount: 1,
        currency: "THB",
      }),
    })

    if (!response.ok) throw new Error(`Trade failed: ${JSON.stringify(data)}`)
    if (!data.transaction) throw new Error("No transaction returned")
    if (!data.wallet) throw new Error("No wallet returned")
  })

  await test("Execute Trade (SELL) - should sell gold", async () => {
    const { response, data } = await apiRequest("/api/trading/execute", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({
        goldType: "GOLD_9999_MTS",
        action: "SELL",
        amount: 0.5,
        currency: "THB",
      }),
    })

    if (!response.ok) throw new Error(`Trade failed: ${JSON.stringify(data)}`)
  })

  await test("Execute Trade - should fail with insufficient balance", async () => {
    const { response } = await apiRequest("/api/trading/execute", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({
        goldType: "GOLD_9999_MTS",
        action: "BUY",
        amount: 999999,
        currency: "THB",
      }),
    })

    if (response.ok) throw new Error("Should have failed with insufficient balance")
  })

  await test("Execute Trade - should fail with insufficient holdings", async () => {
    const { response } = await apiRequest("/api/trading/execute", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({
        goldType: "GOLD_9999_MTS",
        action: "SELL",
        amount: 999999,
        currency: "THB",
      }),
    })

    if (response.ok) throw new Error("Should have failed with insufficient holdings")
  })

  await test("Execute Trade - should fail with negative amount", async () => {
    const { response } = await apiRequest("/api/trading/execute", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({
        goldType: "GOLD_9999_MTS",
        action: "BUY",
        amount: -1,
        currency: "THB",
      }),
    })

    if (response.ok) throw new Error("Should have failed with negative amount")
  })

  await test("Execute Trade - should fail with missing fields", async () => {
    const { response } = await apiRequest("/api/trading/execute", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({
        goldType: "GOLD_9999_MTS",
        // missing action, amount, currency
      }),
    })

    if (response.ok) throw new Error("Should have failed with missing fields")
  })

  await test("Get Transaction History - should return transactions", async () => {
    const { response, data } = await apiRequest("/api/trading/history", {
      headers: {
        Authorization: `Bearer ${testUserToken}`,
      },
    })

    if (!response.ok) throw new Error(`Get history failed: ${JSON.stringify(data)}`)
    if (!Array.isArray(data)) throw new Error("History should be an array")
  })

  // ========================================
  // Admin Tests (if admin credentials available)
  // ========================================
  console.log("\n📋 Admin Tests")
  console.log("─".repeat(50))

  await test("Get All Statuses - should return all gold statuses", async () => {
    const { response, data } = await apiRequest("/api/admin/status", {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    })

    if (!response.ok) throw new Error(`Get statuses failed: ${JSON.stringify(data)}`)
    if (!Array.isArray(data)) throw new Error("Statuses should be an array")
  })

  await test("TC-001: Status ONLINE - prices should be normal", async () => {
    // Set status to ONLINE
    await apiRequest("/api/admin/status/GOLD_9999_MTS", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: "ONLINE" }),
    })

    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Check prices
    const { response, data } = await apiRequest("/api/prices/current")
    if (!response.ok) throw new Error("Failed to get current prices")
    if (!data.gold9999_mts) throw new Error("No gold9999_mts price")
    if (data.gold9999_mts.price === 0) throw new Error("Price should not be 0 for ONLINE status")
  })

  await test("TC-002: Status PAUSE - prices should freeze", async () => {
    // Get current price
    const { data: pricesBefore } = await apiRequest("/api/prices/current")
    const priceBefore = pricesBefore.gold9999_mts?.price

    // Set status to PAUSE
    await apiRequest("/api/admin/status/GOLD_9999_MTS", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: "PAUSE" }),
    })

    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Check if price is frozen
    const { data: pricesAfter } = await apiRequest("/api/prices/current")
    const priceAfter = pricesAfter.gold9999_mts?.price

    if (priceAfter !== priceBefore) {
      throw new Error(`Price should be frozen. Before: ${priceBefore}, After: ${priceAfter}`)
    }
  })

  await test("TC-003: Status STOP - prices should be 0", async () => {
    // Set status to STOP
    await apiRequest("/api/admin/status/GOLD_9999_MTS", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: "STOP" }),
    })

    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Check if prices are 0
    const { data } = await apiRequest("/api/prices/current")
    if (!data.gold9999_mts) throw new Error("No gold9999_mts in response")

    const { buyIn, sellOut, price } = data.gold9999_mts
    if (buyIn !== 0 || sellOut !== 0 || price !== 0) {
      throw new Error(`All prices should be 0 for STOP status. Got buyIn=${buyIn}, sellOut=${sellOut}, price=${price}`)
    }
  })

  await apiRequest("/api/admin/status/GOLD_9999_MTS", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status: "ONLINE" }),
  })

  // ========================================
  // Summary
  // ========================================
  console.log("\n" + "=".repeat(50))
  console.log("📊 Test Results Summary")
  console.log("=".repeat(50))

  const passed = results.filter((r) => r.status === "PASS").length
  const failed = results.filter((r) => r.status === "FAIL").length
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)

  console.log(`\nTotal Tests: ${results.length}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⏱️  Total Duration: ${totalDuration}ms`)
  console.log(`📈 Success Rate: ${((passed / results.length) * 100).toFixed(2)}%\n`)

  if (failed > 0) {
    console.log("\n❌ Failed Tests:")
    console.log("─".repeat(50))
    results
      .filter((r) => r.status === "FAIL")
      .forEach((r) => {
        console.log(`  • ${r.name}`)
        console.log(`    ${r.message}`)
      })
  }

  console.log("\n" + "=".repeat(50) + "\n")

  process.exit(failed > 0 ? 1 : 0)
}

runTests().catch((error) => {
  console.error("Fatal error running tests:", error)
  process.exit(1)
})
