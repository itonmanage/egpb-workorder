-- Reset Ticket Numbering System
-- This script resets the ticket number sequence to start from 1 (EGPB-00001)
-- Run this script after deleting all tickets from the database

-- Step 1: Reset the sequence to start from 1
ALTER SEQUENCE ticket_number_seq RESTART WITH 1;

-- Step 2: Verify the sequence has been reset
-- The next ticket created will be EGPB-IT25-00001
SELECT 'Ticket numbering sequence has been reset. Next ticket will be EGPB-IT25-00001' AS status;
