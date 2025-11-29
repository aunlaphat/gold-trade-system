# คู่มือการติดตั้งและใช้งาน Gold Trading System

## 📋 สารบัญ

1. [ความต้องการของระบบ](#ความต้องการของระบบ)
2. [การติดตั้ง MongoDB](#การติดตั้ง-mongodb)
3. [การติดตั้งโปรเจค](#การติดตั้งโปรเจค)
4. [การตั้งค่า Environment Variables](#การตั้งค่า-environment-variables)
5. [การ Setup Database](#การ-setup-database)
6. [การรันโปรเจค](#การรันโปรเจค)
7. [การทดสอบระบบ](#การทดสอบระบบ)
8. [แก้ไขปัญหาที่พบบ่อย](#แก้ไขปัญหาที่พบบ่อย)

## ความต้องการของระบบ

- **Node.js** >= 18.x
- **npm** >= 9.x หรือ **pnpm** >= 8.x
- **MongoDB** >= 5.0
- **Git** (สำหรับ clone repository)
- **Terminal/Command Line** (cmd, PowerShell, Terminal, iTerm)

## การติดตั้ง MongoDB

### บน macOS

\`\`\`bash
# ติดตั้ง Homebrew ถ้ายังไม่มี
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# เพิ่ม MongoDB tap
brew tap mongodb/brew

# ติดตั้ง MongoDB Community Edition
brew install mongodb-community@7.0

# เริ่มต้น MongoDB Service
brew services start mongodb-community@7.0

# ตรวจสอบว่า MongoDB ทำงานอยู่
brew services list | grep mongodb
\`\`\`

### บน Ubuntu/Debian Linux

\`\`\`bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# สร้าง list file สำหรับ MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# อัพเดท package database
sudo apt-get update

# ติดตั้ง MongoDB
sudo apt-get install -y mongodb-org

# เริ่มต้น MongoDB Service
sudo systemctl start mongod
sudo systemctl enable mongod

# ตรวจสอบสถานะ
sudo systemctl status mongod
\`\`\`

### บน Windows

1. **ดาวน์โหลด MongoDB Community Server**
   - ไปที่ https://www.mongodb.com/try/download/community
   - เลือก version 7.0.x (Windows)
   - ดาวน์โหลด .msi installer

2. **ติดตั้ง MongoDB**
   - รัน installer ที่ดาวน์โหลดมา
   - เลือก "Complete" installation
   - ติ๊ก "Install MongoDB as a Service"
   - ติ๊ก "Install MongoDB Compass" (GUI tool)

3. **ตรวจสอบการติดตั้ง**
   \`\`\`cmd
   # เปิด Command Prompt หรือ PowerShell
   mongod --version
   
   # เชื่อมต่อกับ MongoDB
   mongosh
   \`\`\`

### ตรวจสอบ MongoDB ทำงานหรือไม่

\`\`\`bash
# ทดสอบเชื่อมต่อ
mongosh

# ควรเห็นข้อความแบบนี้:
# Current Mongosh Log ID: ...
# Connecting to: mongodb://127.0.0.1:27017/...
# Using MongoDB: 7.0.x
# test>

# พิมพ์ exit เพื่อออก
exit
\`\`\`

## การติดตั้งโปรเจค

### 1. Clone Repository

\`\`\`bash
# Clone โปรเจค
git clone <repository-url>

# เข้าไปในโฟลเดอร์โปรเจค
cd gold-trading-system
\`\`\`

### 2. ติดตั้ง Dependencies

\`\`\`bash
# ใช้ npm
npm install

# หรือใช้ pnpm (แนะนำ - เร็วกว่า)
pnpm install
\`\`\`

**หมายเหตุ:** การติดตั้งอาจใช้เวลา 2-5 นาที ขึ้นอยู่กับความเร็วอินเทอร์เน็ต

## การตั้งค่า Environment Variables

สร้างไฟล์ `.env.local` ที่ root ของโปรเจค:

\`\`\`bash
# สร้างไฟล์ .env.local
touch .env.local

# หรือบน Windows
type nul > .env.local
\`\`\`

เปิดไฟล์ `.env.local` และเพิ่มค่าต่อไปนี้:

\`\`\`env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/gold-trading

# JWT Secret Key (เปลี่ยนเป็นค่าที่ปลอดภัยกว่านี้ในการใช้งานจริง)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345678

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000

# Server Port
PORT=5000

# Node Environment (development หรือ production)
NODE_ENV=development
\`\`\`

**⚠️ สำคัญ:** 
- อย่า commit ไฟล์ `.env.local` ขึ้น Git
- เปลี่ยน `JWT_SECRET` เป็นค่าที่ปลอดภัยในการใช้งานจริง
- ตรวจสอบว่าไฟล์ `.gitignore` มี `.env.local` อยู่แล้ว

## การ Setup Database

### 1. รัน MongoDB Setup Script

\`\`\`bash
# Script นี้จะสร้าง database และ collections ที่จำเป็น
node server/scripts/mongodb-setup.js
\`\`\`

**สิ่งที่ script จะทำ:**
- สร้าง database ชื่อ `gold-trading`
- สร้าง collections: `users`, `wallets`, `transactions`, `gold_statuses`, `gold_price_history`
- สร้าง indexes สำหรับ performance
- สร้างข้อมูล gold_statuses เริ่มต้น (ONLINE)

**ผลลัพธ์ที่คาดหวัง:**
\`\`\`
✓ Connected to MongoDB
✓ Database 'gold-trading' created/verified
✓ Collection 'users' created
✓ Collection 'wallets' created
✓ Collection 'transactions' created
✓ Collection 'gold_statuses' created
✓ Collection 'gold_price_history' created
✓ Indexes created
✓ Initial gold statuses created
✓ Database setup completed successfully!
\`\`\`

### 2. สร้าง Admin User

\`\`\`bash
# Script นี้จะสร้าง admin account สำหรับเข้าใช้งาน admin dashboard
node server/scripts/create-admin.js
\`\`\`

**ข้อมูล Admin ที่จะถูกสร้าง:**
- Email: `admin@example.com`
- Password: `admin123`
- Role: `admin`

**ผลลัพธ์ที่คาดหวัง:**
\`\`\`
✓ Connected to MongoDB
✓ Admin user created successfully!
  Email: admin@example.com
  Password: admin123
  
⚠️  Please change the password after first login!
\`\`\`

**⚠️ สำคัญ:** เปลี่ยนรหัสผ่าน admin ทันทีหลังจาก login ครั้งแรก

## การรันโปรเจค

### แบบ Development (แนะนำสำหรับการพัฒนา)

ต้องเปิด **2 Terminal windows** พร้อมกัน:

**Terminal 1 - Backend Server:**

\`\`\`bash
# เข้าไปในโฟลเดอร์ server
cd server

# รัน backend server ด้วย nodemon (auto-reload เมื่อมีการแก้ไขไฟล์)
npm run server:dev

# หรือรันแบบธรรมดา
node server.js
\`\`\`

**ผลลัพธ์ที่คาดหวัง:**
\`\`\`
✓ Connected to MongoDB
🚀 Server is running on port 5000
🔄 WebSocket server initialized
💰 Gold price service started
📊 Initial prices loaded
✓ All services initialized successfully
\`\`\`

**Terminal 2 - Frontend (Next.js):**

\`\`\`bash
# ต้องอยู่ใน root directory ของโปรเจค
npm run dev

# หรือ
pnpm dev
\`\`\`

**ผลลัพธ์ที่คาดหวัง:**
\`\`\`
▲ Next.js 16.0.3
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in 2.5s
\`\`\`

### เปิดเบราว์เซอร์

เปิดเบราว์เซอร์ไปที่: http://localhost:3000

**ทดสอบเข้าสู่ระบบ:**
- **Admin:** admin@example.com / admin123
- **User:** สร้างใหม่ผ่านหน้า Register

### แบบ Production

\`\`\`bash
# 1. Build frontend
npm run build

# 2. เริ่ม production server
npm start

# 3. รัน backend (อีก terminal)
cd server
node server.js
\`\`\`

## การทดสอบระบบ

### รัน Unit Tests ทั้งหมด

\`\`\`bash
# รัน test suite ทั้งหมด (TC-001 ถึง TC-004)
npm run test:all
\`\`\`

### รัน Test แต่ละ Test Case

\`\`\`bash
# TC-001: Concurrent Access Test
npm run test:concurrent

# TC-002: Transaction Stability Test  
npm run test:transactions

# TC-003: Status Control Test
npm run test:status

# TC-004: Real-time Display Test
npm run test:realtime
\`\`\`

### รัน API Tests

\`\`\`bash
cd server
node tests/api-tests.ts
\`\`\`

### Manual Testing

**ทดสอบการเข้าสู่ระบบ:**
\`\`\`bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
\`\`\`

**ทดสอบดึงราคาทอง:**
\`\`\`bash
curl http://localhost:5000/api/prices/current
\`\`\`

## แก้ไขปัญหาที่พบบ่อย

### 1. MongoDB Connection Failed

**ปัญหา:** `MongoServerError: connect ECONNREFUSED 127.0.0.1:27017`

**แก้ไข:**
\`\`\`bash
# ตรวจสอบว่า MongoDB ทำงานอยู่หรือไม่

# macOS
brew services list | grep mongodb
brew services start mongodb-community

# Linux
sudo systemctl status mongod
sudo systemctl start mongod

# Windows
# เปิด Services.msc และเริ่ม MongoDB Service
\`\`\`

### 2. Port Already in Use

**ปัญหา:** `Error: listen EADDRINUSE: address already in use :::3000`

**แก้ไข:**
\`\`\`bash
# หา process ที่ใช้ port 3000
lsof -ti:3000

# ฆ่า process
lsof -ti:3000 | xargs kill -9

# หรือเปลี่ยน port ใน package.json
"dev": "next dev -p 3001"
\`\`\`

### 3. Module Not Found

**ปัญหา:** `Error: Cannot find module 'xyz'`

**แก้ไข:**
\`\`\`bash
# ลบ node_modules และ lock file
rm -rf node_modules package-lock.json pnpm-lock.yaml

# ติดตั้งใหม่
npm install
# หรือ
pnpm install
\`\`\`

### 4. Permission Denied (MongoDB)

**ปัญหา:** `PermissionError: [Errno 13] Permission denied`

**แก้ไข (Linux/Mac):**
\`\`\`bash
# ตรวจสอบ ownership ของ MongoDB data directory
sudo chown -R $(whoami) /usr/local/var/mongodb

# หรือรัน MongoDB ด้วย sudo (ไม่แนะนำ)
sudo mongod --dbpath /data/db
\`\`\`

### 5. WebSocket Connection Failed

**ปัญหา:** กราฟไม่อัพเดทแบบ real-time

**แก้ไข:**
1. ตรวจสอบว่า Backend Server ทำงานอยู่
2. ตรวจสอบ CORS settings ใน `server/server.js`
3. เช็ค Browser Console สำหรับ error messages
4. ลอง refresh หน้า browser

### 6. Build Failed

**ปัญหา:** `Error: Build optimization failed`

**แก้ไข:**
\`\`\`bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules cache
npm cache clean --force

# Rebuild
npm run build
\`\`\`

### 7. JWT Token Expired

**ปัญหา:** `Error: jwt expired` หรือต้อง login ใหม่บ่อย

**แก้ไข:**
- Token หมดอายุหลัง 24 ชั่วโมง (ปกติ)
- Login ใหม่เพื่อรับ token ใหม่
- หรือเปลี่ยนค่า `expiresIn` ใน `server/routes/auth.js`

### 8. Can't Access Admin Dashboard

**ปัญหา:** เข้า admin panel ไม่ได้แม้ใช้ admin account

**แก้ไข:**
\`\`\`bash
# ตรวจสอบ role ของ user ใน database
mongosh
use gold-trading
db.users.findOne({email: "admin@example.com"})

# ถ้า role ไม่ใช่ "admin" ให้อัพเดท
db.users.updateOne(
  {email: "admin@example.com"},
  {$set: {role: "admin"}}
)
\`\`\`

## เคล็ดลับการใช้งาน

### 1. Hot Reload

- Frontend: Next.js จะ hot reload อัตโนมัติ
- Backend: ใช้ `npm run server:dev` สำหรับ auto-reload ด้วย nodemon

### 2. Debug Mode

เปิด debug logs:
\`\`\`env
# ใน .env.local
NODE_ENV=development
DEBUG=*
\`\`\`

### 3. Database Management

ใช้ MongoDB Compass (GUI) สำหรับจัดการ database:
\`\`\`bash
# เปิด Compass และเชื่อมต่อไปที่
mongodb://localhost:27017
\`\`\`

### 4. Check Logs

\`\`\`bash
# Backend logs
tail -f server_price_updates.log

# MongoDB logs (Linux)
sudo tail -f /var/log/mongodb/mongod.log

# MongoDB logs (macOS)
tail -f /usr/local/var/log/mongodb/mongo.log
\`\`\`

## ขั้นตอนต่อไป

หลังจากติดตั้งเรียบร้อยแล้ว:

1. ✅ อ่าน [README.md](./README.md) สำหรับภาพรวมระบบ
2. ✅ อ่าน [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) สำหรับทำความเข้าใจโครงสร้าง
3. ✅ ลองใช้งานระบบทั้ง User และ Admin
4. ✅ รัน tests เพื่อตรวจสอบระบบ
5. ✅ เริ่มพัฒนาฟีเจอร์ใหม่!

## การติดต่อและรายงานปัญหา

หากพบปัญหาที่ไม่สามารถแก้ไขได้:

1. ตรวจสอบ logs จาก Backend และ Frontend
2. ตรวจสอบ MongoDB logs
3. ลองค้นหาใน GitHub Issues
4. สร้าง Issue ใหม่พร้อมรายละเอียด:
   - ขั้นตอนที่ทำให้เกิดปัญหา
   - Error messages
   - Environment (OS, Node version, MongoDB version)
   - Screenshots (ถ้ามี)

---

**สร้างโดย:** Gold Trading System Team  
**อัพเดทล่าสุด:** 2025-01-27
