-- Update Ticket Number Format to EGPB-IT25-XXXXX
-- This script updates the ticket number generation function to use the new format

-- Step 1: Update the function to generate ticket numbers with new format
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
    next_num INTEGER;
    ticket_num TEXT;
BEGIN
    -- Get the next sequence value
    next_num := nextval('ticket_number_seq');
    
    -- Format as EGPB-IT25-00001, EGPB-IT25-00002, etc.
    ticket_num := 'EGPB-IT25-' || LPAD(next_num::TEXT, 5, '0');
    
    RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Verify the function
SELECT 'Ticket number format updated. Next ticket will be EGPB-IT25-XXXXX' AS status;
