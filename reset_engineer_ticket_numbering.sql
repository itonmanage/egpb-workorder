-- Reset Engineer Ticket Numbering System
-- This script resets the engineer ticket number sequence to start from 1 (EGPB-EN25-00001)
-- Run this script after deleting all engineer tickets from the database

-- Step 1: Reset the sequence to start from 1
ALTER SEQUENCE engineer_ticket_number_seq RESTART WITH 1;

-- Step 2: Verify the sequence has been reset
-- The next ticket created will be EGPB-EN25-00001
SELECT 'Engineer ticket numbering sequence has been reset. Next ticket will be EGPB-EN25-00001' AS status;
