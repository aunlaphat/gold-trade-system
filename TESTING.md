# คู่มือการทดสอบระบบ Gold Trading System

## ภาพรวมการทดสอบ

ระบบมี **2 ประเภทหลัก** ของการทดสอบ:
1. **API Tests** - ทดสอบ API Endpoints ทุกตัว (28 test cases)
2. **Performance Tests** - ทดสอบ 4 เคสสำคัญตาม Requirements

---

## เตรียมความพร้อมก่อนทดสอบ

### 1. เริ่มต้น Backend Server

\`\`\`bash
# Terminal 1: Start Backend
npm run server

# หรือใช้ dev mode (auto-reload)
npm run server:dev
\`\`\`

รอจนเห็นข้อความ:
\`\`\`
🚀 Gold Trading System Backend
📊 Server running on port 5000
✅ MongoDB Connected
✅ WebSocket server initialized
\`\`\`

### 2. ตรวจสอบ Environment Variables

สร้างไฟล์ `.env` ในโฟลเดอร์ `server/`:

\`\`\`env
# Database
MONGODB_URI=mongodb://localhost:27017
DB_NAME=gold_trading_system

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# API (สำหรับทดสอบ)
API_URL=http://localhost:5000
\`\`\`

### 3. Setup Database (ครั้งแรกเท่านั้น)

\`\`\`bash
npm run setup-db
\`\`\`

---

## วิธีการทดสอบ

### ✅ วิธีที่ 1: ทดสอบทั้งหมดด้วยคำสั่งเดียว (แนะนำ)

#### A. ทดสอบ API ทั้งหมด (28 test cases)

\`\`\`bash
npm run test:api
\`\`\`

**ทดสอบอะไรบ้าง:**
- Authentication (Register, Login)
- Wallet Operations (Deposit, Withdraw, Exchange)
- Trading (Buy, Sell, History)
- Prices (Current, History)
- Admin (Status Control)

**ผลลัพธ์ที่คาดหวัง:**
\`\`\`
✅ Register - should create new user
✅ Login - should authenticate user
✅ Deposit - should add THB to wallet
✅ Buy Gold - should execute buy order
✅ Sell Gold - should execute sell order
...
📊 Test Results Summary
Total Tests: 28
✅ Passed: 28
❌ Failed: 0
📈 Success Rate: 100%
\`\`\`

---

#### B. ทดสอบ 4 เคสสำคัญตาม Requirements

\`\`\`bash
npm run test:all
\`\`\`

**ทดสอบอะไรบ้าง:**
1. **TC-001: Concurrent Access** - ระบบรองรับ 100+ users พร้อมกัน
2. **TC-002: Transaction Stability** - ระบบประมวลผล 100+ transactions พร้อมกัน
3. **TC-003: Status Control** - ควบคุมสถานะ ONLINE/PAUSE/STOP
4. **TC-004: Real-Time Display** - แสดงราคา real-time ผ่าน WebSocket

**ระยะเวลา:** ประมาณ 2-3 นาที

**ผลลัพธ์ที่คาดหวัง:**
\`\`\`
✅ TC-001 - Concurrent Access: PASS
  Success Rate: 100%
  Avg Response Time: 250ms

✅ TC-002 - Transaction Stability: PASS
  Success Rate: 100%
  Throughput: 45 tx/s

✅ TC-003 - Price Status Control: PASS
  All status changes working correctly

✅ TC-004 - Real-Time Display: PASS
  Updates Received: 30+
  Avg Latency: 50ms

OVERALL STATUS: ✅ ALL TESTS PASSED
\`\`\`

---

### ✅ วิธีที่ 2: ทดสอบแต่ละเคสแยกกัน

#### TC-001: Concurrent Access Test

ทดสอบระบบรองรับผู้ใช้พร้อมกันได้กี่คน

\`\`\`bash
# ทดสอบ 100 users (default)
npm run test:concurrent

# ทดสอบ 500 users
npm run test:concurrent -- 500

# ทดสอบ 1000 users
npm run test:concurrent -- 1000
\`\`\`

**ตัวชี้วัด:**
- ✅ Success Rate ≥ 95%
- ✅ Average Response Time < 1000ms
- ✅ No server crashes

---

#### TC-002: Transaction Stability Test

ทดสอบระบบประมวลผลธุรกรรมพร้อมกันได้กี่รายการ

\`\`\`bash
# ทดสอบ 100 transactions (default)
npm run test:transactions

# ทดสอบ 500 transactions
npm run test:transactions -- 500

# ทดสอบ 1000 transactions
npm run test:transactions -- 1000
\`\`\`

**ตัวชี้วัด:**
- ✅ Success Rate ≥ 95%
- ✅ Throughput ≥ 30 tx/s
- ✅ No data inconsistency

---

#### TC-003: Status Control Test

ทดสอบการควบคุมสถานะ ONLINE/PAUSE/STOP

\`\`\`bash
npm run test:status
\`\`\`

**ทดสอบอะไร:**
- ✅ ONLINE: ราคาอัปเดตปกติ
- ✅ PAUSE: ราคา freeze ไม่เปลี่ยน
- ✅ STOP: ราคาเป็น 0

---

#### TC-004: Real-Time Display Test

ทดสอบ WebSocket real-time updates

\`\`\`bash
# ทดสอบ 30 วินาที (default)
npm run test:realtime

# ทดสอบ 60 วินาที
npm run test:realtime -- 60000
\`\`\`

**ตัวชี้วัด:**
- ✅ Receive ≥ 30 updates
- ✅ Average latency < 100ms
- ✅ No connection drops

---

## การทดสอบแบบละเอียด (Advanced)

### ทดสอบด้วยจำนวนที่กำหนดเอง

\`\`\`bash
# Concurrent Access: 1000 users
npm run test:concurrent -- 1000

# Transaction Stability: 2000 transactions
npm run test:transactions -- 2000

# Real-Time Display: ทดสอบ 2 นาที (120000ms)
npm run test:realtime -- 120000
\`\`\`

---

## การแปลผลการทดสอบ

### สถานะความสำเร็จ

| สัญลักษณ์ | ความหมาย |
|---------|---------|
| ✅ PASS | ผ่านการทดสอบ |
| ❌ FAIL | ไม่ผ่านการทดสอบ |
| ⚠️ WARNING | ผ่านแต่มีข้อควรระวัง |

### เกณฑ์การผ่าน

#### API Tests
- ✅ Pass: 100% (28/28 tests)
- ❌ Fail: < 100%

#### TC-001: Concurrent Access
- ✅ Pass: Success Rate ≥ 95%
- ❌ Fail: Success Rate < 95%

#### TC-002: Transaction Stability
- ✅ Pass: Success Rate ≥ 95% AND Throughput ≥ 30 tx/s
- ❌ Fail: ไม่ผ่านเกณฑ์ใดเกณฑ์หนึ่ง

#### TC-003: Status Control
- ✅ Pass: ทุกสถานะทำงานถูกต้อง
- ❌ Fail: สถานะใดสถานะหนึ่งไม่ทำงาน

#### TC-004: Real-Time Display
- ✅ Pass: Updates ≥ 30 AND Latency < 100ms
- ❌ Fail: ไม่ผ่านเกณฑ์ใดเกณฑ์หนึ่ง

---

## แก้ปัญหาที่พบบ่อย

### ปัญหา: Connection Refused (ECONNREFUSED)

**สาเหตุ:** Backend server ไม่ทำงาน

**วิธีแก้:**
\`\`\`bash
# เริ่ม Backend ใหม่
npm run server
\`\`\`

---

### ปัญหา: MongoDB Connection Failed

**สาเหตุ:** MongoDB ไม่ทำงาน

**วิธีแก้:**
\`\`\`bash
# Windows: เริ่ม MongoDB service
net start MongoDB

# Mac/Linux: เริ่ม MongoDB
brew services start mongodb-community

# หรือใช้ Docker
docker run -d -p 27017:27017 mongo
\`\`\`

---

### ปัญหา: Test Timeout

**สาเหตุ:** Backend ช้าหรือมีปัญหา

**วิธีแก้:**
1. ตรวจสอบ Backend logs
2. ลดจำนวนการทดสอบ (เช่น จาก 500 เป็น 100)
3. รีสตาร์ท Backend

---

### ปัญหา: WebSocket Connection Failed (TC-004)

**สาเหตุ:** WebSocket server ไม่ทำงาน

**วิธีแก้:**
1. ตรวจสอบว่า Backend เริ่มต้นด้วย WebSocket enabled
2. ตรวจสอบ port 5000 ไม่ถูกใช้โดยโปรแกรมอื่น

---

## สรุป

### ทดสอบทั้งหมดด้วยคำสั่งเดียว

\`\`\`bash
# 1. เริ่ม Backend
npm run server

# 2. ทดสอบ API ทั้งหมด (ในหน้าต่างใหม่)
npm run test:api

# 3. ทดสอบ 4 เคสสำคัญ
npm run test:all
\`\`\`

### ไม่ต้องรันแบบนี้อีกต่อไป ❌

\`\`\`bash
# ❌ เดิม: รันแบบละเอียด
node server/tests/test-concurrent-access.ts 500
node server/tests/test-transaction-stability.ts 1000

# ✅ ใหม่: รันง่ายขึ้น
npm run test:concurrent -- 500
npm run test:transactions -- 1000
\`\`\`

---

**หมายเหตุ:** การทดสอบทั้งหมดจะสร้าง test users และข้อมูลทดสอบในฐานข้อมูล หากต้องการล้างข้อมูล ให้รัน `npm run setup-db` ใหม่
