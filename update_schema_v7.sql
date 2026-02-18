-- Create table to track which tickets have been viewed by admins
CREATE TABLE IF NOT EXISTS public.ticket_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, ticket_id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_ticket_views_user_id ON public.ticket_views(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_views_ticket_id ON public.ticket_views(ticket_id);

-- Enable RLS
ALTER TABLE public.ticket_views ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own views
CREATE POLICY "Users can view their own ticket views"
    ON public.ticket_views
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own views
CREATE POLICY "Users can insert their own ticket views"
    ON public.ticket_views
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own views
CREATE POLICY "Users can delete their own ticket views"
    ON public.ticket_views
    FOR DELETE
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.ticket_views TO authenticated;
GRANT ALL ON public.ticket_views TO service_role;
