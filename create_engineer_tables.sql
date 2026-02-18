-- Create Engineer Dashboard Database Tables (Idempotent Version)
-- This script can be run multiple times safely

-- Step 1: Create engineer_tickets table
CREATE TABLE IF NOT EXISTS engineer_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number TEXT,
    title TEXT,
    description TEXT,
    department TEXT,
    location TEXT,
    type_of_damage TEXT,
    status TEXT DEFAULT 'New',
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create sequence for engineer ticket numbers
CREATE SEQUENCE IF NOT EXISTS engineer_ticket_number_seq START WITH 1;

-- Step 3: Create function to generate engineer ticket numbers
CREATE OR REPLACE FUNCTION generate_engineer_ticket_number()
RETURNS TEXT AS $$
DECLARE
    next_num INTEGER;
    ticket_num TEXT;
BEGIN
    -- Get the next sequence value
    next_num := nextval('engineer_ticket_number_seq');
    
    -- Format as EGPB-EN25-00001, EGPB-EN25-00002, etc.
    ticket_num := 'EGPB-EN25-' || LPAD(next_num::TEXT, 5, '0');
    
    RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger function to auto-generate engineer ticket numbers
CREATE OR REPLACE FUNCTION set_engineer_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL THEN
        NEW.ticket_number := generate_engineer_ticket_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Drop existing trigger if it exists, then create it
DROP TRIGGER IF EXISTS trigger_set_engineer_ticket_number ON engineer_tickets;

CREATE TRIGGER trigger_set_engineer_ticket_number
BEFORE INSERT ON engineer_tickets
FOR EACH ROW
EXECUTE FUNCTION set_engineer_ticket_number();

-- Step 6: Create engineer_ticket_attachments table
CREATE TABLE IF NOT EXISTS engineer_ticket_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES engineer_tickets(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 7: Create engineer_ticket_views table for notifications
CREATE TABLE IF NOT EXISTS engineer_ticket_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ticket_id UUID REFERENCES engineer_tickets(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, ticket_id)
);

-- Step 8: Create engineer_admin_notes table
CREATE TABLE IF NOT EXISTS engineer_admin_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES engineer_tickets(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES auth.users(id),
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 9: Enable Row Level Security
ALTER TABLE engineer_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE engineer_ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE engineer_ticket_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE engineer_admin_notes ENABLE ROW LEVEL SECURITY;

-- Step 10: Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own engineer tickets or admins can view all" ON engineer_tickets;
DROP POLICY IF EXISTS "Authenticated users can create engineer tickets" ON engineer_tickets;
DROP POLICY IF EXISTS "Admins can update engineer tickets" ON engineer_tickets;
DROP POLICY IF EXISTS "Users can view attachments for their engineer tickets or admins can view all" ON engineer_ticket_attachments;
DROP POLICY IF EXISTS "Users can insert attachments for their engineer tickets" ON engineer_ticket_attachments;
DROP POLICY IF EXISTS "Users can view their own engineer ticket views" ON engineer_ticket_views;
DROP POLICY IF EXISTS "Users can insert their own engineer ticket views" ON engineer_ticket_views;
DROP POLICY IF EXISTS "Admins can view all engineer admin notes" ON engineer_admin_notes;
DROP POLICY IF EXISTS "Admins can insert engineer admin notes" ON engineer_admin_notes;

-- Step 11: Create RLS Policies for engineer_tickets
CREATE POLICY "Users can view own engineer tickets or admins can view all"
ON engineer_tickets FOR SELECT
USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Authenticated users can create engineer tickets"
ON engineer_tickets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update engineer tickets"
ON engineer_tickets FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Step 12: Create RLS Policies for engineer_ticket_attachments
CREATE POLICY "Users can view attachments for their engineer tickets or admins can view all"
ON engineer_ticket_attachments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM engineer_tickets 
        WHERE engineer_tickets.id = engineer_ticket_attachments.ticket_id 
        AND (engineer_tickets.user_id = auth.uid() OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        ))
    )
);

CREATE POLICY "Users can insert attachments for their engineer tickets"
ON engineer_ticket_attachments FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM engineer_tickets 
        WHERE engineer_tickets.id = engineer_ticket_attachments.ticket_id 
        AND engineer_tickets.user_id = auth.uid()
    )
);

-- Step 13: Create RLS Policies for engineer_ticket_views
CREATE POLICY "Users can view their own engineer ticket views"
ON engineer_ticket_views FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own engineer ticket views"
ON engineer_ticket_views FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Step 14: Create RLS Policies for engineer_admin_notes
CREATE POLICY "Admins can view all engineer admin notes"
ON engineer_admin_notes FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can insert engineer admin notes"
ON engineer_admin_notes FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Step 15: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_engineer_tickets_user_id ON engineer_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_engineer_tickets_status ON engineer_tickets(status);
CREATE INDEX IF NOT EXISTS idx_engineer_tickets_created_at ON engineer_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_engineer_tickets_ticket_number ON engineer_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_engineer_ticket_attachments_ticket_id ON engineer_ticket_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_engineer_ticket_views_user_id ON engineer_ticket_views(user_id);
CREATE INDEX IF NOT EXISTS idx_engineer_ticket_views_ticket_id ON engineer_ticket_views(ticket_id);

-- Step 16: Enable Realtime for engineer_tickets (if not already enabled)
DO $$
BEGIN
    -- Check if table is already in publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'engineer_tickets'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE engineer_tickets;
    END IF;
END $$;

-- Verification
SELECT 'Engineer Dashboard database tables created successfully!' AS status;
SELECT 'Next engineer ticket will be: ' || generate_engineer_ticket_number() AS next_ticket;
