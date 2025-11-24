# Real-Time Gold Trading System

ระบบซื้อขายทองคำแบบเรียลไทม์ที่รองรับการซื้อขายทองหลายประเภท

## Features

- 🔐 User Authentication (Login/Register)
- 💰 Wallet System (Deposit/Withdraw)
- 📊 Real-Time Price Display
- 📈 Interactive Charts
- ⚡ WebSocket for Live Updates
- 🎯 Status Control (Online/Pause/Stop)
- 💱 Multi-Gold Type Trading (Spot, 99.99%, 96.5%)
- 🚀 Concurrent Transaction Support (100+)

## Tech Stack

- **Frontend**: React, Next.js 16
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Real-Time**: Socket.IO
- **Charts**: Recharts

## Setup Instructions

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Setup Environment Variables
\`\`\`bash
cp .env.example .env
# Edit .env with your configuration
\`\`\`

### 3. Setup Database
\`\`\`bash
npm run setup-db
\`\`\`

### 4. Start Backend Server
\`\`\`bash
npm run server:dev
\`\`\`

### 5. Start Frontend (in another terminal)
\`\`\`bash
npm run dev
\`\`\`

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user

### Wallet
- GET `/api/wallet` - Get wallet balance
- POST `/api/wallet/deposit` - Deposit money
- POST `/api/wallet/withdraw` - Withdraw money

### Prices
- GET `/api/prices/current` - Get current prices
- GET `/api/prices/history/:goldType` - Get price history for charts

### Status
- GET `/api/status` - Get all gold statuses
- PUT `/api/status/:goldType` - Update gold status (ONLINE/PAUSE/STOP)

### Trading
- POST `/api/trading/execute` - Execute single trade
- POST `/api/trading/execute-bulk` - Execute multiple trades
- GET `/api/trading/history` - Get transaction history

## WebSocket Events

- `connection` - Client connects
- `priceUpdate` - Real-time price updates
- `disconnect` - Client disconnects

## Gold Types

- `SPOT` - Gold Spot (XAU/USD)
- `GOLD_9999` - Thai Gold 99.99%
- `GOLD_965` - Thai Gold 96.5% (MTS)
- `GOLD_965_ASSO` - Thai Gold 96.5% (Association)

## Test Cases

✅ TC-001: Concurrent Access (100+ users)
✅ TC-002: Transaction Stability (100+ transactions)
✅ TC-003: Price Status Control
✅ TC-004: Real-Time Display

## Database Collections

- `users` - User accounts
- `wallets` - User wallets and balances
- `transactions` - Trade transactions
- `gold_prices` - Current gold prices
- `gold_status` - Gold type statuses
- `price_history` - Historical price data for charts
