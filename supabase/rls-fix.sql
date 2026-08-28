-- ============================================================================
-- ConcordVest RLS Policy Fix
-- ============================================================================
-- This migration fixes the infinite recursion in RLS policies.
-- Run this in Supabase SQL Editor to fix the current database.
-- ============================================================================

-- ============================================================================
-- STEP 1: Create SECURITY DEFINER helper function for role checks
-- This function runs as the table owner, bypassing RLS safely
-- ============================================================================

-- Get the current user's role without triggering RLS
-- This is the ONLY function that reads from profiles and bypasses RLS
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role_val user_role;
BEGIN
    SELECT role INTO user_role_val
    FROM public.profiles
    WHERE id = auth.uid();
    
    RETURN COALESCE(user_role_val, 'user'::user_role);
END;
$$;

-- ============================================================================
-- STEP 2: Create a trigger function to prevent non-admin role changes
-- This enforces role change restrictions at the database level
-- WITHOUT querying profiles from within a profiles RLS policy
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_unauthorized_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_role user_role;
BEGIN
    -- Only check role changes if the role column is being changed
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        -- Get the current user's role using the helper function
        -- This function runs as SECURITY DEFINER, bypassing RLS
        current_user_role := public.get_user_role();
        
        -- Only admins can change roles
        IF current_user_role != 'admin'::user_role THEN
            RAISE EXCEPTION 'Only administrators can change user roles';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS prevent_role_escalation ON public.profiles;

-- Create the trigger to enforce role change restrictions
CREATE TRIGGER prevent_role_escalation
    BEFORE UPDATE OF role ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_unauthorized_role_change();

-- ============================================================================
-- STEP 3: Drop ALL existing policies on profiles that may cause recursion
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- ============================================================================
-- STEP 4: Create new NON-RECURSIVE profiles policies
-- These policies do NOT query the profiles table at all
-- ============================================================================

-- Users can view their own profile
-- Uses only auth.uid() comparison, no profiles table query
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Admins can view all profiles
-- Uses the helper function which bypasses RLS via SECURITY DEFINER
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.get_user_role() = 'admin'::user_role);

-- Users can update their own profile (except role - enforced by trigger)
-- No WITH CHECK needed because the trigger handles role protection
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (public.get_user_role() = 'admin'::user_role);

-- ============================================================================
-- STEP 5: Drop and recreate all policies on other tables that query profiles
-- ============================================================================

-- PROPERTIES
DROP POLICY IF EXISTS "Anyone can view published properties" ON public.properties;
DROP POLICY IF EXISTS "Admins and editors can view all properties" ON public.properties;
DROP POLICY IF EXISTS "Admins and editors can insert properties" ON public.properties;
DROP POLICY IF EXISTS "Admins and editors can update properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can delete properties" ON public.properties;

-- Anyone can view published properties
CREATE POLICY "Anyone can view published properties" ON public.properties
    FOR SELECT USING (is_published = TRUE);

-- Admins and editors can view all properties
CREATE POLICY "Admins and editors can view all properties" ON public.properties
    FOR SELECT USING (public.get_user_role() IN ('admin'::user_role, 'editor'::user_role));

-- Admins and editors can insert properties
CREATE POLICY "Admins and editors can insert properties" ON public.properties
    FOR INSERT WITH CHECK (public.get_user_role() IN ('admin'::user_role, 'editor'::user_role));

-- Admins and editors can update properties
CREATE POLICY "Admins and editors can update properties" ON public.properties
    FOR UPDATE USING (public.get_user_role() IN ('admin'::user_role, 'editor'::user_role));

-- Admins can delete properties
CREATE POLICY "Admins can delete properties" ON public.properties
    FOR DELETE USING (public.get_user_role() = 'admin'::user_role);

-- PROJECTS
DROP POLICY IF EXISTS "Anyone can view published projects" ON public.projects;
DROP POLICY IF EXISTS "Admins and editors can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Admins and editors can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Admins and editors can update projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;

-- Anyone can view published projects
CREATE POLICY "Anyone can view published projects" ON public.projects
    FOR SELECT USING (is_published = TRUE);

-- Admins and editors can view all projects
CREATE POLICY "Admins and editors can view all projects" ON public.projects
    FOR SELECT USING (public.get_user_role() IN ('admin'::user_role, 'editor'::user_role));

-- Admins and editors can insert projects
CREATE POLICY "Admins and editors can insert projects" ON public.projects
    FOR INSERT WITH CHECK (public.get_user_role() IN ('admin'::user_role, 'editor'::user_role));

-- Admins and editors can update projects
CREATE POLICY "Admins and editors can update projects" ON public.projects
    FOR UPDATE USING (public.get_user_role() IN ('admin'::user_role, 'editor'::user_role));

-- Admins can delete projects
CREATE POLICY "Admins can delete projects" ON public.projects
    FOR DELETE USING (public.get_user_role() = 'admin'::user_role);

-- SERVICES
DROP POLICY IF EXISTS "Anyone can view published services" ON public.services;
DROP POLICY IF EXISTS "Admins and editors can view all services" ON public.services;
DROP POLICY IF EXISTS "Admins and editors can insert services" ON public.services;
DROP POLICY IF EXISTS "Admins and editors can update services" ON public.services;
DROP POLICY IF EXISTS "Admins can delete services" ON public.services;

-- Anyone can view published services
CREATE POLICY "Anyone can view published services" ON public.services
    FOR SELECT USING (is_published = TRUE);

-- Admins and editors can view all services
CREATE POLICY "Admins and editors can view all services" ON public.services
    FOR SELECT USING (public.get_user_role() IN ('admin'::user_role, 'editor'::user_role));

-- Admins and editors can insert services
CREATE POLICY "Admins and editors can insert services" ON public.services
    FOR INSERT WITH CHECK (public.get_user_role() IN ('admin'::user_role, 'editor'::user_role));

-- Admins and editors can update services
CREATE POLICY "Admins and editors can update services" ON public.services
    FOR UPDATE USING (public.get_user_role() IN ('admin'::user_role, 'editor'::user_role));

-- Admins can delete services
CREATE POLICY "Admins can delete services" ON public.services
    FOR DELETE USING (public.get_user_role() = 'admin'::user_role);

-- ARTICLES
DROP POLICY IF EXISTS "Anyone can view published articles" ON public.articles;
DROP POLICY IF EXISTS "Admins and editors can view all articles" ON public.articles;
DROP POLICY IF EXISTS "Admins and editors can insert articles" ON public.articles;
DROP POLICY IF EXISTS "Admins and editors can update articles" ON public.articles;
DROP POLICY IF EXISTS "Admins can delete articles" ON public.articles;

-- Anyone can view published articles
CREATE POLICY "Anyone can view published articles" ON public.articles
    FOR SELECT USING (is_published = TRUE);

-- Admins and editors can view all articles
CREATE POLICY "Admins and editors can view all articles" ON public.articles
    FOR SELECT USING (public.get_user_role() IN ('admin'::user_role, 'editor'::user_role));

-- Admins and editors can insert articles
CREATE POLICY "Admins and editors can insert articles" ON public.articles
    FOR INSERT WITH CHECK (public.get_user_role() IN ('admin'::user_role, 'editor'::user_role));

-- Admins and editors can update articles
CREATE POLICY "Admins and editors can update articles" ON public.articles
    FOR UPDATE USING (public.get_user_role() IN ('admin'::user_role, 'editor'::user_role));

-- Admins can delete articles
CREATE POLICY "Admins can delete articles" ON public.articles
    FOR DELETE USING (public.get_user_role() = 'admin'::user_role);

-- LEADS
DROP POLICY IF EXISTS "Staff can view leads" ON public.leads;
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Staff can update assigned leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;

-- Staff, editors, and admins can view leads
CREATE POLICY "Staff can view leads" ON public.leads
    FOR SELECT USING (public.get_user_role() IN ('admin'::user_role, 'editor'::user_role, 'staff'::user_role));

-- Anyone can insert leads (public form submission)
CREATE POLICY "Anyone can insert leads" ON public.leads
    FOR INSERT WITH CHECK (TRUE);

-- Staff can update leads they are assigned to, editors/admins can update any
CREATE POLICY "Staff can update assigned leads" ON public.leads
    FOR UPDATE USING (
        assigned_to = auth.uid() 
        OR public.get_user_role() IN ('admin'::user_role, 'editor'::user_role)
    );

-- Admins can delete leads
CREATE POLICY "Admins can delete leads" ON public.leads
    FOR DELETE USING (public.get_user_role() = 'admin'::user_role);

-- ============================================================================
-- STEP 6: Grant EXECUTE permissions on helper function
-- Only authenticated users need role checks
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these after applying the migration to verify the fix
-- ============================================================================

-- Test 1: The helper function should return your role
-- SELECT public.get_user_role();

-- Test 2: You should be able to read your own profile
-- SELECT id, email, role FROM public.profiles WHERE id = auth.uid();

-- Test 3: Published properties should be readable
-- SELECT id, title FROM public.properties WHERE is_published = TRUE LIMIT 5;

-- Test 4: Published projects should be readable
-- SELECT id, title FROM public.projects WHERE is_published = TRUE LIMIT 5;

-- Test 5: Published services should be readable
-- SELECT id, name FROM public.services WHERE is_published = TRUE LIMIT 5;

-- Test 6: Published articles should be readable
-- SELECT id, title FROM public.articles WHERE is_published = TRUE LIMIT 5;

-- Test 7: Anyone should be able to insert a lead (this will insert a test lead)
-- INSERT INTO public.leads (name, email, phone, interest_type, message)
-- VALUES ('Test', 'test@test.com', '123456', 'Property', 'Test message');

-- Test 8: Normal users should NOT be able to read leads (will fail for non-staff)
-- SELECT * FROM public.leads LIMIT 1;
