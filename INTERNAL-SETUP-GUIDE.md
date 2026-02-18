# 🏢 EGPB Ticket - Internal Setup Guide (On-Premise)

> สำหรับระบบภายในองค์กรเท่านั้น - ไม่ใช้ Cloud Services

## 🎯 เป้าหมาย

- ✅ ติดตั้ง PostgreSQL บนเครื่อง Server ภายใน
- ✅ ย้ายข้อมูลจาก Supabase มายัง PostgreSQL Local
- ✅ ใช้ Prisma เป็น ORM
- ✅ เก็บไฟล์แนบบน Local Server
- ✅ ใช้งานผ่าน Internal Network เท่านั้น
- ✅ ไม่มีข้อมูลอยู่บน Cloud

---

## 📋 Part 1: ติดตั้ง PostgreSQL บน Windows Server

### Step 1: ดาวน์โหลด PostgreSQL

1. **ดาวน์โหลด:**
   - ไปที่: https://www.postgresql.org/download/windows/
   - เลือก: **PostgreSQL 16.x** (Windows x86-64)
   - หรือใช้: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

2. **รัน Installer:**
   - ดับเบิลคลิกไฟล์ `postgresql-16.x-windows-x64.exe`

### Step 2: การติดตั้ง

**หน้าที่ 1: Welcome**
- คลิก `Next`

**หน้าที่ 2: Installation Directory**
- Default: `C:\Program Files\PostgreSQL\16`
- คลิก `Next`

**หน้าที่ 3: Select Components**
- ✅ PostgreSQL Server
- ✅ pgAdmin 4 (GUI tool)
- ✅ Stack Builder (optional)
- ✅ Command Line Tools
- คลิก `Next`

**หน้าที่ 4: Data Directory**
- Default: `C:\Program Files\PostgreSQL\16\data`
- หรือเปลี่ยนเป็น: `D:\PostgreSQL\data` (ถ้ามี disk แยก)
- คลิก `Next`

**หน้าที่ 5: Password**
- ตั้งรหัสผ่านสำหรับ user `postgres`
- **จดรหัสผ่านไว้ให้ดี!** (สำคัญมาก)
- แนะนำ: ใช้รหัสผ่านที่ซับซ้อน เช่น `EGPB_Admin2024!`
- คลิก `Next`

**หน้าที่ 6: Port**
- Default: `5432`
- ถ้า port ซ้ำ ใช้: `5433` หรือ `5434`
- คลิก `Next`

**หน้าที่ 7: Locale**
- Default: `[Default locale]`
- หรือเลือก: `Thai, Thailand`
- คลิก `Next`

**หน้าที่ 8: Ready to Install**
- คลิก `Next`

**หน้าที่ 9: Installation Complete**
- ✅ Launch Stack Builder (ถ้าต้องการ extensions)
- คลิก `Finish`

### Step 3: ตรวจสอบการติดตั้ง

**ผ่าน Command Line:**

```cmd
# ตรวจสอบ PostgreSQL version
"C:\Program Files\PostgreSQL\16\bin\psql" --version

# เข้าสู่ระบบ
"C:\Program Files\PostgreSQL\16\bin\psql" -U postgres
# ใส่รหัสผ่านที่ตั้งไว้

# ถ้าเข้าได้ แสดงว่าติดตั้งสำเร็จ
```

**ผ่าน pgAdmin 4:**

1. เปิดโปรแกรม **pgAdmin 4**
2. คลิกที่ **Servers** → **PostgreSQL 16**
3. ใส่รหัสผ่าน
4. ถ้าเห็น databases แสดงว่าสำเร็จ

### Step 4: เพิ่ม PostgreSQL เข้า PATH (Optional)

```powershell
# รัน PowerShell แบบ Administrator
$env:Path += ";C:\Program Files\PostgreSQL\16\bin"
[Environment]::SetEnvironmentVariable("Path", $env:Path, [System.EnvironmentVariableTarget]::Machine)
```

จากนั้นเปิด PowerShell ใหม่ และทดสอบ:

```powershell
psql --version
```

---

## 🗄️ Part 2: สร้าง Database และ User

### วิธีที่ 1: ใช้ pgAdmin 4 (ง่ายกว่า)

**1. เปิด pgAdmin 4**

**2. สร้าง Database:**
- Right-click **Databases** → **Create** → **Database**
- **Database:** `egpb_ticket_db`
- **Owner:** `postgres`
- คลิก **Save**

**3. สร้าง User (Optional - แนะนำ):**
- Right-click **Login/Group Roles** → **Create** → **Login/Group Role**
- **General Tab:**
  - Name: `egpb_admin`
- **Definition Tab:**
  - Password: `EGPB_Secure_Pass_2024!`
- **Privileges Tab:**
  - ✅ Can login?
  - ✅ Create databases?
  - ✅ Create roles?
- คลิก **Save**

**4. Grant Privileges:**
- Right-click `egpb_ticket_db` → **Properties** → **Security**
- เพิ่ม `egpb_admin` ให้มีสิทธิ์ `ALL`

### วิธีที่ 2: ใช้ Command Line

```sql
-- เข้าสู่ระบบ PostgreSQL
psql -U postgres

-- สร้าง User
CREATE USER egpb_admin WITH PASSWORD 'EGPB_Secure_Pass_2024!';

-- สร้าง Database
CREATE DATABASE egpb_ticket_db OWNER egpb_admin;

-- Grant สิทธิ์
GRANT ALL PRIVILEGES ON DATABASE egpb_ticket_db TO egpb_admin;

-- เปิดใช้งาน Extensions
\c egpb_ticket_db

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ออกจากระบบ
\q
```

---

## 🔧 Part 3: Configure Project

### Step 1: สร้างไฟล์ `.env.local`

สร้างไฟล์ `.env.local` ใน root directory:

```env
# =================================
# LOCAL POSTGRESQL CONFIGURATION
# =================================

# Database Connection
DATABASE_URL="postgresql://egpb_admin:EGPB_Secure_Pass_2024!@localhost:5432/egpb_ticket_db?schema=public"

# For migrations (same as DATABASE_URL for local setup)
DIRECT_URL="postgresql://egpb_admin:EGPB_Secure_Pass_2024!@localhost:5432/egpb_ticket_db?schema=public"

# =================================
# AUTHENTICATION
# =================================

# Generate: [Convert]::ToBase64String((1..32|%{Get-Random -Min 0 -Max 256}))
NEXTAUTH_SECRET=your_generated_secret_here_32_characters
JWT_SECRET=your_generated_jwt_secret_32_characters

# Application URL (Internal Network)
# ใช้ IP ของเครื่อง Server หรือ hostname
NEXTAUTH_URL=http://192.168.1.100:3000
# หรือ
# NEXTAUTH_URL=http://ticket-server.company.local:3000

# =================================
# FILE STORAGE (LOCAL)
# =================================

# Upload directory
UPLOAD_DIR=D:/EGPB-Uploads
# หรือใช้ network drive
# UPLOAD_DIR=\\\\FILESERVER\\EGPB-Uploads

# =================================
# APPLICATION SETTINGS
# =================================

NODE_ENV=production
PORT=3000

# =================================
# BACKUP SETTINGS (Optional)
# =================================

BACKUP_DIR=D:/EGPB-Backups
BACKUP_SCHEDULE=daily
```

**สร้าง Secrets:**

```powershell
# รัน PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Step 2: สร้าง Upload และ Backup Directories

```powershell
# สร้าง directories
New-Item -ItemType Directory -Path "D:\EGPB-Uploads" -Force
New-Item -ItemType Directory -Path "D:\EGPB-Uploads\tickets" -Force
New-Item -ItemType Directory -Path "D:\EGPB-Uploads\engineer-tickets" -Force
New-Item -ItemType Directory -Path "D:\EGPB-Backups" -Force

# Set permissions (optional)
# icacls "D:\EGPB-Uploads" /grant Users:(OI)(CI)F
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Setup Prisma

```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema to database (creates all tables)
npm run prisma:push
```

---

## 📥 Part 4: ย้ายข้อมูลจาก Supabase

### Step 1: Export ข้อมูลจาก Supabase

**วิธีที่ 1: ใช้ Supabase Dashboard**

1. ไปที่ Supabase Dashboard
2. Table Editor → Select table → Export
3. เลือก format: **CSV**
4. Export แต่ละ table:
   - `profiles` → `profiles.csv`
   - `tickets` → `tickets.csv`
   - `engineer_tickets` → `engineer_tickets.csv`
   - `ticket_images` → `ticket_images.csv`
   - `engineer_ticket_images` → `engineer_ticket_images.csv`
   - `ticket_views` → `ticket_views.csv`
   - `ticket_comments` → `ticket_comments.csv` (ถ้ามี)

**วิธีที่ 2: ใช้ psql (Command Line)**

```bash
# Connect to Supabase
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Export tables
\copy profiles TO 'C:/temp/profiles.csv' CSV HEADER;
\copy tickets TO 'C:/temp/tickets.csv' CSV HEADER;
\copy engineer_tickets TO 'C:/temp/engineer_tickets.csv' CSV HEADER;
\copy ticket_images TO 'C:/temp/ticket_images.csv' CSV HEADER;
\copy engineer_ticket_images TO 'C:/temp/engineer_ticket_images.csv' CSV HEADER;
\copy ticket_views TO 'C:/temp/ticket_views.csv' CSV HEADER;

# Exit
\q
```

### Step 2: Transform Data (ถ้าจำเป็น)

สร้างไฟล์ `scripts/transform-data.js`:

```javascript
const fs = require('fs');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');
const bcrypt = require('bcryptjs');

// Transform profiles to users
async function transformProfiles() {
  const profiles = [];
  
  fs.createReadStream('C:/temp/profiles.csv')
    .pipe(csv())
    .on('data', async (row) => {
      // Hash passwords (if needed)
      // Note: Supabase auth passwords can't be exported
      // You'll need to reset all passwords
      const hashedPassword = await bcrypt.hash('TempPassword123!', 10);
      
      profiles.push({
        id: row.id,
        email: row.email || `${row.username}@egpb.local`,
        username: row.username,
        password: hashedPassword,
        role: row.role,
        created_at: row.created_at,
        updated_at: row.updated_at
      });
    })
    .on('end', async () => {
      const csvWriter = createObjectCsvWriter({
        path: 'C:/temp/users_transformed.csv',
        header: [
          { id: 'id', title: 'id' },
          { id: 'email', title: 'email' },
          { id: 'username', title: 'username' },
          { id: 'password', title: 'password' },
          { id: 'role', title: 'role' },
          { id: 'created_at', title: 'created_at' },
          { id: 'updated_at', title: 'updated_at' }
        ]
      });
      
      await csvWriter.writeRecords(profiles);
      console.log('Users transformed!');
    });
}

transformProfiles();
```

### Step 3: Import ข้อมูลเข้า PostgreSQL

**ใช้ psql:**

```bash
# Connect to local PostgreSQL
psql -U egpb_admin -d egpb_ticket_db

# Import users
\copy users(id, email, username, password, role, created_at, updated_at) FROM 'C:/temp/users_transformed.csv' CSV HEADER;

# Import tickets
\copy tickets(id, ticket_number, title, description, department, location, type_of_damage, status, user_id, created_at, updated_at) FROM 'C:/temp/tickets.csv' CSV HEADER;

# Import engineer_tickets
\copy engineer_tickets(id, ticket_number, title, description, department, location, type_of_damage, status, user_id, created_at, updated_at) FROM 'C:/temp/engineer_tickets.csv' CSV HEADER;

# Import ticket_images
\copy ticket_images(id, ticket_id, image_url, uploaded_by, is_completion, created_at) FROM 'C:/temp/ticket_images.csv' CSV HEADER;

# Import engineer_ticket_images
\copy engineer_ticket_images(id, ticket_id, image_url, uploaded_by, is_completion, created_at) FROM 'C:/temp/engineer_ticket_images.csv' CSV HEADER;

# Import ticket_views
\copy ticket_views(id, ticket_id, user_id, viewed_at) FROM 'C:/temp/ticket_views.csv' CSV HEADER;

# Check import
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM tickets;
SELECT COUNT(*) FROM engineer_tickets;

\q
```

### Step 4: ดาวน์โหลดไฟล์แนบจาก Supabase Storage

สร้าง script `scripts/download-images.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
);

async function downloadImages() {
  // List all files in bucket
  const { data: files, error } = await supabase
    .storage
    .from('ticket-images')
    .list();

  if (error) {
    console.error('Error listing files:', error);
    return;
  }

  for (const file of files) {
    const { data, error } = await supabase
      .storage
      .from('ticket-images')
      .download(file.name);

    if (error) {
      console.error(`Error downloading ${file.name}:`, error);
      continue;
    }

    // Save to local directory
    const buffer = Buffer.from(await data.arrayBuffer());
    const localPath = path.join('D:/EGPB-Uploads/tickets', file.name);
    
    fs.writeFileSync(localPath, buffer);
    console.log(`Downloaded: ${file.name}`);
  }

  console.log('All images downloaded!');
}

downloadImages();
```

---

## 🌐 Part 5: Network Configuration

### การเข้าถึงผ่าน Internal Network

**1. หา IP Address ของเครื่อง Server:**

```powershell
ipconfig
# จดบันทึก IPv4 Address เช่น 192.168.1.100
```

**2. เปิด Firewall:**

```powershell
# รัน PowerShell แบบ Administrator

# เปิด port 3000 (Next.js)
New-NetFirewallRule -DisplayName "EGPB Ticket App" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow

# เปิด port 5432 (PostgreSQL - ถ้าต้องการเข้าถึงจากเครื่องอื่น)
New-NetFirewallRule -DisplayName "PostgreSQL" -Direction Inbound -Protocol TCP -LocalPort 5432 -Action Allow
```

**3. Configure PostgreSQL ให้รับ connection จาก network:**

แก้ไขไฟล์ `C:\Program Files\PostgreSQL\16\data\postgresql.conf`:

```conf
# เปิดให้รับ connection จากทุก IP
listen_addresses = '*'
```

แก้ไขไฟล์ `C:\Program Files\PostgreSQL\16\data\pg_hba.conf`:

```conf
# เพิ่มบรรทัดนี้ (ปรับ IP range ตาม network ของคุณ)
host    all    all    192.168.1.0/24    md5
```

**4. Restart PostgreSQL Service:**

```powershell
# รัน PowerShell แบบ Administrator
Restart-Service postgresql-x64-16
```

**5. เปลี่ยน NEXTAUTH_URL ใน `.env.local`:**

```env
NEXTAUTH_URL=http://192.168.1.100:3000
```

---

## 🚀 Part 6: รัน Application

### Development Mode:

```bash
npm run dev
```

### Production Mode:

```bash
# Build
npm run build

# Start
npm start
```

### รันเป็น Windows Service (แนะนำ):

ติดตั้ง `node-windows`:

```bash
npm install -g node-windows
```

สร้างไฟล์ `install-service.js`:

```javascript
const Service = require('node-windows').Service;

const svc = new Service({
  name: 'EGPB Ticket System',
  description: 'EGPB Ticket Management System',
  script: require('path').join(__dirname, 'server.js'),
  nodeOptions: [
    '--max_old_space_size=4096'
  ]
});

svc.on('install', function() {
  svc.start();
});

svc.install();
```

สร้างไฟล์ `server.js`:

```javascript
const { spawn } = require('child_process');

const server = spawn('npm', ['start'], {
  stdio: 'inherit',
  shell: true
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});
```

Install service:

```bash
node install-service.js
```

---

## 💾 Part 7: Backup และ Recovery

### สร้าง Backup Script

สร้างไฟล์ `scripts/backup.bat`:

```batch
@echo off
REM EGPB Ticket Database Backup Script

SET PGPASSWORD=EGPB_Secure_Pass_2024!
SET BACKUP_DIR=D:\EGPB-Backups
SET DATE=%date:~-4%%date:~3,2%%date:~0,2%
SET TIME=%time:~0,2%%time:~3,2%%time:~6,2%
SET TIME=%TIME: =0%

REM Create backup directory if not exists
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Backup database
"C:\Program Files\PostgreSQL\16\bin\pg_dump" -U egpb_admin -h localhost -d egpb_ticket_db -F c -f "%BACKUP_DIR%\egpb_ticket_db_%DATE%_%TIME%.backup"

REM Backup files
xcopy /E /I /Y "D:\EGPB-Uploads" "%BACKUP_DIR%\uploads_%DATE%_%TIME%"

echo Backup completed: %DATE%_%TIME%

REM Delete backups older than 30 days
forfiles /p "%BACKUP_DIR%" /s /m *.backup /d -30 /c "cmd /c del @path"

exit
```

### ตั้งเวลา Backup อัตโนมัติ (Task Scheduler):

```powershell
# รัน PowerShell แบบ Administrator

$action = New-ScheduledTaskAction -Execute "D:\ticket-form-app\scripts\backup.bat"
$trigger = New-ScheduledTaskTrigger -Daily -At 2:00AM
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

Register-ScheduledTask -TaskName "EGPB Ticket Backup" -Action $action -Trigger $trigger -Principal $principal -Description "Daily backup of EGPB Ticket System"
```

### Restore จาก Backup:

```powershell
# ถ้าต้องการ restore

# 1. Stop application
Stop-Service "EGPB Ticket System"

# 2. Restore database
$env:PGPASSWORD = "EGPB_Secure_Pass_2024!"
& "C:\Program Files\PostgreSQL\16\bin\pg_restore" -U egpb_admin -h localhost -d egpb_ticket_db -c "D:\EGPB-Backups\egpb_ticket_db_20240101_020000.backup"

# 3. Restore files
Copy-Item -Path "D:\EGPB-Backups\uploads_20240101_020000\*" -Destination "D:\EGPB-Uploads\" -Recurse -Force

# 4. Start application
Start-Service "EGPB Ticket System"
```

---

## 🔐 Part 8: Security Best Practices

### 1. Database Security:

```sql
-- เปลี่ยนรหัสผ่าน postgres
ALTER USER postgres WITH PASSWORD 'NewStrongPassword!';

-- เปลี่ยนรหัสผ่าน egpb_admin
ALTER USER egpb_admin WITH PASSWORD 'NewStrongPassword!';
```

### 2. Firewall Rules:

- เปิดเฉพาะ port ที่จำเป็น (3000, 5432)
- จำกัด IP range เฉพาะ internal network
- ไม่เปิด port ออกสู่ Internet

### 3. File Permissions:

```powershell
# จำกัดสิทธิ์การเข้าถึงไฟล์
icacls "D:\EGPB-Uploads" /inheritance:r
icacls "D:\EGPB-Uploads" /grant:r "Administrators:(OI)(CI)F"
icacls "D:\EGPB-Uploads" /grant:r "SYSTEM:(OI)(CI)F"
```

### 4. SSL/TLS (Optional สำหรับ internal):

ถ้าต้องการ HTTPS ใน internal network:

```bash
# สร้าง self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

---

## 📊 Part 9: Monitoring และ Maintenance

### ตรวจสอบสถานะ Database:

```sql
-- เข้าสู่ระบบ
psql -U egpb_admin -d egpb_ticket_db

-- ตรวจสอบ table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ตรวจสอบ active connections
SELECT * FROM pg_stat_activity;

-- ตรวจสอบ database size
SELECT pg_size_pretty(pg_database_size('egpb_ticket_db'));
```

### Performance Tuning:

แก้ไขไฟล์ `postgresql.conf`:

```conf
# Memory Settings (สำหรับเครื่องที่มี RAM 8GB+)
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
work_mem = 16MB

# Connection Settings
max_connections = 100

# Logging
logging_collector = on
log_directory = 'pg_log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
```

---

## 🎯 Summary Checklist

### Initial Setup:
- [ ] ติดตั้ง PostgreSQL 16
- [ ] สร้าง database `egpb_ticket_db`
- [ ] สร้าง user `egpb_admin`
- [ ] สร้าง directories (uploads, backups)
- [ ] ตั้งค่า `.env.local`
- [ ] รัน `npm install`
- [ ] รัน `npm run prisma:generate`
- [ ] รัน `npm run prisma:push`

### Data Migration:
- [ ] Export ข้อมูลจาก Supabase (CSV)
- [ ] Transform data (ถ้าจำเป็น)
- [ ] Import ข้อมูลเข้า PostgreSQL
- [ ] ดาวน์โหลดไฟล์แนบจาก Supabase Storage
- [ ] ย้ายไฟล์ไปยัง D:\EGPB-Uploads
- [ ] ตรวจสอบความถูกต้องของข้อมูล

### Network Setup:
- [ ] หา IP Address ของ server
- [ ] เปิด Firewall ports
- [ ] Configure PostgreSQL network access
- [ ] อัพเดต NEXTAUTH_URL
- [ ] ทดสอบการเข้าถึงจากเครื่องอื่นใน network

### Security:
- [ ] เปลี่ยนรหัสผ่าน database
- [ ] ตั้งค่า firewall rules
- [ ] จำกัด file permissions
- [ ] ลบ default accounts (ถ้ามี)

### Backup:
- [ ] สร้าง backup script
- [ ] ทดสอบ backup
- [ ] ตั้ง scheduled task สำหรับ backup อัตโนมัติ
- [ ] ทดสอบ restore

### Production:
- [ ] Build application: `npm run build`
- [ ] ติดตั้ง Windows Service
- [ ] ทดสอบ auto-start หลัง reboot
- [ ] ตั้งค่า monitoring

---

## 🆘 Troubleshooting

### ปัญหา: ไม่สามารถ connect database

**แก้ไข:**
```powershell
# ตรวจสอบ service ทำงานหรือไม่
Get-Service postgresql-x64-16

# Start service ถ้าหยุดทำงาน
Start-Service postgresql-x64-16

# ตรวจสอบ port
netstat -an | findstr "5432"
```

### ปัญหา: ไม่สามารถเข้าถึงจากเครื่องอื่น

**แก้ไข:**
1. ตรวจสอบ firewall
2. ตรวจสอบ `postgresql.conf` → `listen_addresses`
3. ตรวจสอบ `pg_hba.conf` → เพิ่ม network range
4. Restart PostgreSQL service

### ปัญหา: Slow performance

**แก้ไข:**
```sql
-- Analyze tables
ANALYZE;

-- Vacuum database
VACUUM ANALYZE;

-- Rebuild indexes
REINDEX DATABASE egpb_ticket_db;
```

---

## 📞 Support

**Internal IT Support:**
- Email: it-support@egpb.local
- Tel: Ext. 1234
- Location: IT Department, Floor 5

---

**Last Updated:** 2024-01-01  
**Version:** 1.0  
**For Internal Use Only**

