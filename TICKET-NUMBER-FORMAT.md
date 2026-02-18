# 🎫 Ticket Number Format

## 📋 ภาพรวม

ระบบใช้รูปแบบ Ticket Number ที่แยกตามประเภทและปี:

```
IT Tickets:       EGPB-IT25-00001, EGPB-IT25-00002, ...
Engineer Tickets: EGPB-EN25-00001, EGPB-EN25-00002, ...
```

---

## 🏗️ โครงสร้าง

### Format: `EGPB-{TYPE}{YEAR}-{NUMBER}`

| ส่วน | คำอธิบาย | ตัวอย่าง |
|------|---------|---------|
| **EGPB** | Company prefix (ไม่เปลี่ยน) | EGPB |
| **TYPE** | ประเภท ticket (IT/EN) | IT หรือ EN |
| **YEAR** | ปี (2 หลักท้าย) | 25 (2025) |
| **NUMBER** | เลขลำดับ (5 หลัก) | 00001, 00042, 12345 |

---

## 📊 ตัวอย่าง

### IT Tickets:
```
EGPB-IT25-00001  ← Ticket แรกของปี 2025
EGPB-IT25-00002
EGPB-IT25-00003
...
EGPB-IT25-00099
EGPB-IT25-00100
...
EGPB-IT25-99999  ← Maximum
```

### Engineer Tickets:
```
EGPB-EN25-00001  ← Ticket แรกของปี 2025
EGPB-EN25-00002
EGPB-EN25-00003
...
EGPB-EN25-00099
EGPB-EN25-00100
...
EGPB-EN25-99999  ← Maximum
```

---

## 🔄 การทำงาน

### Auto-generate:
1. **ตรวจสอบปี**: ดึงปีปัจจุบัน (2 หลักท้าย)
2. **หา Ticket ล่าสุด**: ค้นหา ticket number สูงสุดในปีนั้น
3. **นับต่อ**: เพิ่มเลขลำดับ +1
4. **Format**: เติม leading zeros ให้ครบ 5 หลัก

### ตัวอย่าง:
```javascript
// ถ้า latest ticket = EGPB-IT25-00042
// Next ticket = EGPB-IT25-00043

// ถ้าไม่มี ticket ในปีนี้
// Next ticket = EGPB-IT25-00001
```

---

## 🔀 ปีใหม่

เมื่อปีเปลี่ยน (เช่น 2025 → 2026):

### ก่อน (ปี 2025):
```
EGPB-IT25-00999  ← Ticket สุดท้ายของปี 2025
```

### หลัง (ปี 2026):
```
EGPB-IT26-00001  ← Ticket แรกของปี 2026
EGPB-IT26-00002
...
```

**Reset เลขลำดับเป็น 00001 อัตโนมัติ!**

---

## 💻 Code Implementation

### Helper Function: `lib/ticket-number.ts`

```typescript
// IT Tickets
export async function generateITTicketNumber(): Promise<string> {
  const year = getYearSuffix(); // "25"
  const prefix = `EGPB-IT${year}-`; // "EGPB-IT25-"
  
  // Find latest ticket with this prefix
  const latestTicket = await prisma.ticket.findFirst({
    where: { ticketNumber: { startsWith: prefix } },
    orderBy: { ticketNumber: 'desc' },
  });
  
  let nextNumber = 1;
  if (latestTicket) {
    const lastNumber = latestTicket.ticketNumber.split('-').pop();
    nextNumber = parseInt(lastNumber, 10) + 1;
  }
  
  const formattedNumber = nextNumber.toString().padStart(5, '0');
  return `${prefix}${formattedNumber}`; // "EGPB-IT25-00001"
}

// Engineer Tickets
export async function generateEngineerTicketNumber(): Promise<string> {
  // Same logic with "EGPB-EN{year}-" prefix
}
```

---

## 🔍 Validation

### Format Check:
```typescript
function validateTicketNumber(ticketNumber: string, type: 'IT' | 'EN'): boolean {
  const year = getYearSuffix();
  const pattern = new RegExp(`^EGPB-${type}${year}-\\d{5}$`);
  return pattern.test(ticketNumber);
}

// Examples:
validateTicketNumber('EGPB-IT25-00001', 'IT') // ✅ true
validateTicketNumber('EGPB-EN25-00042', 'EN') // ✅ true
validateTicketNumber('TK-001', 'IT')           // ❌ false
validateTicketNumber('EGPB-IT25-1', 'IT')      // ❌ false (ไม่ครบ 5 หลัก)
```

---

## 📝 Usage

### API Routes:

**IT Tickets** (`app/api/tickets/route.ts`):
```typescript
import { generateITTicketNumber } from '@/lib/ticket-number';

// POST /api/tickets
const ticketNumber = await generateITTicketNumber();
const ticket = await prisma.ticket.create({
  data: {
    ticketNumber,
    // ... other fields
  },
});
```

**Engineer Tickets** (`app/api/engineer-tickets/route.ts`):
```typescript
import { generateEngineerTicketNumber } from '@/lib/ticket-number';

// POST /api/engineer-tickets
const ticketNumber = await generateEngineerTicketNumber();
const ticket = await prisma.engineerTicket.create({
  data: {
    ticketNumber,
    // ... other fields
  },
});
```

---

## 📊 Database Schema

### Ticket Number Field:
```prisma
model Ticket {
  id           String @id @default(uuid())
  ticketNumber String @unique @map("ticket_number")
  // ... other fields
  
  @@index([ticketNumber])
}

model EngineerTicket {
  id           String @unique @map("ticket_number")
  ticketNumber String @unique @map("ticket_number")
  // ... other fields
  
  @@index([ticketNumber])
}
```

**ต้องมี `@unique` เพื่อป้องกัน duplicate!**

---

## 🎯 Benefits

### ✅ ข้อดี:

1. **แยกประเภทชัด**: IT vs Engineer
2. **แยกตามปี**: Reset ทุกปีใหม่
3. **เรียงลำดับง่าย**: 00001, 00002, ...
4. **ไม่ซ้ำกัน**: Unique constraint
5. **อ่านง่าย**: มนุษย์เข้าใจได้ทันที

### 📊 Capacity:

- **ต่อประเภท**: 99,999 tickets/year
- **รวมทั้งหมด**: 199,998 tickets/year (IT + EN)

---

## 🔄 Migration จาก Format เก่า

### ถ้ามี tickets ในรูปแบบเก่า (TK-001):

```sql
-- ไม่ต้องแก้ไข tickets เก่า
-- Tickets ใหม่จะใช้ format ใหม่โดยอัตโนมัติ
```

**Tickets เก่ายังคงใช้งานได้ปกติ!**

---

## 📈 ตัวอย่าง Production

### ปี 2025:
```
IT Tickets:
  EGPB-IT25-00001 ← มกราคม
  EGPB-IT25-00002
  ...
  EGPB-IT25-00523 ← มิถุนายน
  ...
  EGPB-IT25-01234 ← ธันวาคม

Engineer Tickets:
  EGPB-EN25-00001 ← มกราคม
  ...
  EGPB-EN25-00789 ← ธันวาคม
```

### ปี 2026:
```
IT Tickets:
  EGPB-IT26-00001 ← Reset เริ่มใหม่!
  ...

Engineer Tickets:
  EGPB-EN26-00001 ← Reset เริ่มใหม่!
  ...
```

---

## 🎉 สรุป

| Feature | Description |
|---------|-------------|
| **Format** | `EGPB-{TYPE}{YEAR}-{NUMBER}` |
| **Types** | IT, EN |
| **Year** | 2 digits (auto-detect) |
| **Number** | 5 digits (auto-increment) |
| **Unique** | Yes (database constraint) |
| **Reset** | Every year (automatic) |
| **Max** | 99,999 tickets/type/year |

---

**Status**: ✅ Implemented  
**Last Updated**: 2025-11-29

🎫 **Ticket Number System พร้อมใช้งานแล้ว!**

