# Gold Trading System

ระบบเทรดทองคำแบบเรียลไทม์ พัฒนาด้วย Next.js, Node.js, และ MongoDB

## 📋 สารบัญ

- [คุณสมบัติหลัก](#คุณสมบัติหลัก)
- [เทคโนโลยีที่ใช้](#เทคโนโลยีที่ใช้)
- [โครงสร้างโปรเจค](#โครงสร้างโปรเจค)
- [โครงสร้างฐานข้อมูล](#โครงสร้างฐานข้อมูล)
- [การติดตั้ง](#การติดตั้ง)
- [การใช้งาน](#การใช้งาน)
- [API Endpoints](#api-endpoints)
- [การทดสอบ](#การทดสอบ)

## 🚀 คุณสมบัติหลัก

- 📊 ราคาทองคำแบบเรียลไทม์จาก MTS และ TradingView
- 💰 ระบบกระเป๋าเงินรองรับ THB และ USD
- 📈 กราฟแสดงประวัติราคาทองคำแบบหลายช่วงเวลา (1m, 5m, 30m, 1h, 1d, 1w)
- 🔄 การซื้อ-ขายทองคำแบบเรียลไทม์
- 👤 ระบบผู้ใช้งาน (User) และผู้ดูแลระบบ (Admin)
- 🎛️ Admin สามารถควบคุมสถานะการเทรด (Online/Pause/Stop)
- 💱 แลกเปลี่ยนสกุลเงิน THB ⇄ USD
- 📱 รองรับ Dark/Light Mode
- 🔐 ระบบ Authentication ด้วย JWT

## 🛠️ เทคโนโลยีที่ใช้

### Frontend
- **Next.js 16** (App Router)
- **React 19.2**
- **TypeScript**
- **Tailwind CSS v4**
- **Chart.js** (สำหรับกราฟ)
- **Socket.IO Client** (WebSocket)
- **Shadcn/UI** (UI Components)

### Backend
- **Node.js** + **Express.js**
- **MongoDB** (Database)
- **Socket.IO** (WebSocket Server)
- **JWT** (Authentication)
- **Bcrypt** (Password Hashing)

## 📁 โครงสร้างโปรเจค

\`\`\`
gold-trading-system/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (Next.js)
│   │   ├── admin/               # Admin endpoints
│   │   ├── auth/                # Authentication
│   │   ├── prices/              # Price data
│   │   ├── trading/             # Trading operations
│   │   └── wallet/              # Wallet operations
│   ├── components/              # React Components
│   │   ├── auth/               # Login, Register
│   │   ├── layout/             # Navbar, Layout
│   │   ├── trading/            # TradePanel, Charts
│   │   ├── transactions/       # Transaction history
│   │   ├── wallet/             # Wallet cards, dialogs
│   │   └── ui/                 # Reusable UI components
│   ├── contexts/               # React Contexts
│   │   └── AuthContext.tsx    # Authentication context
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility libraries
│   │   ├── api-client.ts      # API client
│   │   ├── utils.ts           # Helper functions
│   │   └── websocket.ts       # WebSocket client
│   ├── pages/                  # Page components
│   │   ├── AdminPage.tsx      # Admin dashboard
│   │   ├── LoginPage.tsx      # Login page
│   │   └── MainDashboard.tsx  # User dashboard
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Home page
│
├── server/                       # Backend Server
│   ├── config/
│   │   └── database.js         # MongoDB configuration
│   ├── middleware/
│   │   └── auth.js             # JWT middleware
│   ├── models/                 # MongoDB models
│   │   ├── User.js            # User model
│   │   ├── GoldPrice.js       # Gold price model
│   │   ├── GoldStatus.js      # Gold status model
│   │   └── Transaction.js     # Transaction model
│   ├── routes/                 # Express routes
│   │   ├── auth.js            # Authentication routes
│   │   ├── admin.js           # Admin routes
│   │   ├── prices.js          # Price routes
│   │   ├── trading.js         # Trading routes
│   │   ├── wallet.js          # Wallet routes
│   │   └── status.js          # Status routes
│   ├── services/               # Business logic
│   │   ├── goldPriceService.js      # Price updates
│   │   ├── goldStatusService.js     # Status management
│   │   └── exchangeRateService.js   # Currency exchange
│   ├── scripts/
│   │   ├── create-admin.js    # Create admin user
│   │   └── mongodb-setup.js   # Setup database
│   ├── tests/                  # Unit tests
│   │   └── run-all-tests.ts   # Test runner
│   └── server.js              # Main server file
│
├── public/                      # Static files
├── package.json
├── tsconfig.json
├── next.config.mjs
└── README.md
\`\`\`

## 🗄️ โครงสร้างฐานข้อมูล

### Collections

#### 1. **users**
\`\`\`javascript
{
  _id: ObjectId,
  email: String,           // อีเมล (unique)
  username: String,        // ชื่อผู้ใช้ (unique)
  password: String,        // รหัสผ่าน (hashed with bcrypt)
  role: String,            // "user" หรือ "admin"
  isActive: Boolean,       // สถานะการใช้งาน
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

#### 2. **wallets**
\`\`\`javascript
{
  _id: ObjectId,
  userId: ObjectId,        // Reference to users
  balance: {
    THB: Number,          // ยอดเงินบาท
    USD: Number           // ยอดเงินดอลลาร์
  },
  goldHoldings: {
    SPOT: Number,             // ทอง Spot (troy oz)
    GOLD_9999: Number,        // ทอง 99.99% Global
    GOLD_965: Number,         // ทอง 96.5% Global
    GOLD_9999_MTS: Number,    // ทอง 99.99% MTS (กรัม)
    GOLD_965_MTS: Number,     // ทอง 96.5% MTS (กรัม)
    GOLD_965_ASSO: Number     // ทอง 96.5% สมาคม (กรัม)
  },
  averageCosts: {
    SPOT: Number,             // ต้นทุนเฉลี่ยต่อหน่วย (USD)
    GOLD_9999: Number,        // ต้นทุนเฉลี่ยต่อหน่วย (THB)
    GOLD_965: Number,         // ต้นทุนเฉลี่ยต่อหน่วย (THB)
    GOLD_9999_MTS: Number,    // ต้นทุนเฉลี่ยต่อหน่วย (THB)
    GOLD_965_MTS: Number,     // ต้นทุนเฉลี่ยต่อหน่วย (THB)
    GOLD_965_ASSO: Number     // ต้นทุนเฉลี่ยต่อหน่วย (THB)
  },
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

**หมายเหตุ averageCosts:**
- เมื่อ **ซื้อ**: คำนวณต้นทุนเฉลี่ยใหม่ = (ต้นทุนเดิม × จำนวนเก่า + ราคาซื้อ × จำนวนซื้อ) / จำนวนรวม
- เมื่อ **ขาย**: ต้นทุนเฉลี่ยยังคงเดิม (ไม่เปลี่ยนแปลง)
- เมื่อขายหมด: ต้นทุนเฉลี่ยรีเซ็ตเป็น 0

#### 3. **transactions**
\`\`\`javascript
{
  _id: ObjectId,
  userId: ObjectId,        // Reference to users
  goldType: String,        // ประเภททอง (GOLD_9999_MTS, GOLD_965_MTS, etc.)
  action: String,          // "BUY" หรือ "SELL"
  amount: Number,          // จำนวน
  price: Number,           // ราคาต่อหน่วย
  totalCost: Number,       // ราคารวม
  currency: String,        // "THB" หรือ "USD"
  status: String,          // "PENDING", "COMPLETED", "FAILED"
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

#### 4. **gold_statuses**
\`\`\`javascript
{
  _id: ObjectId,
  goldType: String,        // ประเภททอง (unique)
  status: String,          // "ONLINE", "PAUSE", "STOP"
  updatedAt: Date
}
\`\`\`

**ความหมายของ Status:**
- **ONLINE**: เทรดได้ปกติ ราคาอัพเดทแบบเรียลไทม์
- **PAUSE**: หยุดเทรดชั่วคราว ราคาคงที่ไม่เปลี่ยนแปลง
- **STOP**: หยุดเทรดสมบูรณ์ ไม่แสดงราคา (null)

#### 5. **gold_price_history**
\`\`\`javascript
{
  _id: ObjectId,
  ts: Date,               // Timestamp
  payload: {
    timestamp: Number,
    gold965_asso: {
      buyIn: Number,
      sellOut: Number,
      price: Number,
      source: String
    },
    gold9999_mts: { /* ... */ },
    gold965_mts: { /* ... */ },
    spot: { /* ... */ },
    // ... ประเภททองอื่นๆ
  }
}
\`\`\`

## ⚙️ การติดตั้ง

### ข้อกำหนดเบื้องต้น
- Node.js >= 18.x
- MongoDB >= 5.0
- npm หรือ pnpm

### 1. Clone Repository
\`\`\`bash
git clone <repository-url>
cd gold-trading-system
\`\`\`

### 2. ติดตั้ง Dependencies
\`\`\`bash
npm install
# หรือ
pnpm install
\`\`\`

### 3. ติดตั้งและเริ่มต้น MongoDB

**บน macOS (Homebrew):**
\`\`\`bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
\`\`\`

**บน Ubuntu/Linux:**
\`\`\`bash
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
\`\`\`

**บน Windows:**
ดาวน์โหลดและติดตั้งจาก [MongoDB Official](https://www.mongodb.com/try/download/community)

### 4. ตั้งค่า Environment Variables

สร้างไฟล์ `.env.local` ในโฟลเดอร์ root:

\`\`\`env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/gold-trading

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# API URL
NEXT_PUBLIC_API_URL=http://localhost:5000

# Server Port
PORT=5000
\`\`\`

### 5. Setup Database และสร้าง Admin User

\`\`\`bash
# Setup database และ collections
node server/scripts/mongodb-setup.js

# สร้าง admin user (email: admin@example.com, password: admin123)
node server/scripts/create-admin.js
\`\`\`

### 6. เริ่มต้น Development Server

**Terminal 1 - Backend Server:**
\`\`\`bash
cd server
node server.js
\`\`\`

**Terminal 2 - Frontend (Next.js):**
\`\`\`bash
npm run dev
# หรือ
pnpm dev
\`\`\`

เปิดเบราว์เซอร์ที่ [http://localhost:3000](http://localhost:3000)

## 📖 การใช้งาน

### สำหรับ User

1. **ลงทะเบียน/เข้าสู่ระบบ**
   - ไปที่หน้าแรก
   - กรอกอีเมล และรหัสผ่าน

2. **ฝากเงิน**
   - คลิกปุ่ม "ฝาก" ในการ์ดกระเป๋าเงิน
   - ระบุจำนวนเงิน THB
   - ยืนยันการฝาก

3. **ซื้อ/ขายทอง**
   - เลือกประเภททอง (MTS 99.99%, MTS 96.5%, สมาคม 96.5%)
   - เลือก BUY หรือ SELL
   - ระบุจำนวน (กรัม)
   - เลือกสกุลเงินที่ต้องการใช้ (THB/USD)
   - ยืนยันการทำรายการ

4. **แลกเปลี่ยนสกุลเงิน**
   - คลิกปุ่ม "แลกเปลี่ยน"
   - เลือกสกุลเงินต้นทาง (THB/USD)
   - ระบุจำนวน
   - ยืนยันการแลกเปลี่ยน

5. **ดูกราฟ**
   - เลือก tab ช่วงเวลา: 1m, 5m, 30m, 1h, 1d, 1w
   - กราฟจะแสดงการเปลี่ยนแปลงราคาตามช่วงเวลาที่เลือก

### สำหรับ Admin

1. **เข้าสู่ระบบด้วย admin account**
   \`\`\`
   Email: admin@example.com
   Password: admin123
   \`\`\`

2. **ควบคุมสถานะการเทรด**
   - ONLINE: เปิดให้เทรดปกติ
   - PAUSE: หยุดชั่วคราว (ราคาคงที่)
   - STOP: หยุดสมบูรณ์ (ไม่แสดงราคา)

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - ลงทะเบียนผู้ใช้ใหม่
- `POST /api/auth/login` - เข้าสู่ระบบ

### Wallet
- `GET /api/wallet` - ดูข้อมูลกระเป๋าเงิน
- `POST /api/wallet/deposit` - ฝากเงิน
- `POST /api/wallet/withdraw` - ถอนเงิน
- `POST /api/wallet/exchange` - แลกเปลี่ยนสกุลเงิน

### Prices
- `GET /api/prices/current` - ดูราคาปัจจุบัน
- `GET /api/prices/history/:goldType` - ดูประวัติราคา

### Trading
- `POST /api/trading/execute` - ซื้อ/ขายทอง
- `GET /api/trading/history` - ดูประวัติการซื้อขาย
- `POST /api/trading/execute-bulk` - ซื้อขายแบบ bulk (สำหรับทดสอบ)

### Admin
- `GET /api/admin/status` - ดูสถานะทั้งหมด
- `PUT /api/admin/status/:goldType` - อัพเดทสถานะ

## 🧪 การทดสอบ

### รัน Unit Tests

\`\`\`bash
cd server
node tests/run-all-tests.ts
\`\`\`

### Test Cases หลัก

1. **TC-001: Concurrent Access**
   - ทดสอบผู้ใช้หลายคนเข้าใช้งานพร้อมกัน

2. **TC-002: Transaction Stability**
   - ทดสอบ Transaction 100+ รายการพร้อมกัน

3. **TC-003: Price Status Control**
   - ทดสอบการควบคุมสถานะ (Online/Pause/Stop)

4. **TC-004: RealTime Display**
   - ทดสอบการแสดงราคาแบบเรียลไทม์

### Manual Testing

\`\`\`bash
# ทดสอบ API endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
\`\`\`

## 🚀 Production Deployment

### Build สำหรับ Production

\`\`\`bash
npm run build
npm start
\`\`\`

### Environment Variables สำหรับ Production

\`\`\`env
NODE_ENV=production
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/gold-trading
JWT_SECRET=<strong-random-secret>
NEXT_PUBLIC_API_URL=https://your-domain.com
\`\`\`

## 🐛 การแก้ไขปัญหาทั่วไป

### MongoDB Connection Failed
\`\`\`bash
# ตรวจสอบว่า MongoDB กำลังทำงานอยู่
# macOS
brew services list | grep mongodb

# Linux
sudo systemctl status mongod
\`\`\`

### Port Already in Use
\`\`\`bash
# ฆ่า process ที่ใช้ port 5000
lsof -ti:5000 | xargs kill -9

# ฆ่า process ที่ใช้ port 3000
lsof -ti:3000 | xargs kill -9
\`\`\`

### WebSocket Connection Failed
- ตรวจสอบว่า Backend Server กำลังทำงานอยู่
- ตรวจสอบ CORS settings ใน server.js
- ตรวจสอบ firewall settings

## 📝 หมายเหตุสำคัญ

1. **การคำนวณต้นทุนเฉลี่ย (Average Cost)**
   - ระบบจะคำนวณต้นทุนเฉลี่ยอัตโนมัติเมื่อซื้อทอง
   - ใช้สำหรับคำนวณกำไร/ขาดทุน
   - แสดงใน WalletCard

2. **สกุลเงินในการซื้อขาย**
   - GOLD_9999_MTS, GOLD_965_MTS, GOLD_965_ASSO ใช้ THB เป็นหลัก
   - SPOT ใช้ USD
   - สามารถเลือกสกุลเงินได้เมื่อทำรายการ

3. **Status Control**
   - Admin สามารถควบคุม status แบบ real-time
   - PAUSE จะไม่อัพเดทราคา แต่ยังแสดงราคาล่าสุด
   - STOP จะไม่แสดงราคาและไม่สามารถเทรดได้

4. **Security**
   - รหัสผ่านถูก hash ด้วย bcrypt
   - ใช้ JWT สำหรับ authentication
   - Middleware ตรวจสอบ authorization ทุก protected route

## 👨‍💻 การพัฒนาต่อ

สามารถ contribute ได้โดย:
1. Fork repository
2. สร้าง feature branch
3. Commit การเปลี่ยนแปลง
4. Push ไปยัง branch
5. เปิด Pull Request

## 📄 License

MIT License - สามารถใช้งานและแก้ไขได้อย่างอิสระ
