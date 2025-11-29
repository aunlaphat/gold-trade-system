# โครงสร้างโปรเจค Gold Trading System

## 📊 ภาพรวมระบบ

ระบบแบ่งเป็น 3 ส่วนหลัก:
1. **Frontend** - Next.js 16 + React 19 (App Router)
2. **Backend** - Node.js + Express + Socket.IO
3. **Database** - MongoDB

┌─────────────────────────────────────────────────────────┐
│                     Client (Browser)                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │   Next.js Frontend (Port 3000)                   │  │
│  │   - React Components                             │  │
│  │   - Real-time Charts                             │  │
│  │   - WebSocket Client                            │  │
│  └──────────────┬──────────────────┬────────────────┘  │
└─────────────────┼──────────────────┼────────────────────┘
                  │ HTTP/REST        │ WebSocket
                  │                  │
┌─────────────────┴──────────────────┴──────────────────── ┐
│             Express Server (Port 5000)                   │
│  ┌─────────────────────────────────────────────────┐     │
│  │  REST API Routes                                 │    │
│  │  - /api/auth       (Login, Register)            │     │
│  │  - /api/wallet     (Deposit, Withdraw, Exchange)│     │
│  │  - /api/trading    (Buy, Sell, History)         │     │
│  │  - /api/prices     (Current, History)           │     │
│  │  - /api/admin      (Status Control)             │     │
│  └─────────────────────────────────────────────────┘     │
│  ┌─────────────────────────────────────────────────┐     │
│  │  Socket.IO Server                                │    │
│  │  - Price Updates (Real-time)                     │    │
│  │  - Status Updates (Real-time)                    │    │
│  └─────────────────────────────────────────────────┘     │
│  ┌─────────────────────────────────────────────────┐     │
│  │  Services                                        │    │
│  │  - goldPriceService (Fetch & Broadcast)         │     │
│  │  - goldStatusService (Status Management)        │     │
│  │  - exchangeRateService (Currency Exchange)      │     │
│  └─────────────────────────────────────────────────┘     │
└────────────────────────┬─────────────────────────────────┘
                         │ MongoDB Driver
┌────────────────────────┴─────────────────────────────────┐
│                MongoDB Database                          │
│  - users                (ผู้ใช้งาน)                     │
│  - wallets              (กระเป๋าเงิน)                   │
│  - transactions         (ประวัติการซื้อขาย)             │
│  - gold_statuses        (สถานะการเทรด)                  │
│  - gold_price_history   (ประวัติราคา)                   │
└──────────────────────────────────────────────────────────┘

## 📂 Frontend Structure (app/)

app/
├── api/                    # Next.js API Routes (Proxy ไป Backend)
│   ├── admin/
│   │   └── status/
│   │       └── route.ts    # Admin status management
│   ├── auth/
│   │   ├── login/
│   │   │   └── route.ts    # Login endpoint
│   │   └── register/
│   │       └── route.ts    # Register endpoint
│   ├── prices/
│   │   ├── current/
│   │   │   └── route.ts    # Get current prices
│   │   └── history/
│   │       └── [goldType]/
│   │           └── route.ts # Get price history
│   ├── trading/
│   │   ├── execute/
│   │   │   └── route.ts    # Execute trades
│   │   └── history/
│   │       └── route.ts    # Transaction history
│   └── wallet/
│       ├── deposit/
│       │   └── route.ts    # Deposit money
│       ├── withdraw/
│       │   └── route.ts    # Withdraw money
│       └── route.ts        # Get wallet info
│
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx         # ฟอร์มเข้าสู่ระบบ
│   │   └── RegisterForm.tsx      # ฟอร์มสมัครสมาชิก
│   ├── layout/
│   │   └── Navbar.tsx            # Navigation bar
│   ├── trading/
│   │   ├── GoldChart.tsx         # กราฟหลัก (6 charts)
│   │   ├── MiniGoldChart.tsx     # กราฟขนาดเล็ก + Tab เลือกเวลา
│   │   ├── PriceCard.tsx         # การ์ดแสดงราคา
│   │   └── TradePanel.tsx        # Panel ซื้อ/ขาย
│   ├── transactions/
│   │   └── TransactionList.tsx   # รายการธุรกรรม
│   ├── wallet/
│   │   ├── WalletCard.tsx        # การ์ดกระเป๋าเงิน (แสดง Balance, P/L)
│   │   ├── GoldHoldingsCard.tsx  # การ์ดแสดงทองที่ถือ
│   │   ├── DepositDialog.tsx     # Dialog ฝากเงิน
│   │   ├── WithdrawDialog.tsx    # Dialog ถอนเงิน
│   │   └── ExchangeDialog.tsx    # Dialog แลกเปลี่ยนสกุลเงิน
│   └── ui/                       # Shadcn UI Components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       └── ... (40+ components)
│
├── contexts/
│   └── AuthContext.tsx           # Authentication context
│
├── hooks/
│   ├── use-mobile.ts            # Hook สำหรับ responsive
│   └── use-toast.ts             # Hook สำหรับ toast notifications
│
├── lib/
│   ├── api-client.ts            # API client class (fetch wrapper)
│   ├── utils.ts                 # Utility functions
│   └── websocket.ts             # WebSocket client setup
│
├── pages/
│   ├── AdminPage.tsx            # หน้า Admin dashboard
│   ├── LoginPage.tsx            # หน้า Login
│   ├── MainDashboard.tsx        # หน้า User dashboard หลัก
│   ├── WalletPage.tsx           # หน้า Wallet
│   ├── CardPage.tsx             # หน้า Cards view
│   ├── ChartPage.tsx            # หน้า Charts view
│   └── TransactionPage.tsx      # หน้า Transactions
│
├── globals.css                  # Global CSS + Tailwind config
├── layout.tsx                   # Root layout (Providers, Fonts)
└── page.tsx                     # Home page (Route logic)

## 🔧 Backend Structure (server/)

server/
├── config/
│   └── database.js              # MongoDB connection setup
│
├── middleware/
│   └── auth.js                  # JWT authentication middleware
│
├── models/                      # MongoDB Models (Data Layer)
│   ├── User.js                  # User schema & methods
│   │   - create()              # สร้างผู้ใช้ใหม่ + Wallet
│   │   - findByEmail()
│   │   - findById()
│   │   - verifyPassword()
│   │
│   ├── Transaction.js           # Transaction schema & methods
│   │   - create()              # สร้าง transaction
│   │   - findByUserId()
│   │   - updateStatus()
│   │   - createBulk()          # Bulk insert
│   │
│   ├── GoldPrice.js             # Gold price schema
│   │   - create()
│   │   - findLatest()
│   │   - findByTimeRange()
│   │
│   └── GoldStatus.js            # Gold status schema
│       - getStatus()           # ดูสถานะ
│       - updateStatus()        # อัพเดทสถานะ
│       - getAllStatuses()
│
├── routes/                      # Express Route Handlers
│   ├── auth.js                  # POST /login, /register
│   ├── wallet.js                # GET, POST /wallet
│   ├── trading.js               # POST /execute, GET /history
│   ├── prices.js                # GET /current, /history/:goldType
│   ├── admin.js                 # GET, PUT /status/:goldType
│   └── status.js                # WebSocket status updates
│
├── services/                    # Business Logic Layer
│   ├── goldPriceService.js      # Price fetching & broadcasting
│   │   - fetchMTSPrices()      # Fetch from MTS API
│   │   - fetchChartData()      # Fetch from TradingView
│   │   - updatePrices()        # Update & save to DB
│   │   - startPriceUpdates()   # Start interval (60s)
│   │   - subscribe()           # Subscribe to price updates
│   │   - notifySubscribers()   # Broadcast via WebSocket
│   │
│   ├── goldStatusService.js     # Status management
│   │   - initializeStatuses()  # Load all statuses
│   │   - updateAndNotifyStatus() # Update & broadcast
│   │   - subscribe()
│   │
│   └── exchangeRateService.js   # Currency exchange
│       - fetchRates()          # Fetch USD/THB rate
│       - thbToUsd()
│       - usdToThb()
│       - getRates()
│
├── scripts/
│   ├── create-admin.js          # สร้าง admin user
│   └── mongodb-setup.js         # Setup database & collections
│
├── tests/
│   └── run-all-tests.ts         # Unit test runner
│
└── server.js                    # Main server entry point
    - Express app setup
    - Socket.IO setup
    - Route registration
    - Service initialization
    - WebSocket event handlers

## 🔄 Data Flow

### 1. การซื้อ/ขายทอง (Trading Flow)

User clicks "ซื้อ" button
       │
       ├─> TradePanel.tsx
       │    │
       │    ├─> apiClient.executeTrade(goldType, action, amount, currency)
       │    │
       │    └─> POST /api/trading/execute
       │              │
       │              ├─> Backend: server/routes/trading.js
       │              │       │
       │              │       ├─ Check gold status (ONLINE/PAUSE/STOP)
       │              │       ├─ Get current price from goldPriceService
       │              │       ├─ Check balance in wallets collection
       │              │       ├─ Create transaction in transactions collection
       │              │       ├─ Update wallet:
       │              │       │   - Deduct balance
       │              │       │   - Add gold holdings
       │              │       │   - Calculate new averageCost
       │              │       └─ Update transaction status to COMPLETED
       │              │
       │              └─> Response: { success, transaction, wallet }
       │
       └─> Frontend updates:
            - Wallet state
            - Transaction list
            - Toast notification

### 2. การอัพเดทราคาแบบ Real-time (Price Update Flow)

Server Startup
    │
    ├─> goldPriceService.startPriceUpdates()
    │       │
    │       └─> setInterval(60s)
    │               │
    │               └─> goldPriceService.updatePrices()
    │                       │
    │                       ├─ fetchMTSPrices()         (MTS API)
    │                       ├─ fetchChartData(XAUUSD)   (TradingView)
    │                       ├─ fetchChartData(GLD9999)  (TradingView)
    │                       ├─ fetchChartData(GLD965)   (TradingView)
    │                       ├─ fetchChartData(GLDGTA)   (TradingView)
    │                       │
    │                       ├─ Apply status control:
    │                       │   - ONLINE → use new price
    │                       │   - PAUSE  → use last price
    │                       │   - STOP   → set to null
    │                       │
    │                       ├─ Save to gold_price_history collection
    │                       │
    │                       └─> notifySubscribers(prices)
    │                               │
    │                               └─> Socket.IO emits "priceUpdate"
    │                                       │
    │                                       └─> All connected clients receive update
    │                                               │
    │                                               └─> Frontend: app/page.tsx
    │                                                       └─> Updates prices state
    │                                                           └─> Re-renders all price displays


### 3. Authentication Flow

User submits login form
    │
    ├─> LoginForm.tsx
    │       │
    │       └─> AuthContext.login(email, password)
    │               │
    │               └─> apiClient.login(email, password)
    │                       │
    │                       └─> POST /api/auth/login
    │                               │
    │                               └─> Backend: server/routes/auth.js
    │                                       │
    │                                       ├─ Find user by email
    │                                       ├─ Verify password (bcrypt)
    │                                       ├─ Generate JWT token
    │                                       └─ Response: { token, user }
    │                                               │
    │                                               └─> Frontend stores:
    │                                                   - token in localStorage
    │                                                   - user in AuthContext
    │                                                   - user in localStorage
    │                                                       │
    │                                                       └─> Redirect to dashboard


## 🔐 Security Measures

1. **Password Hashing**
   - ใช้ `bcrypt` สำหรับ hash passwords
   - Salt rounds = 10

2. **JWT Authentication**
   - Token expires in 24 hours
   - Stored in localStorage (client)
   - Sent via Authorization header

3. **Middleware Protection**
   - `authMiddleware` ตรวจสอบ JWT token
   - Protected routes require valid token

4. **Input Validation**
   - ตรวจสอบ required fields
   - Validate data types และ ranges
   - Sanitize user inputs

## 📊 Database Schema Details
### Wallet Balance Calculation

**การคำนวณ**ต้นทุนเฉลี่ย (Average Cost):**
เมื่อซื้อ
- currentHoldings = wallet.goldHoldings[goldType] || 0
- currentAverageCost = wallet.averageCosts[goldType] || 0
- newHoldings = currentHoldings + buyAmount
- newAverageCost = (currentAverageCost * currentHoldings + buyPrice * buyAmount) / newHoldings

- ตัวอย่าง:
- มีทอง 10g @ 1000 THB/g (ต้นทุน 10,000 THB)
- ซื้อเพิ่ม 5g @ 1200 THB/g (ต้นทุน 6,000 THB)
- ต้นทุนเฉลี่ยใหม่ = (10,000 + 6,000) / 15 = 1,066.67 THB/g

**การคำนวณกำไร/ขาดทุน (P/L):**
ใช้ sellOut price เป็นตลาดปัจจุบัน
- currentMarketPrice = prices[goldType].sellOut
- averageCost = wallet.averageCosts[goldType]
- holdings = wallet.goldHoldings[goldType]

- profitOrLoss = (currentMarketPrice - averageCost) * holdings
- profitOrLossPercent = ((currentMarketPrice - averageCost) / averageCost) * 100

- ตัวอย่าง:
- ต้นทุนเฉลี่ย: 1,066.67 THB/g
- ราคาตลาด: 1,150 THB/g
- ถือ: 15g
- P/L = (1,150 - 1,066.67) * 15 = 1,250 THB (+7.81%)

## 🎯 Key Features Implementation

### 1. Real-time Price Updates
- goldPriceService ดึงราคาทุก 60 วินาที
- ส่งผ่าน WebSocket ไปยัง clients ทันที
- Frontend subscribe และอัพเดท UI automatically

### 2. Status Control (ONLINE/PAUSE/STOP)
- Admin เปลี่ยน status ผ่าน admin dashboard
- Backend ตรวจสอบ status ก่อนทุก trade
- Price service ควบคุมราคาตาม status

### 3. Multi-Currency Support
- Wallet รองรับ THB และ USD
- ทองแต่ละประเภทใช้สกุลเงินหลักต่างกัน
- มี exchange rate service สำหรับแปลงสกุลเงิน

### 4. Chart with Multiple Timeframes
- MiniGoldChart รองรับ 6 timeframes: 1m, 5m, 30m, 1h, 1d, 1w
- ดึงข้อมูลจาก gold_price_history collection
- แสดงผลด้วย Chart.js + chartjs-adapter-date-fns

## 🚀 Performance Optimization

1. **Database Indexing**
   - `userId` index on wallets
   - `userId` + `createdAt` compound index on transactions
   - `goldType` index on gold_statuses

2. **WebSocket vs Polling**
   - ใช้ WebSocket แทน HTTP polling
   - ลด network traffic และ server load

3. **React Optimization**
   - useCallback และ useMemo สำหรับ expensive operations
   - Component memoization ด้วย React.memo

4. **MongoDB Connection Pooling**
   - Reuse connections แทนการสร้างใหม่ทุกครั้ง
