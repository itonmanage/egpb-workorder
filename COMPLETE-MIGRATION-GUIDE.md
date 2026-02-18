# 🚀 Complete Migration Guide: Supabase → PostgreSQL

## 📋 ภาพรวม

Migration script นี้จะดึงข้อมูล**ทั้งหมด**จาก Supabase มายัง PostgreSQL บน server:

### ข้อมูลที่จะ Migrate:
- ✅ **Users** (profiles)
- ✅ **IT Tickets** (tickets)
- ✅ **Engineer Tickets** (engineer_tickets)
- ✅ **Ticket Images** (ticket_images)
- ✅ **Engineer Ticket Images** (engineer_ticket_images)
- ✅ **Ticket Comments** (ticket_comments)
- ✅ **Engineer Ticket Comments** (engineer_ticket_comments)

---

## ⚙️ ก่อนเริ่ม Migration

### 1. เตรียม Supabase Credentials

แก้ไขไฟล์ `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 2. ตรวจสอบ PostgreSQL

```bash
# ตรวจสอบว่า PostgreSQL รันอยู่
psql -U egpb_admin -d egpb_ticket_db -c "\dt"
```

### 3. ตรวจสอบ Prisma

```bash
# Generate Prisma Client
npm run prisma:generate
```

---

## 🚀 วิธี Migrate ข้อมูล

### วิธีที่ 1: Migrate ทั้งหมดพร้อมกัน (แนะนำ)

```bash
npm run migrate:all
```

**Script นี้จะ**:
1. Migrate Users (พร้อม hash password)
2. Migrate IT Tickets
3. Migrate Engineer Tickets  
4. Migrate Ticket Images (พร้อมดาวน์โหลดรูปภาพ)
5. Migrate Engineer Ticket Images (พร้อมดาวน์โหลดรูปภาพ)
6. Migrate Ticket Comments
7. Migrate Engineer Ticket Comments
8. แสดง Summary Report

---

### วิธีที่ 2: Migrate ทีละส่วน

```bash
# 1. Migrate Users ก่อน
npm run migrate:users

# 2. Migrate Tickets
npm run migrate:tickets

# 3. Download Images (ถ้าต้องการ)
npm run download:images
```

---

## 📊 ตัวอย่าง Output

```
╔════════════════════════════════════════════════════════════════════╗
║         🚀 Complete Supabase → PostgreSQL Migration               ║
╚════════════════════════════════════════════════════════════════════╝

📥 [1/7] Migrating Users...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Found 10 users
  ✅ admin (ADMIN)
  ✅ user1 (USER)
  ⏭️  user2 (exists)

📥 [2/7] Migrating IT Tickets...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Found 50 tickets
  ✅ TK-001
  ✅ TK-002
  ⏭️  TK-003 (exists)

...

╔════════════════════════════════════════════════════════════════════╗
║                    📊 MIGRATION SUMMARY                            ║
╚════════════════════════════════════════════════════════════════════╝

Users:
  ✅ Success: 8
  ⏭️  Skipped: 2
  ❌ Errors:  0
  📝 Total:   10

IT Tickets:
  ✅ Success: 45
  ⏭️  Skipped: 5
  ❌ Errors:  0
  📝 Total:   50

...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GRAND TOTAL:
  ✅ 150 migrated
  ⏭️  20 skipped
  ❌ 0 errors
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  IMPORTANT: Migrated users have default password: ChangeMe123!
   Users should change their password on first login.

🎉 Migration completed!
```

---

## ✨ Features

### 1. Smart Migration
- ✅ ตรวจสอบ duplicate (skip ถ้ามีอยู่แล้ว)
- ✅ ตรวจสอบ foreign keys (user_id, ticket_id)
- ✅ Auto map roles (Supabase → PostgreSQL)
- ✅ Handle null values
- ✅ Preserve timestamps

### 2. Image Handling
- ✅ ดาวน์โหลดรูปจาก Supabase Storage
- ✅ บันทึกไว้ใน `public/uploads/`
- ✅ อัพเดท URL เป็น local path
- ✅ Skip ถ้าดาวน์โหลดไว้แล้ว

### 3. Error Handling
- ✅ Continue on error (ไม่หยุด migration)
- ✅ แสดง error message ละเอียด
- ✅ Summary report ตอนจบ

### 4. Security
- ✅ Password ถูก hash ด้วย bcrypt (10 rounds)
- ✅ Default password: `ChangeMe123!`
- ✅ Users ควรเปลี่ยน password ทันที

---

## 🔍 ตรวจสอบผลลัพธ์

### 1. ตรวจสอบจำนวน Records

```bash
# ใน PowerShell
$env:PGPASSWORD='Egp2927'

# Users
F:\postgres\bin\psql -U egpb_admin -d egpb_ticket_db -c "SELECT COUNT(*) FROM users;"

# Tickets
F:\postgres\bin\psql -U egpb_admin -d egpb_ticket_db -c "SELECT COUNT(*) FROM tickets;"

# Engineer Tickets
F:\postgres\bin\psql -U egpb_admin -d egpb_ticket_db -c "SELECT COUNT(*) FROM engineer_tickets;"

# Images
F:\postgres\bin\psql -U egpb_admin -d egpb_ticket_db -c "SELECT COUNT(*) FROM ticket_images;"
```

### 2. ตรวจสอบ Sample Data

```bash
# ดู users ล่าสุด
F:\postgres\bin\psql -U egpb_admin -d egpb_ticket_db -c "SELECT username, role, created_at FROM users ORDER BY created_at DESC LIMIT 5;"

# ดู tickets ล่าสุด
F:\postgres\bin\psql -U egpb_admin -d egpb_ticket_db -c "SELECT ticket_number, title, status, created_at FROM tickets ORDER BY created_at DESC LIMIT 5;"
```

### 3. ตรวจสอบ Images

```bash
# ตรวจสอบว่ารูปดาวน์โหลดมาหรือยัง
dir public\uploads
```

---

## ⚠️ Troubleshooting

### ❌ Error: "Supabase credentials not found"

**แก้ไข**:
```bash
# เพิ่มใน .env.local
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### ❌ Error: "Environment variable not found: DATABASE_URL"

**แก้ไข**:
```bash
# ตรวจสอบว่ามีไฟล์ .env
cat .env

# ถ้าไม่มี สร้างใหม่
echo 'DATABASE_URL="postgresql://egpb_admin:EGPB_Secure_Pass_2024!@localhost:5432/egpb_ticket_db?schema=public"' > .env
```

### ❌ Error: "Foreign key constraint failed"

**สาเหตุ**: User ไม่มีในระบบ

**แก้ไข**:
```bash
# Migrate users ก่อน
npm run migrate:users

# แล้วค่อย migrate tickets
npm run migrate:all
```

### ❌ Error: "EPERM: operation not permitted"

**สาเหตุ**: Dev server กำลังรันอยู่

**แก้ไข**:
```bash
# หยุด dev server (Ctrl+C) แล้วลองใหม่
```

### ⚠️ Warning: "Failed to download image"

**ไม่ต้องกังวล**: Script จะใช้ URL เดิมต่อ และ continue migration

---

## 🔄 Re-run Migration

Script นี้ **safe to re-run**:
- ✅ ข้อมูลที่มีอยู่แล้วจะถูก skip
- ✅ ข้อมูลใหม่เท่านั้นที่จะถูก migrate
- ✅ ไม่มี duplicate data

```bash
# สามารถรันซ้ำได้ทุกเมื่อ
npm run migrate:all
```

---

## 📁 ไฟล์ที่เกี่ยวข้อง

```
scripts/
├── migrate-all-from-supabase.js      # ✅ Complete migration (ใหม่)
├── migrate-users-from-supabase.js    # Users only
├── migrate-from-supabase.js          # Tickets only
└── download-images.js                # Images only

package.json                          # npm run migrate:all

.env.local                            # Supabase credentials
.env                                  # PostgreSQL connection
```

---

## 🎯 Quick Commands

### เตรียมพร้อม:
```bash
# 1. เพิ่ม Supabase credentials ใน .env.local
# 2. Generate Prisma Client
npm run prisma:generate
```

### Migration:
```bash
# Migrate ทั้งหมด (แนะนำ)
npm run migrate:all
```

### ตรวจสอบ:
```bash
# ดูจำนวน users
$env:PGPASSWORD='Egp2927'; F:\postgres\bin\psql -U egpb_admin -d egpb_ticket_db -c "SELECT COUNT(*) FROM users;"

# ดูจำนวน tickets
$env:PGPASSWORD='Egp2927'; F:\postgres\bin\psql -U egpb_admin -d egpb_ticket_db -c "SELECT COUNT(*) FROM tickets;"
```

---

## ✅ Checklist

การ Migrate สำเร็จเมื่อ:

- [ ] Migration script รันเสร็จไม่มี error
- [ ] จำนวน records ตรงกับใน Supabase
- [ ] สามารถ login ได้ (password: `ChangeMe123!`)
- [ ] ดู tickets ใน Dashboard ได้
- [ ] รูปภาพแสดงได้ (อยู่ใน `public/uploads/`)
- [ ] Comments แสดงได้

---

## 🎉 หลัง Migration เสร็จ

### 1. แจ้ง Users เปลี่ยน Password
```
Default password: ChangeMe123!
Users ควรเปลี่ยนทันทีเมื่อ login ครั้งแรก
```

### 2. Backup Database
```bash
npm run backup:db
```

### 3. ปิด Supabase (Optional)
- ข้อมูลทั้งหมดอยู่ใน PostgreSQL แล้ว
- สามารถปิด Supabase project ได้

---

## 📞 Support

หากมีปัญหา:
1. ดู error message ใน console
2. ตรวจสอบ Troubleshooting section
3. ตรวจสอบว่า Supabase credentials ถูกต้อง
4. ตรวจสอบว่า PostgreSQL รันอยู่

---

**Status**: ✅ **READY TO MIGRATE**  
**Last Updated**: 2025-11-29

🚀 **พร้อม Migrate ข้อมูลจาก Supabase แล้ว!**

