# 🚀 Setup Guide (Without Docker) - Using Supabase + Prisma

## ✅ วิธีที่ 1: ใช้ Supabase เป็น PostgreSQL (แนะนำ)

### ข้อดี:
- ✅ ไม่ต้องติดตั้งอะไร
- ✅ Free tier ใช้ได้เลย
- ✅ มี database backup อัตโนมัติ
- ✅ Connection pooling built-in
- ✅ Setup ง่ายที่สุด

---

## 📋 Step-by-Step Setup

### Step 1: Get Supabase Database URL

1. **ไปที่:** https://supabase.com/dashboard
2. **เลือกโปรเจค** ที่มีอยู่แล้ว หรือสร้างใหม่
3. **ไปที่:** Settings → Database
4. **Copy Connection String:**
   - ไปที่ "Connection string" section
   - เลือก "URI" mode
   - Copy ทั้งหมด (จะมีรูปแบบ: `postgresql://postgres:[YOUR-PASSWORD]@...`)

5. **Connection Pooler (สำคัญ!):**
   - ไปที่ "Connection Pooler" section
   - เปิดใช้งาน Transaction mode
   - Copy Connection String แบบ pooler
   - จะมีรูปแบบ: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`

### Step 2: Configure Environment Variables

สร้างไฟล์ `.env.local`:

```env
# Supabase Database URL (with connection pooler)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection (for migrations only)
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# JWT Secrets
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret_here

# Upload Directory (local storage)
UPLOAD_DIR=./public/uploads

# Environment
NODE_ENV=development
```

**Generate secrets:**
```powershell
# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Step 3: Update Prisma Schema

แก้ไขไฟล์ `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ... rest of schema
```

### Step 4: Install Dependencies

```bash
npm install
```

### Step 5: Setup Prisma

```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema to Supabase database
npm run prisma:push

# (Optional) Open Prisma Studio
npm run prisma:studio
```

### Step 6: Start Development Server

```bash
npm run dev
```

Open http://localhost:3000

---

## ✅ วิธีที่ 2: ติดตั้ง PostgreSQL แบบ Standalone

### ข้อดี:
- ✅ ควบคุมได้เต็มที่
- ✅ ไม่ต้องพึ่ง cloud service

### ข้อเสีย:
- ⚠️ ต้องติดตั้งและจัดการเอง
- ⚠️ ต้อง backup เอง

### Setup Steps:

#### 1. ดาวน์โหลด PostgreSQL

**Windows:**
- ไปที่: https://www.postgresql.org/download/windows/
- Download และติดตั้ง PostgreSQL 16
- จดรหัสผ่านที่ตั้งไว้ตอน install

#### 2. สร้าง Database

เปิด **pgAdmin** หรือใช้ **psql**:

```sql
-- Create database
CREATE DATABASE egpb_ticket_db;

-- Create user (optional)
CREATE USER egpb_admin WITH PASSWORD 'your_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE egpb_ticket_db TO egpb_admin;
```

#### 3. Configure .env.local

```env
DATABASE_URL="postgresql://egpb_admin:your_password@localhost:5432/egpb_ticket_db?schema=public"

NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret
UPLOAD_DIR=./public/uploads
NODE_ENV=development
```

#### 4. Run Prisma Commands

```bash
npm run prisma:generate
npm run prisma:push
npm run dev
```

---

## ✅ วิธีที่ 3: ใช้ Cloud Database Services

### Neon.tech (แนะนำ)
- Free tier: 3GB storage
- Serverless PostgreSQL
- ไม่ต้อง setup อะไร

**Setup:**
1. ไปที่: https://neon.tech/
2. Sign up (ฟรี)
3. Create project
4. Copy connection string
5. ใส่ใน `.env.local`

### Render.com
- Free tier: 90 days free, then $7/month
- PostgreSQL 15

### Railway.app
- Free trial $5 credit
- PostgreSQL latest version

### Supabase (Same as วิธีที่ 1)
- Best option overall

---

## 🔄 ย้ายข้อมูลจาก Supabase

### Export ข้อมูลจาก Supabase

```bash
# Connect to Supabase database
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Export tables
\copy profiles TO 'profiles.csv' CSV HEADER
\copy tickets TO 'tickets.csv' CSV HEADER
\copy engineer_tickets TO 'engineer_tickets.csv' CSV HEADER
\copy ticket_images TO 'ticket_images.csv' CSV HEADER
```

### Import ไปยัง PostgreSQL ใหม่

```bash
# Connect to new database
psql "postgresql://your_connection_string"

# Import (หลังจาก run prisma:push แล้ว)
\copy users FROM 'profiles.csv' CSV HEADER
\copy tickets FROM 'tickets.csv' CSV HEADER
\copy engineer_tickets FROM 'engineer_tickets.csv' CSV HEADER
```

---

## 📝 Redis Alternative (Without Docker)

### วิธีที่ 1: ไม่ใช้ Redis (ง่ายสุด)
ใช้ in-memory cache แทน:

```typescript
// lib/cache.ts
const cache = new Map<string, { value: any; expiry: number }>();

export const setCache = (key: string, value: any, ttl: number) => {
  cache.set(key, {
    value,
    expiry: Date.now() + ttl * 1000,
  });
};

export const getCache = (key: string) => {
  const item = cache.get(key);
  if (!item) return null;
  
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  
  return item.value;
};
```

### วิธีที่ 2: Upstash Redis (Cloud)
- Free tier: 10,000 commands/day
- ไปที่: https://upstash.com/
- Create Redis database
- Copy URL ใส่ใน `.env.local`

### วิธีที่ 3: Redis Cloud
- Free tier: 30MB
- ไปที่: https://redis.com/try-free/

---

## 🗂️ File Storage (Without Supabase Storage)

### ใช้ Local Storage (Development)

```env
UPLOAD_DIR=./public/uploads
```

ไฟล์จะถูกเก็บใน `public/uploads/` และเข้าถึงได้ผ่าน `/uploads/...`

### For Production: Use Cloud Storage

**Cloudflare R2 (แนะนำ):**
- Free: 10GB storage
- S3 compatible API

**Vercel Blob:**
- Free tier: 1GB
- Easy integration with Next.js

**AWS S3:**
- Pay as you go
- Industry standard

---

## 🎯 แนะนำสำหรับคุณ

### สำหรับ Development:
```
✅ Database: Supabase (Free tier)
✅ Cache: In-memory (ไม่ต้อง Redis)
✅ Storage: Local filesystem
```

### สำหรับ Production:
```
✅ Database: Supabase (Paid plan) หรือ Neon.tech
✅ Cache: Upstash Redis (Free tier)
✅ Storage: Cloudflare R2 หรือ Vercel Blob
```

---

## 🚀 Quick Start (วิธีที่เร็วที่สุด)

```bash
# 1. Get Supabase connection string
# Copy from: https://supabase.com/dashboard/project/[your-project]/settings/database

# 2. Create .env.local
cat > .env.local << EOL
DATABASE_URL="your-supabase-pooler-url"
DIRECT_URL="your-supabase-direct-url"
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000
JWT_SECRET=$(openssl rand -base64 32)
UPLOAD_DIR=./public/uploads
NODE_ENV=development
EOL

# 3. Install & Setup
npm install
npm run prisma:generate
npm run prisma:push

# 4. Start
npm run dev
```

---

## 🐛 Troubleshooting

### Connection timeout
- ตรวจสอบ DATABASE_URL ถูกต้อง
- ลองใช้ connection pooler URL
- Check firewall/antivirus

### Prisma push fails
- ใช้ DIRECT_URL สำหรับ migrations
- ตรวจสอบ database permissions

### Slow queries
- ใช้ connection pooler
- เพิ่ม indexes ใน Prisma schema
- ใช้ Redis cache

---

## 💡 Tips

1. **Supabase + Prisma** = Best of both worlds
2. Use **connection pooler** for better performance
3. **Backup data** regularly (Supabase มีให้อัตโนมัติ)
4. Use **environment variables** for all secrets
5. Test locally before deploying

---

**ไม่ต้องใช้ Docker เลย! 🎉**

