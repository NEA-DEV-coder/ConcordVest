-- ============================================================================
-- ConcordVest Supabase Schema Migration: Analytics Read Layer & RPC Metrics
-- ============================================================================
-- Purpose:
--   1. Adds SELECT Row Level Security (RLS) policy on public.analytics_events
--      restricted strictly to authenticated users with 'admin' or 'editor' role.
--   2. Adds performance indexes for date ranges, event names, entity references,
--      and visitor counting.
--   3. Implements public.get_analytics_metrics(start_date, end_date) as a
--      SECURITY DEFINER RPC function aggregating analytics metrics while enforcing
--      RBAC authorization and preventing exposure of raw PII/visitor records.
-- ============================================================================

-- ============================================================================
-- PART 1: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Ensure RLS is enabled on public.analytics_events
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if already present to guarantee clean re-runs
DROP POLICY IF EXISTS "Admins and editors can view analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Allow public and authenticated event insertion" ON public.analytics_events;

-- Allow anonymous and authenticated visitors to record analytics events
CREATE POLICY "Allow public and authenticated event insertion"
ON public.analytics_events
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Admins and editors can view analytics events
-- Strictly restricted to authenticated users with 'admin' or 'editor' role.
-- Anonymous users, regular users, and staff users cannot read analytics events.
CREATE POLICY "Admins and editors can view analytics events" ON public.analytics_events
    FOR SELECT TO authenticated
    USING (public.get_user_role() IN ('admin'::public.user_role, 'editor'::public.user_role));

-- ============================================================================
-- PART 2: ANALYTICS INDEXES
-- ============================================================================

-- 1. Index on created_at for chronological date range queries
CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx 
    ON public.analytics_events (created_at DESC);

-- 2. Compound index on event_name and created_at for event-filtered date queries
CREATE INDEX IF NOT EXISTS analytics_events_event_name_created_at_idx 
    ON public.analytics_events (event_name, created_at DESC);

-- 3. Partial index on property_id for property engagement aggregation
CREATE INDEX IF NOT EXISTS analytics_events_property_id_idx 
    ON public.analytics_events (property_id) 
    WHERE property_id IS NOT NULL;

-- 4. Partial index on service_id for service engagement aggregation
CREATE INDEX IF NOT EXISTS analytics_events_service_id_idx 
    ON public.analytics_events (service_id) 
    WHERE service_id IS NOT NULL;

-- 5. Index on visitor_id for unique visitor calculations
CREATE INDEX IF NOT EXISTS analytics_events_visitor_id_idx 
    ON public.analytics_events (visitor_id);

-- ============================================================================
-- PART 3: SECURE ANALYTICS RPC FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_analytics_metrics(
    start_date timestamptz,
    end_date timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    current_user_role user_role;
    overview_data jsonb;
    sources_data jsonb;
    mediums_data jsonb;
    campaigns_data jsonb;
    properties_data jsonb;
    services_data jsonb;
    referrers_data jsonb;
    daily_data jsonb;
    enquiry_types_data jsonb;
BEGIN
    -- 1. Authorization Verification
    -- Ensure the calling user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Fetch current user role via SECURITY DEFINER helper
    current_user_role := public.get_user_role();

    -- Strictly permit only admin and editor roles; reject staff, user, and any other role
    IF current_user_role NOT IN ('admin'::user_role, 'editor'::user_role) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- 2. Default date parameters if null
    start_date := COALESCE(start_date, NOW() - INTERVAL '30 days');
    end_date := COALESCE(end_date, NOW());

    -- 3. Aggregate Overview Metrics
    SELECT jsonb_build_object(
        'totalEvents', COALESCE(COUNT(*), 0),
        'uniqueVisitors', COALESCE(COUNT(DISTINCT visitor_id), 0),
        'sessions', COALESCE(COUNT(DISTINCT session_id), 0),
        'propertyViews', COALESCE(COUNT(*) FILTER (WHERE event_name = 'property_view'), 0),
        'serviceViews', COALESCE(COUNT(*) FILTER (WHERE event_name = 'service_view'), 0),
        'whatsappClicks', COALESCE(COUNT(*) FILTER (WHERE event_name = 'whatsapp_click'), 0),
        'enquiries', COALESCE(COUNT(*) FILTER (WHERE event_name = 'enquiry_submit'), 0)
    )
    INTO overview_data
    FROM public.analytics_events
    WHERE created_at >= start_date AND created_at < end_date;

    -- 4. Traffic Sources Aggregation (Extended with whatsappClicks and enquiries)
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'source', s.clean_source,
                'visitors', s.visitor_count,
                'events', s.event_count,
                'whatsappClicks', s.whatsapp_count,
                'enquiries', s.enquiry_count
            )
            ORDER BY s.enquiry_count DESC, s.whatsapp_count DESC, s.visitor_count DESC
        ),
        '[]'::jsonb
    )
    INTO sources_data
    FROM (
        SELECT 
            COALESCE(NULLIF(TRIM(source), ''), 'direct') AS clean_source,
            COUNT(DISTINCT visitor_id) AS visitor_count,
            COUNT(*) AS event_count,
            COUNT(*) FILTER (WHERE event_name = 'whatsapp_click') AS whatsapp_count,
            COUNT(*) FILTER (WHERE event_name = 'enquiry_submit') AS enquiry_count
        FROM public.analytics_events
        WHERE created_at >= start_date AND created_at < end_date
        GROUP BY COALESCE(NULLIF(TRIM(source), ''), 'direct')
        ORDER BY enquiry_count DESC, whatsapp_count DESC, visitor_count DESC, event_count DESC
        LIMIT 20
    ) s;

    -- 5. Traffic Mediums Aggregation (Extended with whatsappClicks and enquiries)
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'medium', m.clean_medium,
                'visitors', m.visitor_count,
                'events', m.event_count,
                'whatsappClicks', m.whatsapp_count,
                'enquiries', m.enquiry_count
            )
            ORDER BY m.enquiry_count DESC, m.whatsapp_count DESC, m.visitor_count DESC
        ),
        '[]'::jsonb
    )
    INTO mediums_data
    FROM (
        SELECT 
            COALESCE(NULLIF(TRIM(medium), ''), 'none') AS clean_medium,
            COUNT(DISTINCT visitor_id) AS visitor_count,
            COUNT(*) AS event_count,
            COUNT(*) FILTER (WHERE event_name = 'whatsapp_click') AS whatsapp_count,
            COUNT(*) FILTER (WHERE event_name = 'enquiry_submit') AS enquiry_count
        FROM public.analytics_events
        WHERE created_at >= start_date AND created_at < end_date
        GROUP BY COALESCE(NULLIF(TRIM(medium), ''), 'none')
        ORDER BY enquiry_count DESC, whatsapp_count DESC, visitor_count DESC, event_count DESC
        LIMIT 20
    ) m;

    -- 6. Campaigns Aggregation (Extended with whatsappClicks and enquiries)
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'campaign', c.clean_campaign,
                'visitors', c.visitor_count,
                'events', c.event_count,
                'whatsappClicks', c.whatsapp_count,
                'enquiries', c.enquiry_count
            )
            ORDER BY c.enquiry_count DESC, c.whatsapp_count DESC, c.visitor_count DESC
        ),
        '[]'::jsonb
    )
    INTO campaigns_data
    FROM (
        SELECT 
            COALESCE(NULLIF(TRIM(campaign), ''), 'none') AS clean_campaign,
            COUNT(DISTINCT visitor_id) AS visitor_count,
            COUNT(*) AS event_count,
            COUNT(*) FILTER (WHERE event_name = 'whatsapp_click') AS whatsapp_count,
            COUNT(*) FILTER (WHERE event_name = 'enquiry_submit') AS enquiry_count
        FROM public.analytics_events
        WHERE created_at >= start_date AND created_at < end_date
        GROUP BY COALESCE(NULLIF(TRIM(campaign), ''), 'none')
        ORDER BY enquiry_count DESC, whatsapp_count DESC, visitor_count DESC, event_count DESC
        LIMIT 20
    ) c;

    -- 7. Top Properties Aggregation (Limit 10, Ignore property_id IS NULL)
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'propertyId', p.property_id,
                'views', p.view_count,
                'whatsappClicks', p.whatsapp_count,
                'enquiries', p.enquiry_count
            )
            ORDER BY p.enquiry_count DESC, p.whatsapp_count DESC, p.view_count DESC
        ),
        '[]'::jsonb
    )
    INTO properties_data
    FROM (
        SELECT 
            property_id,
            COUNT(*) FILTER (WHERE event_name = 'property_view') AS view_count,
            COUNT(*) FILTER (WHERE event_name = 'whatsapp_click') AS whatsapp_count,
            COUNT(*) FILTER (WHERE event_name = 'enquiry_submit') AS enquiry_count
        FROM public.analytics_events
        WHERE created_at >= start_date 
          AND created_at < end_date
          AND property_id IS NOT NULL
        GROUP BY property_id
        ORDER BY enquiry_count DESC, whatsapp_count DESC, view_count DESC
        LIMIT 10
    ) p;

    -- 8. Top Services Aggregation (Limit 10, Ignore service_id IS NULL)
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'serviceId', s.service_id,
                'views', s.view_count,
                'whatsappClicks', s.whatsapp_count,
                'enquiries', s.enquiry_count
            )
            ORDER BY s.enquiry_count DESC, s.whatsapp_count DESC, s.view_count DESC
        ),
        '[]'::jsonb
    )
    INTO services_data
    FROM (
        SELECT 
            service_id,
            COUNT(*) FILTER (WHERE event_name = 'service_view') AS view_count,
            COUNT(*) FILTER (WHERE event_name = 'whatsapp_click') AS whatsapp_count,
            COUNT(*) FILTER (WHERE event_name = 'enquiry_submit') AS enquiry_count
        FROM public.analytics_events
        WHERE created_at >= start_date 
          AND created_at < end_date
          AND service_id IS NOT NULL
        GROUP BY service_id
        ORDER BY enquiry_count DESC, whatsapp_count DESC, view_count DESC
        LIMIT 10
    ) s;

    -- 9. Referrers Aggregation (Null/empty fallback to "direct")
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'referrer', r.clean_referrer,
                'visitors', r.visitor_count,
                'events', r.event_count
            )
            ORDER BY r.visitor_count DESC, r.event_count DESC
        ),
        '[]'::jsonb
    )
    INTO referrers_data
    FROM (
        SELECT 
            COALESCE(NULLIF(TRIM(referrer), ''), 'direct') AS clean_referrer,
            COUNT(DISTINCT visitor_id) AS visitor_count,
            COUNT(*) AS event_count
        FROM public.analytics_events
        WHERE created_at >= start_date AND created_at < end_date
        GROUP BY COALESCE(NULLIF(TRIM(referrer), ''), 'direct')
        ORDER BY visitor_count DESC, event_count DESC
        LIMIT 20
    ) r;

    -- 10. Daily Traffic Aggregation (Chronological ascending by Lagos local time)
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'date', d.day_date,
                'visitors', d.visitor_count,
                'events', d.event_count
            )
            ORDER BY d.day_date ASC
        ),
        '[]'::jsonb
    )
    INTO daily_data
    FROM (
        SELECT 
            TO_CHAR(created_at AT TIME ZONE 'Africa/Lagos', 'YYYY-MM-DD') AS day_date,
            COUNT(DISTINCT visitor_id) AS visitor_count,
            COUNT(*) AS event_count
        FROM public.analytics_events
        WHERE created_at >= start_date AND created_at < end_date
        GROUP BY TO_CHAR(created_at AT TIME ZONE 'Africa/Lagos', 'YYYY-MM-DD')
        ORDER BY day_date ASC
    ) d;

    -- 11. Enquiry Types Aggregation (By interestType metadata, non-PII)
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'type', e.clean_type,
                'count', e.type_count
            )
            ORDER BY e.type_count DESC
        ),
        '[]'::jsonb
    )
    INTO enquiry_types_data
    FROM (
        SELECT 
            COALESCE(NULLIF(TRIM(metadata->>'interestType'), ''), 'other') AS clean_type,
            COUNT(*) AS type_count
        FROM public.analytics_events
        WHERE created_at >= start_date 
          AND created_at < end_date
          AND event_name = 'enquiry_submit'
        GROUP BY COALESCE(NULLIF(TRIM(metadata->>'interestType'), ''), 'other')
        ORDER BY type_count DESC
    ) e;

    -- 12. Compose Final Analytics JSON Response
    RETURN jsonb_build_object(
        'overview', overview_data,
        'trafficSources', sources_data,
        'trafficMediums', mediums_data,
        'campaigns', campaigns_data,
        'topProperties', properties_data,
        'topServices', services_data,
        'referrers', referrers_data,
        'dailyTraffic', daily_data,
        'enquiryTypes', enquiry_types_data
    );
END;
$function$;

-- ============================================================================
-- PART 4: FUNCTION PERMISSIONS
-- ============================================================================

-- Revoke permissions from PUBLIC and anon
REVOKE ALL ON FUNCTION public.get_analytics_metrics(timestamptz, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_analytics_metrics(timestamptz, timestamptz) FROM anon;

-- Grant EXECUTE to authenticated users
-- The internal authorization check in get_analytics_metrics() enforces that only
-- users with role 'admin' or 'editor' can execute successfully; staff and regular
-- users raise an 'Unauthorized' exception.
GRANT EXECUTE ON FUNCTION public.get_analytics_metrics(timestamptz, timestamptz) TO authenticated;

