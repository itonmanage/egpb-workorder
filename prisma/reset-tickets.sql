-- =====================================================
-- SQL Script สำหรับลบข้อมูล Tickets ทั้งหมด
-- =====================================================
-- ⚠️ คำเตือน: การรันคำสั่งนี้จะลบข้อมูล Tickets ทั้งหมด!
-- กรุณาสำรองข้อมูลก่อนรัน script นี้
-- =====================================================

BEGIN;

-- ลบข้อมูล IT Tickets และข้อมูลที่เกี่ยวข้อง
DELETE FROM ticket_comments;
DELETE FROM ticket_views;
DELETE FROM ticket_images;
DELETE FROM tickets;

-- ลบข้อมูล Engineer Tickets และข้อมูลที่เกี่ยวข้อง
DELETE FROM engineer_ticket_comments;
DELETE FROM engineer_ticket_views;
DELETE FROM engineer_ticket_images;
DELETE FROM engineer_tickets;

-- แสดงผลลัพธ์
SELECT 'IT Tickets deleted successfully' AS status;
SELECT 'Engineer Tickets deleted successfully' AS status;

COMMIT;

-- =====================================================
-- หมายเหตุ:
-- - Users จะไม่ถูกลบ
-- - Ticket Number จะเริ่มนับใหม่อัตโนมัติเมื่อสร้าง ticket ใหม่
-- - ข้อมูลที่ถูกลบไม่สามารถกู้คืนได้
-- =====================================================
