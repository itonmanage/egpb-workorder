-- Migration Script v4: Add Image Storage Support
-- This script adds tables to store image attachments for tickets

-- Create table for ticket images
CREATE TABLE IF NOT EXISTS ticket_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_name TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    is_admin_upload BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_ticket_images_ticket_id ON ticket_images(ticket_id);
CREATE INDEX idx_ticket_images_uploaded_by ON ticket_images(uploaded_by);

-- Enable RLS
ALTER TABLE ticket_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ticket_images
-- Users can view images for tickets they created or if they're admin
CREATE POLICY "Users can view ticket images" ON ticket_images
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM tickets WHERE id = ticket_id
        )
        OR
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'admin'
        )
    );

-- Users can insert images for their own tickets
CREATE POLICY "Users can upload images to their tickets" ON ticket_images
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM tickets WHERE id = ticket_id
        )
        OR
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'admin'
        )
    );

-- Only admins can delete images
CREATE POLICY "Admins can delete images" ON ticket_images
    FOR DELETE
    USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'admin'
        )
    );

-- Create storage bucket for ticket images (run this in Supabase Dashboard > Storage)
-- Bucket name: ticket-images
-- Public: false (only authenticated users)
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
