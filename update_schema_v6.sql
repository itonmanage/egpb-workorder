-- Migration Script v6: Add username to profiles
-- This script adds the missing username column to the profiles table

-- Add username column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username TEXT;

-- Add unique constraint to username
ALTER TABLE profiles 
ADD CONSTRAINT unique_username UNIQUE (username);

-- Update existing profiles to have a username based on full_name or id if null
-- This is a best-effort update for existing records
UPDATE profiles 
SET username = COALESCE(full_name, 'user_' || substr(id::text, 1, 8))
WHERE username IS NULL;
