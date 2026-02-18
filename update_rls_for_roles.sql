-- Update RLS Policies for Role-Based Access Control
-- This script updates RLS policies to support admin, it_admin, engineer_admin, and user roles

-- ============================================
-- TICKETS TABLE (IT Dashboard)
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins view all, Users view own" ON public.tickets;
DROP POLICY IF EXISTS "Users can insert own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins update all, Users update own" ON public.tickets;

-- Policy: Admin and IT Admin can view all tickets, Users view own
CREATE POLICY "Admin and IT Admin view all, Users view own"
    ON public.tickets FOR SELECT
    USING (
        auth.uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'it_admin')
        )
    );

-- Policy: All authenticated users can insert tickets
CREATE POLICY "Authenticated users can insert tickets"
    ON public.tickets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Admin and IT Admin can update all, Users can update own
CREATE POLICY "Admin and IT Admin update all, Users update own"
    ON public.tickets FOR UPDATE
    USING (
        auth.uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'it_admin')
        )
    );

-- ============================================
-- ENGINEER_TICKETS TABLE (Engineer Dashboard)
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own engineer tickets" ON public.engineer_tickets;
DROP POLICY IF EXISTS "Admins can view all engineer tickets" ON public.engineer_tickets;
DROP POLICY IF EXISTS "Users can insert own engineer tickets" ON public.engineer_tickets;
DROP POLICY IF EXISTS "Users can update own engineer tickets" ON public.engineer_tickets;
DROP POLICY IF EXISTS "Admins can update all engineer tickets" ON public.engineer_tickets;

-- Policy: Admin and Engineer Admin can view all tickets, Users view own
CREATE POLICY "Admin and Engineer Admin view all, Users view own"
    ON public.engineer_tickets FOR SELECT
    USING (
        auth.uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'engineer_admin')
        )
    );

-- Policy: All authenticated users can insert engineer tickets
CREATE POLICY "Authenticated users can insert engineer tickets"
    ON public.engineer_tickets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Admin and Engineer Admin can update all, Users can update own
CREATE POLICY "Admin and Engineer Admin update all, Users update own"
    ON public.engineer_tickets FOR UPDATE
    USING (
        auth.uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'engineer_admin')
        )
    );

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify policies for tickets table
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'tickets'
ORDER BY policyname;

-- Verify policies for engineer_tickets table
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'engineer_tickets'
ORDER BY policyname;
