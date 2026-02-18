-- Merge Missing Data from Backup
-- Run this against egpb_ticket_db

BEGIN;

-- Insert missing users (skip duplicates)
INSERT INTO users 
SELECT * FROM dblink('dbname=egpb_backup_temp user=egpb_admin password=EGPB_Secure_Pass_2024!',
    'SELECT id, username, full_name, position, department, telephone_extension, password, role, created_at, updated_at FROM users')
AS t(id uuid, username text, full_name text, position text, department text, telephone_extension text, password text, role text, created_at timestamp, updated_at timestamp)
ON CONFLICT (id) DO NOTHING;

-- Insert missing IT tickets (00001-00100)
INSERT INTO tickets
SELECT * FROM dblink('dbname=egpb_backup_temp user=egpb_admin password=EGPB_Secure_Pass_2024!',
    'SELECT id, ticket_number, title, description, department, location, type_of_damage, status, admin_notes, assign_to, user_id, created_at, updated_at 
     FROM tickets 
     WHERE ticket_number >= ''EGPB-IT25-00001'' AND ticket_number <= ''EGPB-IT25-00100''')
AS t(id uuid, ticket_number text, title text, description text, department text, location text, type_of_damage text, status text, admin_notes text, assign_to text, user_id uuid, created_at timestamp, updated_at timestamp)
ON CONFLICT (id) DO NOTHING;

-- Insert missing Engineer tickets (00001-00562)
INSERT INTO engineer_tickets
SELECT * FROM dblink('dbname=egpb_backup_temp user=egpb_admin password=EGPB_Secure_Pass_2024!',
    'SELECT id, ticket_number, title, description, department, location, type_of_damage, status, admin_notes, information_by, assign_to, user_id, created_at, updated_at
     FROM engineer_tickets
     WHERE ticket_number >= ''EGPB-EN25-00001'' AND ticket_number <= ''EGPB-EN25-00562''')
AS t(id uuid, ticket_number text, title text, description text, department text, location text, type_of_damage text, status text, admin_notes text, information_by text, assign_to text, user_id uuid, created_at timestamp, updated_at timestamp)
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Verify counts
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'IT Tickets', COUNT(*) FROM tickets
UNION ALL
SELECT 'Engineer Tickets', COUNT(*) FROM engineer_tickets;
