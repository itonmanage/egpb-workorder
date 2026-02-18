-- Comprehensive Fix for Creator Name Display
-- This script ensures all users have proper data in the profiles table

-- Step 1: Check current state of profiles
SELECT 
    id, 
    username, 
    full_name, 
    role,
    CASE 
        WHEN username IS NULL OR username = '' THEN 'Missing Username'
        ELSE 'Has Username'
    END as username_status
FROM profiles
ORDER BY updated_at DESC;

-- Step 2: Create profiles for users who created tickets but don't have profiles
INSERT INTO profiles (id, username, full_name, role)
SELECT DISTINCT 
    t.user_id,
    'user_' || substr(t.user_id::text, 1, 8) as username,
    'User ' || substr(t.user_id::text, 1, 8) as full_name,
    'user' as role
FROM tickets t
LEFT JOIN profiles p ON t.user_id = p.id
WHERE p.id IS NULL AND t.user_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Step 3: Do the same for engineer_tickets
INSERT INTO profiles (id, username, full_name, role)
SELECT DISTINCT 
    t.user_id,
    'user_' || substr(t.user_id::text, 1, 8) as username,
    'User ' || substr(t.user_id::text, 1, 8) as full_name,
    'user' as role
FROM engineer_tickets t
LEFT JOIN profiles p ON t.user_id = p.id
WHERE p.id IS NULL AND t.user_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Step 4: Update existing profiles that have NULL or empty usernames
UPDATE profiles 
SET username = COALESCE(
    NULLIF(username, ''), 
    full_name, 
    'user_' || substr(id::text, 1, 8)
)
WHERE username IS NULL OR username = '';

-- Step 5: Verify the fix
SELECT 
    id, 
    username, 
    full_name, 
    role
FROM profiles
ORDER BY updated_at DESC
LIMIT 20;

-- Step 6: Check tickets to see if all creators now have profiles
SELECT 
    t.id as ticket_id,
    t.ticket_number,
    t.user_id,
    p.username,
    p.full_name,
    CASE 
        WHEN p.id IS NULL THEN '❌ Missing Profile'
        WHEN p.username IS NULL OR p.username = '' THEN '⚠️ Missing Username'
        ELSE '✅ OK'
    END as status
FROM tickets t
LEFT JOIN profiles p ON t.user_id = p.id
ORDER BY t.created_at DESC
LIMIT 10;
