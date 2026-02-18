# 📝 วิธีสร้างไฟล์ .env.local

มี 2 วิธี เลือกวิธีที่ถนัด:

---

## 🚀 วิธีที่ 1: ใช้ Script อัตโนมัติ (แนะนำ)

รัน PowerShell script ที่สร้างให้:

```powershell
# รัน PowerShell (ไม่ต้อง Admin)
.\create-env.ps1
```

Script จะ:
- ✅ Generate secrets อัตโนมัติ
- ✅ ถามรหัสผ่าน database
- ✅ หา IP address ให้อัตโนมัติ
- ✅ สร้างไฟล์ `.env.local` พร้อมใช้

---

## ✋ วิธีที่ 2: สร้างเอง (Manual)

### Step 1: Generate Secrets

เปิด PowerShell รันคำสั่งนี้ 2 ครั้ง:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

จะได้ secret 2 ตัว เช่น:
```
kX9mP2vL8qR4tY6wE3zA1sD5fG7hJ0kM
nB3mK9pQ2wE5rT8yU1iO0pA4sD7fG6hJ
```

### Step 2: Copy Template

```powershell
# Copy template
Copy-Item .env.template .env.local
```

### Step 3: แก้ไขไฟล์

เปิดไฟล์ `.env.local` และแก้ไข:

```env
# 1. ใส่รหัสผ่าน PostgreSQL
DATABASE_URL="postgresql://egpb_admin:YOUR_PASSWORD@localhost:5432/egpb_ticket_db?schema=public"
DIRECT_URL="postgresql://egpb_admin:YOUR_PASSWORD@localhost:5432/egpb_ticket_db?schema=public"

# 2. ใส่ secrets ที่ generate ไว้
NEXTAUTH_SECRET="kX9mP2vL8qR4tY6wE3zA1sD5fG7hJ0kM"
JWT_SECRET="nB3mK9pQ2wE5rT8yU1iO0pA4sD7fG6hJ"

# 3. ใส่ URL (localhost หรือ IP ของเครื่อง)
NEXTAUTH_URL="http://localhost:3000"
# หรือ
NEXTAUTH_URL="http://192.168.1.100:3000"

# 4. ตรวจสอบ paths
UPLOAD_DIR="D:/EGPB-Uploads"
BACKUP_DIR="D:/EGPB-Backups"
```

### Step 4: บันทึกไฟล์

บันทึกและปิด

---

## 📋 Template สำเร็จรูป

สร้างไฟล์ `.env.local` ด้วย content นี้:

```env
# ========================================
# EGPB Ticket System - Environment Variables
# ========================================

DATABASE_URL="postgresql://egpb_admin:CHANGE_PASSWORD@localhost:5432/egpb_ticket_db?schema=public"
DIRECT_URL="postgresql://egpb_admin:CHANGE_PASSWORD@localhost:5432/egpb_ticket_db?schema=public"

NEXTAUTH_SECRET="GENERATE_SECRET_1"
JWT_SECRET="GENERATE_SECRET_2"
NEXTAUTH_URL="http://localhost:3000"

UPLOAD_DIR="D:/EGPB-Uploads"
BACKUP_DIR="D:/EGPB-Backups"

NODE_ENV="development"
PORT=3000
```

แล้วแก้:
- `CHANGE_PASSWORD` → รหัสผ่าน PostgreSQL ของคุณ
- `GENERATE_SECRET_1` → secret ตัวแรก
- `GENERATE_SECRET_2` → secret ตัวสอง

---

## ✅ ตรวจสอบไฟล์

```powershell
# ดูว่าไฟล์มีหรือยัง
Test-Path .env.local

# ดู content (ระวัง! มี password)
Get-Content .env.local
```

---

## 🔐 Security Tips

1. **ห้าม commit** `.env.local` เข้า Git
2. **Backup** ไฟล์นี้ไว้ที่ปลอดภัย
3. **ใช้รหัสผ่านที่แข็งแรง** (12+ characters)
4. **เปลี่ยนรหัสผ่านเป็นระยะ**

---

## 🆘 Troubleshooting

### ไม่สามารถรัน script ได้

```powershell
# เปลี่ยน execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# ลองรันใหม่
.\create-env.ps1
```

### ไฟล์ไม่มี

```powershell
# ตรวจสอบว่าอยู่ใน directory ที่ถูกต้อง
Get-Location

# ควรเป็น: F:\ticket-form-app
cd F:\ticket-form-app
```

---

## 📞 Need Help?

ดูเอกสารเพิ่มเติม:
- `ON-PREMISE-SETUP.md` - Quick start guide
- `INTERNAL-SETUP-GUIDE.md` - Full guide

