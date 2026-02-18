-- Add missing columns to engineer_ticket_attachments to match ticket_images functionality
ALTER TABLE engineer_ticket_attachments 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_admin_upload BOOLEAN DEFAULT FALSE;

-- Update RLS policies to cover new columns if necessary (existing policies cover the whole table)
