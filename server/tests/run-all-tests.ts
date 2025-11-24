/**
 * Master Test Runner
 * Runs all test cases and generates a comprehensive report
 */

import { runConcurrentAccessTest } from "./test-concurrent-access.js"
import { runTransactionStabilityTest } from "./test-transaction-stability.js"
import { runStatusControlTest } from "./test-status-control.js"
import { runRealtimeDisplayTest } from "./test-realtime-display.js"

interface TestSuite {
  id: string
  name: string
  description: string
  testFn: () => Promise<any>
}

const testSuites: TestSuite[] = [
  {
    id: "TC-001",
    name: "Concurrent Access",
    description: "Test system with 100+ concurrent users",
    testFn: () => runConcurrentAccessTest(100),
  },
  {
    id: "TC-002",
    name: "Transaction Stability",
    description: "Test 100+ concurrent Gold 99.99% transactions",
    testFn: () => runTransactionStabilityTest(100),
  },
  {
    id: "TC-003",
    name: "Price Status Control",
    description: "Test ONLINE/PAUSE/STOP status controls",
    testFn: () => runStatusControlTest(),
  },
  {
    id: "TC-004",
    name: "Real-Time Display",
    description: "Test real-time price updates via WebSocket",
    testFn: () => runRealtimeDisplayTest(30000),
  },
]

async function runAllTests() {
  console.log("\n" + "=".repeat(80))
  console.log("GOLD TRADING SYSTEM - COMPREHENSIVE TEST SUITE")
  console.log("=".repeat(80))
  console.log(`Start Time: ${new Date().toISOString()}`)
  console.log("=".repeat(80))

  const results: Array<{
    id: string
    name: string
    passed: boolean
    result: any
    duration: number
    error?: string
  }> = []

  for (const suite of testSuites) {
    console.log(`\n\n${"*".repeat(80)}`)
    console.log(`RUNNING: ${suite.id} - ${suite.name}`)
    console.log(`Description: ${suite.description}`)
    console.log("*".repeat(80))

    const startTime = Date.now()

    try {
      const result = await suite.testFn()
      const duration = Date.now() - startTime

      results.push({
        id: suite.id,
        name: suite.name,
        passed: result.passed !== false,
        result,
        duration,
      })
    } catch (error: any) {
      const duration = Date.now() - startTime

      results.push({
        id: suite.id,
        name: suite.name,
        passed: false,
        result: null,
        duration,
        error: error.message,
      })

      console.error(`\n❌ Test failed with error: ${error.message}`)
    }

    // Wait between tests
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  // Generate final report
  console.log("\n\n" + "=".repeat(80))
  console.log("FINAL TEST REPORT")
  console.log("=".repeat(80))
  console.log(`End Time: ${new Date().toISOString()}`)
  console.log("=".repeat(80))

  const passedCount = results.filter((r) => r.passed).length
  const failedCount = results.filter((r) => !r.passed).length
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)

  console.log("\nTest Summary:")
  console.log(`  Total Tests: ${results.length}`)
  console.log(`  Passed: ${passedCount} ✅`)
  console.log(`  Failed: ${failedCount} ❌`)
  console.log(`  Success Rate: ${((passedCount / results.length) * 100).toFixed(2)}%`)
  console.log(`  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`)

  console.log("\nDetailed Results:")
  results.forEach((result) => {
    const status = result.passed ? "✅ PASS" : "❌ FAIL"
    console.log(`\n  ${result.id} - ${result.name}: ${status}`)
    console.log(`    Duration: ${(result.duration / 1000).toFixed(2)}s`)

    if (result.error) {
      console.log(`    Error: ${result.error}`)
    }

    if (result.result) {
      if (result.result.successRate !== undefined) {
        console.log(`    Success Rate: ${result.result.successRate.toFixed(2)}%`)
      }
      if (result.result.avgResponseTime !== undefined) {
        console.log(`    Avg Response Time: ${result.result.avgResponseTime.toFixed(2)}ms`)
      }
      if (result.result.throughput !== undefined) {
        console.log(`    Throughput: ${result.result.throughput.toFixed(2)} tx/s`)
      }
      if (result.result.updateCount !== undefined) {
        console.log(`    Updates Received: ${result.result.updateCount}`)
      }
    }
  })

  console.log("\n" + "=".repeat(80))
  console.log(`OVERALL STATUS: ${passedCount === results.length ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED"}`)
  console.log("=".repeat(80))

  return {
    passed: passedCount === results.length,
    results,
    summary: {
      total: results.length,
      passed: passedCount,
      failed: failedCount,
      successRate: (passedCount / results.length) * 100,
      duration: totalDuration,
    },
  }
}

// Run all tests if executed directly
if (process.argv[1].endsWith("run-all-tests.ts")) {
  runAllTests()
    .then((report) => {
      process.exit(report.passed ? 0 : 1)
    })
    .catch((err) => {
      console.error("Test suite failed:", err)
      process.exit(1)
    })
}

export { runAllTests }
