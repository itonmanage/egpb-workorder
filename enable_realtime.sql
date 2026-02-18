-- Enable Realtime for tickets table
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;

-- Verify Realtime is enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
