-- Migration Script v3: Add Custom Ticket Number System
-- This script adds a custom ticket numbering system with format EGPB-00001, EGPB-00002, etc.

-- Step 1: Add ticket_number column to tickets table
ALTER TABLE tickets ADD COLUMN ticket_number TEXT;

-- Step 2: Create a sequence for ticket numbers
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START WITH 1;

-- Step 3: Create a function to generate the next ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
    next_num INTEGER;
    ticket_num TEXT;
BEGIN
    -- Get the next sequence value
    next_num := nextval('ticket_number_seq');
    
    -- Format as EGPB-00001, EGPB-00002, etc.
    ticket_num := 'EGPB-' || LPAD(next_num::TEXT, 5, '0');
    
    RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create a trigger to auto-generate ticket numbers on insert
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL THEN
        NEW.ticket_number := generate_ticket_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_ticket_number
BEFORE INSERT ON tickets
FOR EACH ROW
EXECUTE FUNCTION set_ticket_number();

-- Step 5: Update existing tickets with ticket numbers (if any exist)
DO $$
DECLARE
    ticket_record RECORD;
BEGIN
    FOR ticket_record IN 
        SELECT id FROM tickets WHERE ticket_number IS NULL ORDER BY created_at
    LOOP
        UPDATE tickets 
        SET ticket_number = generate_ticket_number() 
        WHERE id = ticket_record.id;
    END LOOP;
END $$;

-- Step 6: Make ticket_number NOT NULL and UNIQUE after populating existing records
ALTER TABLE tickets ALTER COLUMN ticket_number SET NOT NULL;
ALTER TABLE tickets ADD CONSTRAINT unique_ticket_number UNIQUE (ticket_number);

-- Verification: Check that ticket numbers were created
-- SELECT ticket_number, created_at FROM tickets ORDER BY created_at;
