-- ============================================================================
-- ConcordVest Supabase Schema Migration: Staff Deactivation & RLS Update
-- ============================================================================
-- Purpose:
--   1. Adds 'is_active' column to public.profiles.
--   2. Updates profiles SELECT policies to allow editors & staff to view profiles.
--   3. Updates trigger to prevent non-admins from modifying active status.
-- ============================================================================

-- 1. Add 'is_active' column if it does not exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 2. Update SELECT policy to allow all staff/editors/admins to list users
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Staff can view all profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (public.get_user_role() IN ('admin'::public.user_role, 'editor'::public.user_role, 'staff'::public.user_role));

-- 3. Update trigger function to also protect the is_active column
CREATE OR REPLACE FUNCTION public.prevent_unauthorized_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_role user_role;
BEGIN
    -- Protect both role changes and deactivations
    IF (NEW.role IS DISTINCT FROM OLD.role) OR (NEW.is_active IS DISTINCT FROM OLD.is_active) THEN
        -- Get the current user's role using the helper function
        current_user_role := public.get_user_role();
        
        -- Only admins can change roles or active status
        IF current_user_role != 'admin'::user_role THEN
            RAISE EXCEPTION 'Only administrators can modify roles or active status';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

