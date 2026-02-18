-- Migration: Add Admin Notes Field
-- This adds a notes field for admins to document internal information

-- Add admin_notes column
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add timestamp for tracking when notes were last updated
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS notes_updated_at TIMESTAMP WITH TIME ZONE;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tickets' 
AND column_name IN ('admin_notes', 'notes_updated_at');
