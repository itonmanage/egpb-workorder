# ลบ Email Field จาก User Management

## 🎯 สิ่งที่ทำเสร็จแล้ว

✅ แก้ไข Prisma Schema (ลบ email field)
✅ แก้ไข User APIs (ลบ email validation และ queries)
✅ แก้ไข Manage Users Page (ลบ email column และ form field)
✅ แก้ไข Migration Script (ลบ email)
✅ แก้ไข Seed Script (ลบ email)

---

## ⚠️ ขั้นตอนที่ต้องทำต่อ

### วิธีที่ 1: ใช้ Script อัตโนมัติ (แนะนำ)

```bash
# 1. หยุด dev server (กด Ctrl+C ใน terminal ที่รัน npm run dev)

# 2. รัน script
scripts\remove-email-field.bat

# 3. เริ่ม dev server ใหม่
npm run dev
```

---

### วิธีที่ 2: ทำทีละขั้นตอน (Manual)

#### Step 1: หยุด Dev Server
```bash
# กด Ctrl+C ใน terminal ที่รัน npm run dev
```

#### Step 2: Drop email column จาก database
```bash
# เปิด PowerShell และรัน:
$env:PGPASSWORD='Egp2927'
F:\postgres\bin\psql -U egpb_admin -d egpb_ticket_db

# ใน psql prompt พิมพ์:
ALTER TABLE users DROP COLUMN IF EXISTS email;

# ออกจาก psql:
\q
```

#### Step 3: Generate Prisma Client
```bash
npm run prisma:generate
```

#### Step 4: เริ่ม dev server ใหม่
```bash
npm run dev
```

---

## ✅ หลังจากทำเสร็จแล้ว

Manage Users จะแสดงเฉพาะ:
- Username (ใช้สำหรับ login)
- Role
- Created At
- Actions (Edit, Delete)

**ไม่มี Email column อีกต่อไป!** ✨

---

## 🔍 ตรวจสอบว่าสำเร็จหรือไม่

1. ไปที่ http://10.70.0.34:3001/dashboard/users
2. ตาราง users ไม่ควรมี Email column
3. Modal Add/Edit user ไม่ควรมี Email field
4. สามารถ Create/Edit user ได้ปกติ (ใช้แค่ username)

---

## 📁 ไฟล์ที่แก้ไข

```
✅ prisma/schema.prisma                      - ลบ email field
✅ app/api/users/route.ts                    - ลบ email validation
✅ app/api/users/[id]/route.ts               - ลบ email query
✅ app/dashboard/users/page.tsx              - ลบ email column และ form
✅ scripts/migrate-users-from-supabase.js    - ลบ email
✅ prisma/seed.ts                            - ลบ email
✅ scripts/remove-email-field.bat            - Script ลบ email (ใหม่)
```

---

## ⚡ Quick Command

หยุด dev server แล้วรัน:

```powershell
$env:PGPASSWORD='Egp2927'; F:\postgres\bin\psql -U egpb_admin -d egpb_ticket_db -c "ALTER TABLE users DROP COLUMN IF EXISTS email;"; npm run prisma:generate
```

แล้วเริ่ม dev server ใหม่:

```bash
npm run dev
```

---

**Status**: ⏳ รอ drop email column จาก database

