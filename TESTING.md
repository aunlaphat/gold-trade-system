# Testing Guide - Gold Trading System

This document provides comprehensive testing instructions for the Real-Time Gold Trading System.

## Prerequisites

Before running tests, ensure:

1. **MongoDB is running**
   \`\`\`bash
   # Start MongoDB locally
   mongod --dbpath /path/to/data
   mongod --dbpath "C:\data\db"

   \`\`\`

2. **Database is initialized**
   \`\`\`bash
   npm run setup-db
   \`\`\`

3. **Backend server is running**
   \`\`\`bash
   npm run server:dev
   \`\`\`

## Test Cases Overview

### TC-001: Concurrent Access Test
**Requirement**: System must support 100+ concurrent users

**What it tests**:
- Multiple users can register/login simultaneously
- API endpoints handle concurrent requests
- Database connection pooling works correctly
- Response times remain acceptable under load

**How to run**:
\`\`\`bash
# Default: 100 users
npm run test:concurrent

# Custom user count
node scripts/test-concurrent-access.js 150
\`\`\`

**Success Criteria**: 
- 95% or more users successfully access the system
- Average response time < 5000ms

---

### TC-002: Transaction Stability Test
**Requirement**: Handle 100+ concurrent Gold 99.99% transactions

**What it tests**:
- Concurrent buy/sell operations
- Wallet balance updates are atomic
- Transaction integrity under load
- Database write performance

**How to run**:
\`\`\`bash
# Default: 100 transactions
npm run test:transactions

# Custom transaction count
node scripts/test-transaction-stability.js 200
\`\`\`

**Success Criteria**:
- 95% or more transactions complete successfully
- No race conditions or data inconsistencies
- Average response time < 3000ms

---

### TC-003: Price Status Control Test
**Requirement**: Status controls (ONLINE, PAUSE, STOP) work correctly

**What it tests**:
- Each gold type can be controlled independently
- ONLINE: Normal operation with live prices
- PAUSE: Prices freeze but remain visible
- STOP: All prices set to 0

**How to run**:
\`\`\`bash
npm run test:status
\`\`\`

**Success Criteria**:
- All status changes execute successfully
- STOP status correctly sets prices to 0
- Status updates are reflected in API responses

---

### TC-004: Real-Time Display Test
**Requirement**: Prices update in real-time via WebSocket

**What it tests**:
- WebSocket connection stability
- Real-time price updates are received
- Update frequency matches server configuration
- No dropped updates

**How to run**:
\`\`\`bash
# Default: 30 seconds
npm run test:realtime

# Custom duration (in milliseconds)
node scripts/test-realtime-display.js 60000
\`\`\`

**Success Criteria**:
- WebSocket connects successfully
- Receives at least 1 price update
- Updates contain all expected gold types

---

## Running All Tests

Execute the complete test suite:

\`\`\`bash
npm run test:all
\`\`\`

This will run all four test cases sequentially and generate a comprehensive report.

**Expected Output**:
\`\`\`
================================================================================
GOLD TRADING SYSTEM - COMPREHENSIVE TEST SUITE
================================================================================

TC-001: Concurrent Access ✅ PASS
TC-002: Transaction Stability ✅ PASS
TC-003: Price Status Control ✅ PASS
TC-004: Real-Time Display ✅ PASS

OVERALL STATUS: ✅ ALL TESTS PASSED
================================================================================
\`\`\`

## Web-Based Testing

Access the visual test interface:

1. Start the frontend:
   \`\`\`bash
   npm run dev
   \`\`\`

2. Navigate to: `http://localhost:3000/test`

3. Click "Run All Tests" or run individual tests

## Manual Testing Checklist

### User Authentication
- [ ] Register new user
- [ ] Login with existing user
- [ ] Invalid credentials rejected
- [ ] JWT token persists across sessions

### Wallet Operations
- [ ] Deposit money
- [ ] Withdraw money
- [ ] Insufficient balance prevents withdrawal
- [ ] Balance updates in real-time

### Trading Operations
- [ ] Buy gold (each type)
- [ ] Sell gold (each type)
- [ ] Insufficient funds prevents buy
- [ ] Insufficient holdings prevents sell
- [ ] Transaction history updates

### Price Display
- [ ] Prices display for all gold types
- [ ] Prices update in real-time
- [ ] Price change animations work
- [ ] Charts load and display correctly

### Status Control (Admin)
- [ ] Navigate to `/admin`
- [ ] Change status to ONLINE
- [ ] Change status to PAUSE
- [ ] Change status to STOP (verify prices = 0)
- [ ] Status changes reflect immediately

## Performance Benchmarks

### Expected Performance Metrics

| Metric | Target | Measured |
|--------|--------|----------|
| Concurrent Users | 100+ | ___ |
| Concurrent Transactions | 100+ | ___ |
| API Response Time | < 500ms | ___ |
| WebSocket Latency | < 100ms | ___ |
| Price Update Interval | 5s | ___ |

## Troubleshooting

### MongoDB Connection Errors
\`\`\`bash
# Check if MongoDB is running
ps aux | grep mongod

# Restart MongoDB
sudo systemctl restart mongod
\`\`\`

### Port Already in Use
\`\`\`bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
\`\`\`

### WebSocket Connection Failed
- Ensure backend server is running
- Check CORS settings in server/server.js
- Verify NEXT_PUBLIC_API_URL in .env.local

### Test Failures
- Check server logs for errors
- Verify database is initialized
- Ensure sufficient system resources
- Try reducing concurrent load

## Continuous Integration

To integrate tests into CI/CD pipeline:

\`\`\`yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:7.0
        ports:
          - 27017:27017
    
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '20'
      
      - run: npm install
      - run: npm run setup-db
      - run: npm run server &
      - run: sleep 5
      - run: npm run test:all
\`\`\`

## Load Testing

For stress testing beyond 100+ concurrent operations:

\`\`\`bash
# Test with 500 users
node scripts/test-concurrent-access.js 500

# Test with 1000 transactions
node scripts/test-transaction-stability.js 1000
\`\`\`

Monitor system resources during load tests:
- CPU usage
- Memory consumption
- Database connections
- Response times

## Test Data Cleanup

After testing, clean up test data:

\`\`\`javascript
// Connect to MongoDB
use gold_trading_system;

// Remove test users
db.users.deleteMany({ email: /test/ });

// Remove test wallets
db.wallets.deleteMany({ userId: { $in: testUserIds } });

// Remove test transactions
db.transactions.deleteMany({ userId: { $in: testUserIds } });
\`\`\`

## Support

If tests fail or you encounter issues:
1. Check server logs: Look for error messages
2. Verify prerequisites: MongoDB, Node.js versions
3. Review configuration: .env files, connection strings
4. Contact support: Open an issue with test output
