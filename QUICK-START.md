# ⚡ Quick Start Guide (ไม่ใช้ Docker)

## 🎯 เลือกวิธีที่เหมาะกับคุณ

### ✅ วิธีที่ 1: Supabase + Prisma (แนะนำ - ง่ายที่สุด)

**ข้อดี:**
- ✅ ไม่ต้องติดตั้งอะไรเลย
- ✅ ฟรี (Free tier)
- ✅ Setup ใน 5 นาที
- ✅ มี backup อัตโนมัติ

**ทำตามนี้:**

```bash
# 1. ไปที่ Supabase Dashboard
# https://supabase.com/dashboard/project/[your-project]/settings/database

# 2. Copy Connection Strings:
#    - Connection Pooler (Transaction mode) → DATABASE_URL
#    - Direct Connection → DIRECT_URL

# 3. สร้างไฟล์ .env.local
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@...pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
NEXTAUTH_SECRET=your_secret_here
NEXTAUTH_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret_here
UPLOAD_DIR=./public/uploads
NODE_ENV=development

# 4. ติดตั้งและ setup
npm install
npm run prisma:generate
npm run prisma:push

# 5. เริ่มใช้งาน
npm run dev
```

**เสร็จแล้ว! 🎉** เปิด http://localhost:3000

---

### 🔧 วิธีที่ 2: ติดตั้ง PostgreSQL เอง

**สำหรับคนที่ต้องการควบคุมทุกอย่างเอง**

```bash
# 1. ติดตั้ง PostgreSQL
# Download: https://www.postgresql.org/download/windows/

# 2. สร้าง database
psql -U postgres
CREATE DATABASE egpb_ticket_db;
\q

# 3. ตั้งค่า .env.local
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/egpb_ticket_db"
# ... rest of env vars

# 4. Setup
npm install
npm run prisma:generate
npm run prisma:push
npm run dev
```

---

### ☁️ วิธีที่ 3: Cloud Database

**Neon.tech (แนะนำ):**
- Free: 3GB storage
- Serverless
- ไปที่: https://neon.tech/

**Railway.app:**
- Free trial $5
- ไปที่: https://railway.app/

**Render.com:**
- Free 90 days
- ไปที่: https://render.com/

---

## 📝 สร้างไฟล์ .env.local

**Template:**

```env
# === DATABASE ===
DATABASE_URL="your_connection_pooler_url"
DIRECT_URL="your_direct_connection_url"

# === AUTHENTICATION ===
# Generate: [Convert]::ToBase64String((1..32|%{Get-Random -Min 0 -Max 256}))
NEXTAUTH_SECRET=generate_random_32_characters
NEXTAUTH_URL=http://localhost:3000
JWT_SECRET=generate_random_32_characters

# === FILE STORAGE ===
UPLOAD_DIR=./public/uploads

# === ENVIRONMENT ===
NODE_ENV=development
```

**Generate secrets (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

---

## 🚀 Commands

```bash
# Install dependencies
npm install

# Generate Prisma Client
npm run prisma:generate

# Push schema to database (creates tables)
npm run prisma:push

# Open Prisma Studio (visual database editor)
npm run prisma:studio

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

---

## 🗂️ โครงสร้างโปรเจค

```
ticket-form-app/
├── prisma/
│   └── schema.prisma          # Database schema
├── lib/
│   ├── prisma.ts             # Prisma client
│   ├── auth.ts               # Authentication
│   ├── cache.ts              # In-memory cache
│   └── fileStorage.ts        # File upload
├── app/
│   ├── api/                  # API routes
│   ├── dashboard/            # Dashboard pages
│   └── login/                # Login page
├── public/
│   └── uploads/              # Uploaded files
└── .env.local                # Environment variables
```

---

## 🔍 Prisma Studio

**เปิด database viewer:**

```bash
npm run prisma:studio
```

เปิดที่ http://localhost:5555

**ฟีเจอร์:**
- ✅ ดูข้อมูลในตาราง
- ✅ เพิ่ม/แก้ไข/ลบข้อมูล
- ✅ ค้นหาและ filter
- ✅ Export data

---

## 🐛 แก้ปัญหา

### ❌ "Cannot connect to database"

```bash
# ตรวจสอบ connection string
# Verify database is running
# Check firewall/network
```

### ❌ "Prisma Client not generated"

```bash
npm run prisma:generate
```

### ❌ "Migration failed"

```bash
# ใช้ DIRECT_URL แทน DATABASE_URL สำหรับ migrations
# หรือใช้ prisma:push แทน prisma:migrate
```

### ❌ "Port 3000 in use"

```bash
# Kill process
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

---

## ✨ Tips

1. **ใช้ Supabase** ถ้าไม่อยากยุ่งยาก
2. **ใช้ Prisma Studio** ดู database สะดวกกว่า pgAdmin
3. **เก็บ .env.local** ในที่ปลอดภัย (มี secrets)
4. **Backup ข้อมูล** ก่อน run migrations
5. **ใช้ connection pooler** สำหรับ production

---

## 📊 Next Steps

หลังจาก setup เสร็จ:

1. ✅ เปิด http://localhost:3000
2. ✅ Login ด้วย default admin (ถ้ามี seed data)
3. ✅ สร้าง ticket ทดสอบ
4. ✅ Upload รูปภาพ
5. ✅ ทดสอบทุก features

---

## 📚 เอกสารเพิ่มเติม

- **Full Guide:** [SETUP-WITHOUT-DOCKER.md](./SETUP-WITHOUT-DOCKER.md)
- **Prisma Docs:** https://www.prisma.io/docs
- **Supabase Docs:** https://supabase.com/docs

---

## 💡 สรุป

**สำหรับคนรีบ:**
1. Get Supabase connection string
2. Create `.env.local`
3. Run: `npm install && npm run prisma:generate && npm run prisma:push && npm run dev`
4. เปิด http://localhost:3000
5. Done! 🎉

**เวลาทั้งหมด:** ~5 นาที

---

**ไม่ต้องใช้ Docker เลย! 🚀**

