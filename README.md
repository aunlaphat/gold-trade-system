คุณสามารถอ่านรายละเอียดการทดสอบระบบเพิ่มเติมได้ที่ไฟล์ [INFORMATION.md](./INFORMATION.md)

## Quick Start Deployment
### 1. Local Development Setup

- Clone repository or Dowload file zip : https://github.com/aunlaphat/gold-trade-system
- git clone https://github.com/aunlaphat/gold-trade-system.git
- cd gold-trading-system

# Install dependencies
- npm install
- npm install -D tsx

# Setup environment variables 
This project includes a default .env file for development and testing.
You may use it without modification, or adjust the configuration as needed.

# Initialize database
npm run setup-db

# How to import the sample data (optional):
1. Open MongoDB Compass
2. Copy folder `data` on Project
3. Open the Collections tab
4. Select file in folder data to Import Data
5. Click Import Data
6. Choose the corresponding JSON file from the data/ folder
7. Importing the test data is optional.
- You may skip this step if you prefer to start with an empty database.

- 🔑 Test Accounts (จาก data folder):
- login role admin ` email: admin@example.com ` ` pass: adminpassword `
- login role user ` email: 123@hotmail.com ` ` pass: 123456 `

# Start backend server (Terminal 1)
npm run server:dev

# Start frontend (Terminal 2)
npm run dev

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

---

## 🧪 การทดสอบ
### Unit Tests คุณสามารถอ่านรายละเอียดการทดสอบระบบเพิ่มเติมได้ที่ไฟล์ [TESTING.md](./TESTING.md)
ทดสอบ API ทุกตัวในระบบ `npm run test:api` 
ทดสอบ 4 เคสสำคัญตาม Requirement `npm run test:all` 

### Test Cases หลัก

1. **TC-001: Concurrent Access**
   - ทดสอบผู้ใช้หลายคนเข้าใช้งานพร้อมกัน

2. **TC-002: Transaction Stability**
   - ทดสอบ Transaction 100+ รายการพร้อมกัน

3. **TC-003: Price Status Control**
   - ทดสอบการควบคุมสถานะ (Online/Pause/Stop)

4. **TC-004: RealTime Display**
   - ทดสอบการแสดงราคาแบบเรียลไทม์

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

## 🔥 UI Preview

<img src="./images/login.png" width="800" />

<img src="./images/register.png" width="800" />

<img src="./images/buysellpage.png" width="800" />

<img src="./images/cardbuysell.png" width="800" />

<img src="./images/graph.png" width="800" />

<img src="./images/buysell.png" width="800" />

<img src="./images/wallet.png" width="800" />

<img src="./images/graphpage.png" width="800" />

<img src="./images/transaction.png" width="800" />

<img src="./images/changecurrency.png" width="800" />

<img src="./images/darkwhitemode.png" width="800" />

<img src="./images/adminpage.png" width="800" />

<img src="./images/adminpage2.png" width="800" />
