# 🚀 Quick PostgreSQL Installation Guide

## ⚠️ สถานะปัจจุบัน
PostgreSQL ยังไม่ได้ติดตั้งบนเครื่องนี้ ต้องติดตั้งก่อนเพื่อให้ระบบทำงานได้

---

## 📥 วิธีการติดตั้ง PostgreSQL

### วิธีที่ 1: ใช้ winget (แนะนำ - เร็วที่สุด) ⚡

```powershell
# เปิด PowerShell (แบบ Admin) และรัน:
winget install PostgreSQL.PostgreSQL

# รอจนติดตั้งเสร็จ (ประมาณ 2-3 นาที)
# Restart PowerShell
```

### วิธีที่ 2: ดาวน์โหลด Installer 📦

1. เปิด: https://www.postgresql.org/download/windows/
2. คลิก "Download the installer"
3. ดาวน์โหลด PostgreSQL 16.x (Recommended)
4. รัน installer และทำตามขั้นตอน:
   - ✅ เลือก port: 5432 (default)
   - ✅ ตั้ง password สำหรับ postgres user (จดไว้!)
   - ✅ เลือก locale: Thai, Thailand (หรือ Default)
   - ✅ ติดตั้งทุก components (PostgreSQL Server, pgAdmin 4, Command Line Tools)

### วิธีที่ 3: ใช้ Chocolatey 🍫

```powershell
# ต้องติดตั้ง Chocolatey ก่อน (ถ้ายังไม่มี)
choco install postgresql
```

---

## ✅ ตรวจสอบการติดตั้ง

หลังติดตั้งเสร็จ ให้ **Restart PowerShell** แล้วทดสอบ:

```powershell
# ตรวจสอบ version
psql --version

# ควรได้ผลลัพธ์คล้ายๆ นี้:
# psql (PostgreSQL) 16.x
```

---

## 🗄️ สร้าง Database และ User

### 1. เข้าสู่ PostgreSQL:

```powershell
# Login ด้วย postgres user (ใส่ password ที่ตั้งไว้)
psql -U postgres
```

### 2. สร้าง Database:

```sql
-- สร้าง database
CREATE DATABASE egpb_ticket_db;

-- สร้าง user
CREATE USER egpb_admin WITH PASSWORD 'EGPB_Secure_Pass_2024!';

-- ให้สิทธิ์
GRANT ALL PRIVILEGES ON DATABASE egpb_ticket_db TO egpb_admin;

-- เชื่อมต่อกับ database
\c egpb_ticket_db

-- ให้สิทธิ์ใน schema public
GRANT ALL PRIVILEGES ON SCHEMA public TO egpb_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO egpb_admin;

-- ออกจาก psql
\q
```

### 3. ทางลัด (One-line Commands):

```powershell
# สร้าง database และ user พร้อมกัน
$env:PGPASSWORD = "your_postgres_password"

psql -U postgres -c "CREATE DATABASE egpb_ticket_db;"
psql -U postgres -c "CREATE USER egpb_admin WITH PASSWORD 'EGPB_Secure_Pass_2024!';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE egpb_ticket_db TO egpb_admin;"
psql -U postgres -d egpb_ticket_db -c "GRANT ALL PRIVILEGES ON SCHEMA public TO egpb_admin;"
psql -U postgres -d egpb_ticket_db -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO egpb_admin;"

$env:PGPASSWORD = $null
```

---

## 🚀 ขั้นตอนต่อไป

หลังจากติดตั้ง PostgreSQL และสร้าง Database เรียบร้อยแล้ว:

### 1. ตรวจสอบไฟล์ `.env`:

```powershell
# ตรวจสอบว่ามีไฟล์ .env และมี DATABASE_URL
Get-Content .env
```

ควรเห็น:
```env
DATABASE_URL="postgresql://egpb_admin:EGPB_Secure_Pass_2024!@localhost:5432/egpb_ticket_db?schema=public"
```

### 2. รัน Prisma Migration:

```powershell
npm run prisma:push
```

### 3. สร้าง Test Users:

```powershell
npm run prisma:seed
```

### 4. เริ่ม Development Server:

```powershell
npm run dev
```

### 5. เข้าใช้งาน:

เปิดเบราว์เซอร์ไปที่:
- **Local**: http://localhost:3000
- **Network**: http://10.70.0.34:3000

Login ด้วย:
- Username: `admin`
- Password: `admin123`

---

## 🔧 Troubleshooting

### ❌ "psql is not recognized"

**สาเหตุ**: PostgreSQL ไม่ได้อยู่ใน System PATH

**วิธีแก้**:
1. เพิ่ม PostgreSQL เข้า PATH:
   ```
   C:\Program Files\PostgreSQL\16\bin
   ```
2. Restart PowerShell
3. ทดสอบอีกครั้ง: `psql --version`

### ❌ "connection refused"

**สาเหตุ**: PostgreSQL service ไม่ได้รัน

**วิธีแก้**:
```powershell
# ตรวจสอบ service
Get-Service -Name postgresql*

# เริ่ม service (ถ้าหยุดอยู่)
Start-Service postgresql-x64-16
```

### ❌ "password authentication failed"

**สาเหตุ**: Password ไม่ถูกต้อง

**วิธีแก้**:
1. ใช้ password ที่ตั้งไว้ตอนติดตั้ง PostgreSQL
2. หรือ reset password:
   ```powershell
   psql -U postgres
   # แล้วรัน:
   ALTER USER postgres PASSWORD 'new_password';
   ```

### ❌ "permission denied for schema public"

**สาเหตุ**: User ไม่มีสิทธิ์

**วิธีแก้**:
```powershell
psql -U postgres -d egpb_ticket_db
# รัน:
GRANT ALL PRIVILEGES ON SCHEMA public TO egpb_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO egpb_admin;
```

---

## 📚 เอกสารเพิ่มเติม

- **INTERNAL-SETUP-GUIDE.md** - คู่มือติดตั้งฉบับเต็ม
- **ON-PREMISE-SETUP.md** - Quick Start Guide
- **MIGRATION-STATUS.md** - สถานะการ migrate
- **PostgreSQL Official Docs**: https://www.postgresql.org/docs/

---

## ✅ Checklist

- [ ] ติดตั้ง PostgreSQL
- [ ] ทดสอบ `psql --version` สำเร็จ
- [ ] สร้าง database `egpb_ticket_db`
- [ ] สร้าง user `egpb_admin`
- [ ] ให้สิทธิ์ user ใน schema public
- [ ] ตรวจสอบไฟล์ `.env` มี `DATABASE_URL`
- [ ] รัน `npm run prisma:push` สำเร็จ
- [ ] รัน `npm run prisma:seed` สำเร็จ
- [ ] เริ่ม server ด้วย `npm run dev`
- [ ] ทดสอบ login ที่ http://10.70.0.34:3000

---

**สถานะ**: 🟡 **รอติดตั้ง PostgreSQL**  
**Last Updated**: 2025-11-29

