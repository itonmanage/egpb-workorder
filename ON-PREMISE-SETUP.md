# 🏢 On-Premise Setup - Quick Guide

> สำหรับระบบภายในองค์กร ไม่ใช้ Cloud Services

## 🎯 Overview

Setup นี้เหมาะสำหรับ:
- ✅ ระบบภายในองค์กร (Internal use only)
- ✅ ไม่ต้องการเก็บข้อมูลบน Cloud
- ✅ ควบคุมข้อมูลได้เต็มที่
- ✅ ใช้งานผ่าน Internal Network เท่านั้น

---

## 📋 Quick Start (30 นาที)

### Step 1: ติดตั้ง PostgreSQL (10 นาที)

```powershell
# 1. Download PostgreSQL 16
# https://www.postgresql.org/download/windows/

# 2. ติดตั้งและตั้งรหัสผ่าน
# จดรหัสผ่านไว้!

# 3. ตรวจสอบ
psql --version
```

### Step 2: สร้าง Database (2 นาที)

```sql
-- เปิด pgAdmin หรือใช้ psql
psql -U postgres

-- สร้าง user
CREATE USER egpb_admin WITH PASSWORD 'YourSecurePassword!';

-- สร้าง database
CREATE DATABASE egpb_ticket_db OWNER egpb_admin;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE egpb_ticket_db TO egpb_admin;

\q
```

### Step 3: Setup Project (5 นาที)

```powershell
# สร้างไฟล์ .env.local
@"
DATABASE_URL="postgresql://egpb_admin:YourSecurePassword!@localhost:5432/egpb_ticket_db"
DIRECT_URL="postgresql://egpb_admin:YourSecurePassword!@localhost:5432/egpb_ticket_db"
NEXTAUTH_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000
UPLOAD_DIR=D:/EGPB-Uploads
NODE_ENV=production
"@ | Out-File -FilePath .env.local -Encoding utf8

# ติดตั้ง packages
npm install

# Generate Prisma Client
npm run prisma:generate

# สร้าง tables
npm run prisma:push
```

### Step 4: ย้ายข้อมูล (10 นาที)

```powershell
# ตั้งค่า Supabase credentials ใน .env.local
# เพิ่มบรรทัดนี้:
# SUPABASE_URL=your_supabase_url
# SUPABASE_KEY=your_supabase_anon_key

# รัน migration
npm run migrate:from-supabase

# ดาวน์โหลดรูปภาพ
npm run download:images
```

### Step 5: เริ่มใช้งาน (2 นาที)

```powershell
# Development
npm run dev

# Production
npm run build
npm start
```

เปิด: http://localhost:3000

---

## 📁 โครงสร้างไฟล์

```
F:\ticket-form-app\
├── INTERNAL-SETUP-GUIDE.md    ← คู่มือละเอียดทุกขั้นตอน
├── ON-PREMISE-SETUP.md         ← (ไฟล์นี้) Quick guide
├── scripts/
│   ├── migrate-from-supabase.js  ← Migration script
│   ├── download-images.js        ← Download รูปจาก Supabase
│   └── backup.bat                ← Backup script
├── prisma/
│   └── schema.prisma             ← Database schema
└── .env.local                     ← Configuration

D:\EGPB-Uploads\                  ← ไฟล์แนบ
D:\EGPB-Backups\                  ← Backups
```

---

## 🔧 Commands

### Database:

```bash
# Open Prisma Studio (GUI)
npm run prisma:studio

# Regenerate Prisma Client
npm run prisma:generate

# Push schema changes
npm run prisma:push
```

### Migration:

```bash
# ย้ายข้อมูลจาก Supabase
npm run migrate:from-supabase

# ดาวน์โหลดรูปภาพ
npm run download:images
```

### Backup:

```bash
# Manual backup
npm run backup:db

# หรือรันโดยตรง
D:\ticket-form-app\scripts\backup.bat
```

---

## 🌐 Network Access

### เปิดให้เครื่องอื่นในองค์กรเข้าถึง:

```powershell
# 1. หา IP Address ของ Server
ipconfig
# สมมติได้: 192.168.1.100

# 2. เปิด Firewall (รัน PowerShell แบบ Admin)
New-NetFirewallRule -DisplayName "EGPB Ticket" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow

# 3. อัพเดต .env.local
# NEXTAUTH_URL=http://192.168.1.100:3000

# 4. Restart application
```

**เครื่องอื่นเข้าถึงได้ที่:** `http://192.168.1.100:3000`

---

## 💾 Backup (สำคัญ!)

### ตั้งค่า Auto Backup:

```powershell
# รัน PowerShell แบบ Administrator
$action = New-ScheduledTaskAction -Execute "D:\ticket-form-app\scripts\backup.bat"
$trigger = New-ScheduledTaskTrigger -Daily -At 2:00AM
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

Register-ScheduledTask -TaskName "EGPB Ticket Backup" -Action $action -Trigger $trigger -Principal $principal
```

**Backup จะทำงานทุกวันเวลา 2:00 น.**

### Restore จาก Backup:

```powershell
# 1. หยุด application
# 2. Restore database
$env:PGPASSWORD = "YourSecurePassword!"
pg_restore -U egpb_admin -d egpb_ticket_db -c "D:\EGPB-Backups\egpb_db_YYYYMMDD_HHMMSS.backup"

# 3. Restore files
Copy-Item "D:\EGPB-Backups\uploads_*\*" "D:\EGPB-Uploads\" -Recurse -Force

# 4. เริ่ม application
```

---

## 📊 Monitoring

### ตรวจสอบสถานะ:

```sql
-- เข้า psql
psql -U egpb_admin -d egpb_ticket_db

-- ดู table sizes
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.'||tablename) DESC;

-- ดูจำนวนข้อมูล
SELECT 'users' AS table, COUNT(*) FROM users
UNION SELECT 'tickets', COUNT(*) FROM tickets
UNION SELECT 'engineer_tickets', COUNT(*) FROM engineer_tickets;
```

---

## 🔐 Security Checklist

- [ ] เปลี่ยนรหัสผ่าน database จาก default
- [ ] ตั้ง strong passwords ใน .env.local
- [ ] จำกัด Firewall เฉพาะ Internal Network
- [ ] Setup automatic backup
- [ ] ทดสอบ restore procedure
- [ ] ลบ Supabase credentials หลัง migrate เสร็จ

---

## 🐛 Troubleshooting

### ❌ Cannot connect to database

```powershell
# ตรวจสอบ PostgreSQL service
Get-Service postgresql-x64-16

# Start service
Start-Service postgresql-x64-16
```

### ❌ Port 3000 in use

```powershell
# หา process ที่ใช้ port
netstat -ano | findstr :3000

# Kill process
taskkill /PID [PID_NUMBER] /F

# หรือใช้ port อื่น
npm run dev -- -p 3001
```

### ❌ Migration failed

```powershell
# ตรวจสอบ Supabase credentials ใน .env.local
# ลองรันอีกครั้ง
npm run migrate:from-supabase
```

---

## 📚 Full Documentation

**อ่านคู่มือฉบับเต็ม:** [`INTERNAL-SETUP-GUIDE.md`](./INTERNAL-SETUP-GUIDE.md)

มีรายละเอียด:
- การติดตั้ง PostgreSQL แบบละเอียด
- Network configuration
- Security best practices
- Performance tuning
- Advanced backup strategies

---

## 🎯 Summary

| Component | Location | Status |
|-----------|----------|--------|
| **PostgreSQL** | localhost:5432 | ✅ Local |
| **App Server** | localhost:3000 | ✅ Local |
| **File Storage** | D:\EGPB-Uploads | ✅ Local |
| **Backups** | D:\EGPB-Backups | ✅ Local |
| **Cloud Services** | None | ❌ Not used |

**ข้อมูลทั้งหมดอยู่บน Server ภายใน ไม่มีอะไรบน Cloud! ✅**

---

## 📞 Support

เอกสารเพิ่มเติม:
- [INTERNAL-SETUP-GUIDE.md](./INTERNAL-SETUP-GUIDE.md) - Full guide
- [QUICK-START.md](./QUICK-START.md) - Alternative setup
- [SETUP-WITHOUT-DOCKER.md](./SETUP-WITHOUT-DOCKER.md) - Cloud options

---

**Version:** 1.0  
**Last Updated:** 2024-01-01  
**For Internal Use Only** 🏢

