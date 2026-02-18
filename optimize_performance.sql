-- Performance Optimization Script

-- 1. Create Index for Type of Damage (Speed up filtering)
CREATE INDEX IF NOT EXISTS idx_tickets_type_of_damage ON tickets(type_of_damage);
CREATE INDEX IF NOT EXISTS idx_engineer_tickets_type_of_damage ON engineer_tickets(type_of_damage);

-- 2. Function to get IT Dashboard Stats (Server-side calculation)
CREATE OR REPLACE FUNCTION get_it_dashboard_stats()
RETURNS TABLE (
    total_new BIGINT,
    total_in_progress BIGINT,
    total_on_hold BIGINT,
    total_done BIGINT,
    total_cancel BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) FILTER (WHERE status = 'New') as total_new,
        COUNT(*) FILTER (WHERE status = 'In Progress') as total_in_progress,
        COUNT(*) FILTER (WHERE status = 'On Hold') as total_on_hold,
        COUNT(*) FILTER (WHERE status = 'Done') as total_done,
        COUNT(*) FILTER (WHERE status = 'Cancel') as total_cancel
    FROM tickets;
END;
$$ LANGUAGE plpgsql;

-- 3. Function to get Engineer Dashboard Stats (Server-side calculation)
CREATE OR REPLACE FUNCTION get_engineer_dashboard_stats()
RETURNS TABLE (
    total_new BIGINT,
    total_in_progress BIGINT,
    total_on_hold BIGINT,
    total_done BIGINT,
    total_cancel BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) FILTER (WHERE status = 'New') as total_new,
        COUNT(*) FILTER (WHERE status = 'In Progress') as total_in_progress,
        COUNT(*) FILTER (WHERE status = 'On Hold') as total_on_hold,
        COUNT(*) FILTER (WHERE status = 'Done') as total_done,
        COUNT(*) FILTER (WHERE status = 'Cancel') as total_cancel
    FROM engineer_tickets;
END;
$$ LANGUAGE plpgsql;

-- 4. Function to get Unread Ticket Count (Optimized)
-- This avoids fetching all tickets just to check "New" ones
CREATE OR REPLACE FUNCTION get_unread_ticket_count(user_uuid UUID)
RETURNS BIGINT AS $$
DECLARE
    unread_count BIGINT;
BEGIN
    SELECT COUNT(*)
    INTO unread_count
    FROM tickets t
    WHERE t.status = 'New'
    AND NOT EXISTS (
        SELECT 1 FROM ticket_views tv
        WHERE tv.ticket_id = t.id
        AND tv.user_id = user_uuid
    );
    RETURN unread_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_unread_engineer_ticket_count(user_uuid UUID)
RETURNS BIGINT AS $$
DECLARE
    unread_count BIGINT;
BEGIN
    SELECT COUNT(*)
    INTO unread_count
    FROM engineer_tickets t
    WHERE t.status = 'New'
    AND NOT EXISTS (
        SELECT 1 FROM engineer_ticket_views tv
        WHERE tv.ticket_id = t.id
        AND tv.user_id = user_uuid
    );
    RETURN unread_count;
END;
$$ LANGUAGE plpgsql;

-- Verification
SELECT 'Performance optimization functions created successfully!' as status;
