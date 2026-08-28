-- ============================================================================
-- ConcordVest Database Schema
-- ============================================================================
-- This file contains the complete database schema for the ConcordVest application.
-- Run these migrations in order in your Supabase SQL editor.
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- User roles
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'staff', 'user');

-- Lead status
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'appointment', 'converted', 'closed', 'archived');

-- Property availability
CREATE TYPE property_availability AS ENUM ('available', 'reserved', 'sold');

-- ============================================================================
-- TABLES
-- ============================================================================

-- ---------------------------------------------------------------------------
-- PROFILES (extends Supabase auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create index for faster role lookups
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);

-- Trigger to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'user'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists, then create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to keep updated_at current
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- PROPERTIES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'All Properties',
    listing_type TEXT NOT NULL DEFAULT 'Concordvest Property',
    property_type TEXT NOT NULL DEFAULT 'Apartment',
    location TEXT NOT NULL,
    area TEXT NOT NULL DEFAULT 'Abuja',
    price BIGINT NOT NULL DEFAULT 0,
    bedrooms INTEGER NOT NULL DEFAULT 0,
    bathrooms INTEGER NOT NULL DEFAULT 0,
    land_size INTEGER NOT NULL DEFAULT 0,
    building_size INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL DEFAULT '',
    features TEXT[] NOT NULL DEFAULT '{}',
    amenities TEXT[] NOT NULL DEFAULT '{}',
    documentation TEXT[] NOT NULL DEFAULT '{}',
    availability property_availability NOT NULL DEFAULT 'available',
    images TEXT[] NOT NULL DEFAULT '{}',
    video TEXT,
    coordinates JSONB,
    tags TEXT[] NOT NULL DEFAULT '{}',
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    CONSTRAINT valid_price CHECK (price >= 0),
    CONSTRAINT valid_bedrooms CHECK (bedrooms >= 0),
    CONSTRAINT valid_bathrooms CHECK (bathrooms >= 0),
    CONSTRAINT valid_land_size CHECK (land_size >= 0),
    CONSTRAINT valid_building_size CHECK (building_size >= 0)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS properties_slug_idx ON public.properties(slug);
CREATE INDEX IF NOT EXISTS properties_availability_idx ON public.properties(availability);
CREATE INDEX IF NOT EXISTS properties_is_published_idx ON public.properties(is_published);
CREATE INDEX IF NOT EXISTS properties_is_featured_idx ON public.properties(is_featured);
CREATE INDEX IF NOT EXISTS properties_location_idx ON public.properties(location);
CREATE INDEX IF NOT EXISTS properties_property_type_idx ON public.properties(property_type);
CREATE INDEX IF NOT EXISTS properties_price_idx ON public.properties(price);

CREATE TRIGGER properties_updated_at
    BEFORE UPDATE ON public.properties
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- PROJECTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    location TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT[] NOT NULL DEFAULT '{}',
    description TEXT NOT NULL DEFAULT '',
    hero_image TEXT NOT NULL DEFAULT '',
    before_images TEXT[] NOT NULL DEFAULT '{}',
    during_images TEXT[] NOT NULL DEFAULT '{}',
    after_images TEXT[] NOT NULL DEFAULT '{}',
    services TEXT[] NOT NULL DEFAULT '{}',
    service_slugs TEXT[] NOT NULL DEFAULT '{}',
    materials TEXT[] NOT NULL DEFAULT '{}',
    challenges TEXT[] NOT NULL DEFAULT '{}',
    outcome TEXT NOT NULL DEFAULT '',
    related_project_slugs TEXT[] NOT NULL DEFAULT '{}',
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS projects_slug_idx ON public.projects(slug);
CREATE INDEX IF NOT EXISTS projects_is_published_idx ON public.projects(is_published);
CREATE INDEX IF NOT EXISTS projects_category_idx ON public.projects USING GIN(category);

CREATE TRIGGER projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- SERVICES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    short_description TEXT NOT NULL,
    overview TEXT NOT NULL DEFAULT '',
    problems_solved TEXT[] NOT NULL DEFAULT '{}',
    includes TEXT[] NOT NULL DEFAULT '{}',
    process TEXT[] NOT NULL DEFAULT '{}',
    timeline TEXT NOT NULL DEFAULT '',
    image TEXT NOT NULL DEFAULT '',
    related_project_image TEXT NOT NULL DEFAULT '',
    tags TEXT[] NOT NULL DEFAULT '{}',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS services_slug_idx ON public.services(slug);
CREATE INDEX IF NOT EXISTS services_is_published_idx ON public.services(is_published);
CREATE INDEX IF NOT EXISTS services_sort_order_idx ON public.services(sort_order);

CREATE TRIGGER services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- ARTICLES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '[]',
    hero_image TEXT NOT NULL DEFAULT '',
    read_time TEXT NOT NULL DEFAULT '5 min read',
    date TEXT NOT NULL,
    service_slugs TEXT[] NOT NULL DEFAULT '{}',
    project_slugs TEXT[] NOT NULL DEFAULT '{}',
    property_link TEXT,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS articles_slug_idx ON public.articles(slug);
CREATE INDEX IF NOT EXISTS articles_is_published_idx ON public.articles(is_published);
CREATE INDEX IF NOT EXISTS articles_category_idx ON public.articles(category);
CREATE INDEX IF NOT EXISTS articles_published_at_idx ON public.articles(published_at DESC);

CREATE TRIGGER articles_updated_at
    BEFORE UPDATE ON public.articles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- LEADS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    interest_type TEXT NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    message TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT 'Direct',
    page_url TEXT NOT NULL DEFAULT '',
    status lead_status NOT NULL DEFAULT 'new',
    notes TEXT,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS leads_status_idx ON public.leads(status);
CREATE INDEX IF NOT EXISTS leads_interest_type_idx ON public.leads(interest_type);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS leads_assigned_to_idx ON public.leads(assigned_to);

CREATE TRIGGER leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS HELPER FUNCTION
-- Uses SECURITY DEFINER to bypass RLS and avoid recursion
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

-- Grant to authenticated users only
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

-- ============================================================================
-- TRIGGER TO PREVENT UNAUTHORIZED ROLE CHANGES
-- Enforced at database level, not via RLS policy
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
    -- Only check if the role column is being changed
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        -- Get the current user's role using the helper function
        current_user_role := public.get_user_role();
        
        -- Only admins can change roles
        IF current_user_role != 'admin'::user_role THEN
            RAISE EXCEPTION 'Only administrators can change user roles';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create the trigger to enforce role change restrictions
CREATE TRIGGER prevent_role_escalation
    BEFORE UPDATE OF role ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_unauthorized_role_change();

-- ---------------------------------------------------------------------------
-- PROFILES RLS POLICIES
-- These policies do NOT query the profiles table to avoid recursion
-- ---------------------------------------------------------------------------

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.get_user_role() = 'admin'::user_role);

-- Users can update their own profile (role changes blocked by trigger)
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (public.get_user_role() = 'admin'::user_role);

-- ---------------------------------------------------------------------------
-- PROPERTIES RLS POLICIES
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- PROJECTS RLS POLICIES
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- SERVICES RLS POLICIES
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- ARTICLES RLS POLICIES
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- LEADS RLS POLICIES
-- ---------------------------------------------------------------------------

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
-- STORAGE BUCKETS
-- ============================================================================

-- Note: Storage buckets and policies should be created through the Supabase UI
-- or via the Storage API. Here are the recommended bucket names:
-- 
-- 1. properties - for property images
-- 2. projects - for project images
-- 3. articles - for article featured images
-- 4. services - for service images
-- 5. profiles - for user avatars
-- 6. documents - for property documents and other files

-- ============================================================================
-- INITIAL DATA SEEDING (Optional)
-- ============================================================================

-- To seed initial data, see the seed.sql file
-- Run it after creating the tables
