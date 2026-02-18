-- Migration Script: Fix usernames for all profiles
-- This script ensures all users have a username set for display in "Requested By" field

-- Step 1: Check current username status
-- Run this first to see which users don't have usernames
SELECT id, username, full_name, role 
FROM profiles 
WHERE username IS NULL OR username = '';

-- Step 2: Update username using full_name if username is NULL or empty
-- This will use full_name as username for users who don't have one
UPDATE profiles 
SET username = COALESCE(NULLIF(username, ''), full_name, 'user_' || substr(id::text, 1, 8))
WHERE username IS NULL OR username = '';

-- Step 3: Verify the update
-- Run this to see all usernames after update
SELECT id, username, full_name, role 
FROM profiles 
ORDER BY updated_at DESC;

-- Optional: If you want to set specific usernames manually, run these:
-- UPDATE profiles SET username = 'adminit' WHERE full_name = 'Admin IT';
-- UPDATE profiles SET username = 'itmgr' WHERE full_name = 'IT Manager';

-- Note: The COALESCE function will:
-- 1. Use existing username if it's not NULL or empty
-- 2. Use full_name if username is NULL/empty
-- 3. Generate 'user_XXXXXXXX' if both are NULL (using first 8 chars of UUID)
