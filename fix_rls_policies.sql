-- Fix RLS Policies for Image Upload
-- Run this to fix "new row violates row-level security policy" error

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view ticket images" ON ticket_images;
DROP POLICY IF EXISTS "Users can upload images to their tickets" ON ticket_images;
DROP POLICY IF EXISTS "Admins can delete images" ON ticket_images;

-- Create new, simpler policies

-- 1. Anyone authenticated can view images (we'll control access at app level)
CREATE POLICY "Authenticated users can view images" ON ticket_images
    FOR SELECT
    TO authenticated
    USING (true);

-- 2. Anyone authenticated can upload images (we'll validate at app level)
CREATE POLICY "Authenticated users can upload images" ON ticket_images
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = uploaded_by);

-- 3. Users can delete their own images, admins can delete any
CREATE POLICY "Users can delete own images" ON ticket_images
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = uploaded_by
        OR
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    );

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'ticket_images';
