-- ============================================================================
-- ConcordVest Leads Table Extension Migration
-- ============================================================================
-- Run this SQL in your Supabase SQL editor to add structured viewing/inspection
-- booking date/time fields and admin read tracking to the public.leads table.
-- ============================================================================

-- 1. Add preferred_date, preferred_time, and is_read columns to public.leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS preferred_date DATE,
ADD COLUMN IF NOT EXISTS preferred_time TEXT,
ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Create index on is_read for rapid retrieval of unread/new leads
CREATE INDEX IF NOT EXISTS leads_is_read_idx ON public.leads(is_read) WHERE is_read = FALSE;

