# คู่มือการ Deploy Next.js Standalone บน Windows 11 Pro

คู่มือนี้จะแนะนำวิธีการ deploy Next.js application แบบ standalone บน Windows 11 Pro โดยใช้ PM2 สำหรับจัดการ process

---

## 📋 สารบัญ

1. [สิ่งที่ต้องเตรียม](#สิ่งที่ต้องเตรียม)
2. [การติดตั้งครั้งแรก](#การติดตั้งครั้งแรก)
3. [การ Deploy/Update](#การ-deployupdate)
4. [การ Rollback](#การ-rollback)
5. [การตรวจสอบและ Monitoring](#การตรวจสอบและ-monitoring)
6. [การแก้ไขปัญหา](#การแก้ไขปัญหา)
7. [คำสั่งที่เป็นประโยชน์](#คำสั่งที่เป็นประโยชน์)

---

## สิ่งที่ต้องเตรียม

### บน Windows 11 Pro

1. **Node.js** (version 18 หรือสูงกว่า)
   ```powershell
   # ตรวจสอบ version
   node --version
   
   # ถ้ายังไม่มี ดาวน์โหลดจาก
   # https://nodejs.org/
   ```

2. **npm** (มากับ Node.js)
   ```powershell
   npm --version
   ```

3. **PM2** (จะติดตั้งอัตโนมัติผ่าน deployment script)
   ```powershell
   # หรือติดตั้งเองก่อนได้
   npm install -g pm2
   npm install -g pm2-windows-startup
   pm2-startup install
   ```

4. **PostgreSQL** (ต้องรันอยู่แล้ว)
   ```powershell
   # ตรวจสอบว่า PostgreSQL รันอยู่
   Get-Service postgresql*
   ```

5. **PowerShell** (มีมากับ Windows 11 อยู่แล้ว)
   ```powershell
   # ตรวจสอบ version
   $PSVersionTable.PSVersion
   ```

6. **Execution Policy** (ต้องอนุญาตให้รัน scripts)
   ```powershell
   # ตรวจสอบ
   Get-ExecutionPolicy
   
   # ถ้าเป็น Restricted ให้เปลี่ยนเป็น RemoteSigned
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

---

## การติดตั้งครั้งแรก

### ขั้นตอนที่ 1: เตรียม Application Directory

```powershell
# สร้าง directory สำหรับ application (ถ้ายังไม่มี)
# หรือใช้ directory ที่มีอยู่แล้ว
cd D:\ticket-form-app
```

### ขั้นตอนที่ 2: ตั้งค่า Environment Variables

```powershell
# คัดลอก template
Copy-Item env.production.example .env.production

# แก้ไขค่าให้ตรงกับ server
notepad .env.production
```

**ตัวอย่าง `.env.production`:**
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/ticket_db"
JWT_SECRET="your-super-secret-jwt-key-here"
NODE_ENV="production"
PORT=3000
NEXT_PUBLIC_APP_URL="http://your-server-ip:3000"
```

> **⚠️ สำคัญ:** 
> - เปลี่ยน `JWT_SECRET` ให้เป็นค่าที่ปลอดภัย
> - แก้ `DATABASE_URL` ให้ตรงกับ PostgreSQL ของคุณ
> - แก้ `NEXT_PUBLIC_APP_URL` ให้ตรงกับ IP/domain ของ server

### ขั้นตอนที่ 3: ติดตั้ง Dependencies

```powershell
npm install
```

### ขั้นตอนที่ 4: Setup Database

```powershell
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

### ขั้นตอนที่ 5: Deploy ครั้งแรก

```powershell
# รัน deployment script
.\deploy.ps1
```

Script จะทำการ:
- ✅ ตรวจสอบ prerequisites
- ✅ Build standalone
- ✅ Copy static files
- ✅ Start PM2
- ✅ ตรวจสอบสถานะ

### ขั้นตอนที่ 6: ตั้งค่า PM2 ให้ start อัตโนมัติเมื่อ reboot

```powershell
# ติดตั้ง pm2-windows-startup (ถ้ายังไม่มี)
npm install -g pm2-windows-startup

# ตั้งค่า startup
pm2-startup install

# Save configuration
pm2 save
```

### ขั้นตอนที่ 7: ตรวจสอบว่า Application รันได้

```powershell
# ตรวจสอบ PM2 status
pm2 status

# ตรวจสอบ logs
pm2 logs ticket-app

# ทดสอบเข้าเว็บ
Start-Process "http://localhost:3000"
```

---

## การ Deploy/Update

เมื่อมี code ใหม่ที่ต้องการ deploy:

### วิธีที่ 1: ใช้ Deployment Script (แนะนำ)

```powershell
cd D:\ticket-form-app

# Pull code ใหม่ (ถ้าใช้ Git)
git pull origin main

# Deploy (จะทำ backup อัตโนมัติ)
.\deploy.ps1
```

**Deployment script จะทำอะไรบ้าง:**
1. ✅ Backup version เก่าอัตโนมัติ
2. ✅ ตรวจสอบ database migration
3. ✅ Build standalone ใหม่
4. ✅ Reload PM2 แบบ zero-downtime
5. ✅ ตรวจสอบว่า app รันสำเร็จ
6. ✅ Rollback อัตโนมัติถ้ามีปัญหา

### วิธีที่ 2: Manual Deploy

```powershell
# 1. Pull code (ถ้าใช้ Git)
git pull origin main

# 2. Install dependencies
npm ci --production=false

# 3. Build
npm run build

# 4. Copy static files
Copy-Item -Path .next\static -Destination .next\standalone\.next\ -Recurse -Force
Copy-Item -Path public -Destination .next\standalone\ -Recurse -Force

# 5. Reload PM2
pm2 reload ecosystem.config.js --update-env
```

---

## การ Rollback

ถ้า deployment มีปัญหา สามารถ rollback ได้ทันที:

```powershell
.\rollback.ps1
```

Script จะ:
1. แสดงรายการ backup ที่มี
2. ให้เลือก version ที่ต้องการ rollback
3. Backup version ปัจจุบันก่อน rollback
4. Rollback และ reload PM2
5. ตรวจสอบว่า app รันสำเร็จ

**ตัวอย่างการใช้งาน:**
```
📋 รายการ backup ที่มีอยู่:

[1] 20231226 14:30:00 (Size: 45M)
[2] 20231225 10:15:00 (Size: 44M)
[3] 20231224 16:45:00 (Size: 43M)

เลือกหมายเลข backup ที่ต้องการ rollback (1-3): 2
```

> **⚠️ คำเตือน:** Rollback จะเปลี่ยนเฉพาะ application code เท่านั้น **Database จะไม่ถูกแตะต้อง**

---

## การตรวจสอบและ Monitoring

### ตรวจสอบสถานะ PM2

```bash
# ดู status
pm2 status

# ดู monitoring แบบ real-time
pm2 monit

# ดู resource usage
pm2 list
```

### ตรวจสอบ Logs

```powershell
# ดู logs แบบ real-time
pm2 logs ticket-app

# ดู error logs เท่านั้น
pm2 logs ticket-app --err

# ดู logs ย้อนหลัง
Get-Content logs\pm2-error.log -Tail 50 -Wait
Get-Content logs\pm2-out.log -Tail 50 -Wait
```

### ตรวจสอบ Application Health

```powershell
# ทดสอบว่า app ตอบสนอง
Invoke-WebRequest http://localhost:3000

# ตรวจสอบ memory usage
pm2 show ticket-app
```

---

## การแก้ไขปัญหา

### ปัญหา: Application ไม่ start

**อาการ:** PM2 status แสดง "errored" หรือ "stopped"

**วิธีแก้:**
```powershell
# 1. ดู error logs
pm2 logs ticket-app --err

# 2. ตรวจสอบ environment variables
Get-Content .env.production

# 3. ตรวจสอบ database connection
npx prisma db pull

# 4. ลองรันแบบ manual เพื่อดู error
cd .next\standalone
node server.js
```

### ปัญหา: Database connection error

**อาการ:** Error "Can't reach database server"

**วิธีแก้:**
```powershell
# 1. ตรวจสอบว่า PostgreSQL รันอยู่
Get-Service postgresql*

# 2. ตรวจสอบ DATABASE_URL ใน .env.production
Get-Content .env.production | Select-String DATABASE_URL

# 3. ทดสอบ connection
npx prisma db pull
```

### ปัญหา: Port already in use

**อาการ:** Error "EADDRINUSE: address already in use :::3000"

**วิธีแก้:**
```powershell
# 1. หา process ที่ใช้ port 3000
Get-NetTCPConnection -LocalPort 3000

# 2. Kill process เก่า
pm2 delete ticket-app

# 3. Start ใหม่
pm2 start ecosystem.config.js
```

### ปัญหา: Out of memory

**อาการ:** PM2 restart บ่อยๆ, logs แสดง "JavaScript heap out of memory"

**วิธีแก้:**
```powershell
# แก้ไข ecosystem.config.js เพิ่ม memory limit
notepad ecosystem.config.js

# เพิ่ม node_args
node_args: '--max-old-space-size=2048',  # 2GB

# Reload
pm2 reload ecosystem.config.js
```

### ปัญหา: Static files ไม่โหลด (404)

**อาการ:** Images, CSS, JS ไม่โหลด

**วิธีแก้:**
```powershell
# ตรวจสอบว่า copy static files แล้ว
Get-ChildItem .next\standalone\.next\static
Get-ChildItem .next\standalone\public

# ถ้าไม่มี ให้ copy ใหม่
Copy-Item -Path .next\static -Destination .next\standalone\.next\ -Recurse -Force
Copy-Item -Path public -Destination .next\standalone\ -Recurse -Force

# Reload PM2
pm2 reload ticket-app
```

---

## คำสั่งที่เป็นประโยชน์

### PM2 Commands

```bash
# Start application
pm2 start ecosystem.config.js

# Stop application
pm2 stop ticket-app

# Restart application
pm2 restart ticket-app

# Reload (zero-downtime)
pm2 reload ticket-app

# Delete from PM2
pm2 delete ticket-app

# View logs
pm2 logs ticket-app

# Clear logs
pm2 flush

# Monitoring
pm2 monit

# Show detailed info
pm2 show ticket-app

# Save PM2 configuration
pm2 save

# Resurrect saved processes
pm2 resurrect
```

### Application Commands

```bash
# Build standalone
npm run build

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Open Prisma Studio (database GUI)
npx prisma studio

# Check migration status
npx prisma migrate status
```

### System Commands

```bash
# ตรวจสอบ disk space
df -h

# ตรวจสอบ memory
free -h

# ตรวจสอบ CPU
top

# ตรวจสอบ network
netstat -tulpn | grep :3000

# ดู system logs
journalctl -u pm2-<user> -f
```

---

## 🔒 Security Best Practices

1. **Environment Variables**
   - ไม่ commit `.env.production` เข้า git
   - ใช้ strong JWT_SECRET
   - เปลี่ยน database password เป็นค่าที่ปลอดภัย

2. **File Permissions**
   ```bash
   # ตั้งค่า permission ที่เหมาะสม
   chmod 600 .env.production
   chmod 755 deploy.sh rollback.sh
   ```

3. **Firewall**
   ```bash
   # เปิดเฉพาะ port ที่จำเป็น
   sudo ufw allow 3000/tcp
   sudo ufw enable
   ```

4. **Regular Updates**
   ```bash
   # Update dependencies เป็นประจำ
   npm audit
   npm audit fix
   ```

---

## 📊 Performance Tuning

### เพิ่ม PM2 Cluster Mode (ถ้าต้องการ)

แก้ไข `ecosystem.config.js`:
```javascript
instances: 'max',  // ใช้ทุก CPU cores
exec_mode: 'cluster',
```

### เพิ่ม Memory Limit

```javascript
max_memory_restart: '2G',  // เพิ่มเป็น 2GB
```

### Enable Log Rotation

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

---

## 🆘 ติดต่อและขอความช่วยเหลือ

ถ้ามีปัญหาหรือข้อสงสัย:

1. ตรวจสอบ logs: `pm2 logs ticket-app`
2. ตรวจสอบ deployment logs: `cat logs/deployment.log`
3. ตรวจสอบ rollback logs: `cat logs/rollback.log`

---

## 📝 Checklist การ Deploy

- [ ] Pull code ล่าสุด
- [ ] ตรวจสอบ `.env.production`
- [ ] Backup database (ถ้ามี migration)
- [ ] รัน `./deploy.sh`
- [ ] ตรวจสอบ `pm2 status`
- [ ] ทดสอบเข้าเว็บ
- [ ] ตรวจสอบ logs
- [ ] แจ้งทีมว่า deploy เสร็จแล้ว

---

**เอกสารนี้อัพเดทล่าสุด:** 26 ธันวาคม 2567
