/**
 * ConcordVest Supabase Client Configuration
 *
 * This module provides a configured Supabase client for the application.
 *
 * SECURITY NOTES:
 * - Only VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are exposed to the client
 * - The anon key is safe to expose - it's protected by Row Level Security (RLS)
 * - NEVER expose SUPABASE_SERVICE_ROLE_KEY in frontend code
 * - All sensitive operations should use RLS policies or Edge Functions
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Environment variable validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Type for the Supabase client with our database types
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          role: "admin" | "editor" | "staff" | "user";
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: "admin" | "editor" | "staff" | "user";
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: "admin" | "editor" | "staff" | "user";
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      properties: {
        Row: {
          id: string;
          title: string;
          slug: string;
          category: string;
          listing_type: string;
          property_type: string;
          location: string;
          area: string;
          price: number;
          bedrooms: number;
          bathrooms: number;
          land_size: number;
          building_size: number;
          description: string;
          features: string[];
          amenities: string[];
          documentation: string[];
          availability: string;
          images: string[];
          video: string | null;
          coordinates: { lat: number; lng: number } | null;
          tags: string[];
          is_featured: boolean;
          is_published: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          category?: string;
          listing_type?: string;
          property_type?: string;
          location: string;
          area?: string;
          price: number;
          bedrooms?: number;
          bathrooms?: number;
          land_size?: number;
          building_size?: number;
          description?: string;
          features?: string[];
          amenities?: string[];
          documentation?: string[];
          availability?: string;
          images?: string[];
          video?: string | null;
          coordinates?: { lat: number; lng: number } | null;
          tags?: string[];
          is_featured?: boolean;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          category?: string;
          listing_type?: string;
          property_type?: string;
          location?: string;
          area?: string;
          price?: number;
          bedrooms?: number;
          bathrooms?: number;
          land_size?: number;
          building_size?: number;
          description?: string;
          features?: string[];
          amenities?: string[];
          documentation?: string[];
          availability?: string;
          images?: string[];
          video?: string | null;
          coordinates?: { lat: number; lng: number } | null;
          tags?: string[];
          is_featured?: boolean;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
      };
      projects: {
        Row: {
          id: string;
          title: string;
          slug: string;
          location: string;
          type: string;
          category: string[];
          description: string;
          hero_image: string;
          before_images: string[];
          during_images: string[];
          after_images: string[];
          services: string[];
          service_slugs: string[];
          materials: string[];
          challenges: string[];
          outcome: string;
          related_project_slugs: string[];
          is_featured: boolean;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          location: string;
          type: string;
          category?: string[];
          description?: string;
          hero_image?: string;
          before_images?: string[];
          during_images?: string[];
          after_images?: string[];
          services?: string[];
          service_slugs?: string[];
          materials?: string[];
          challenges?: string[];
          outcome?: string;
          related_project_slugs?: string[];
          is_featured?: boolean;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          location?: string;
          type?: string;
          category?: string[];
          description?: string;
          hero_image?: string;
          before_images?: string[];
          during_images?: string[];
          after_images?: string[];
          services?: string[];
          service_slugs?: string[];
          materials?: string[];
          challenges?: string[];
          outcome?: string;
          related_project_slugs?: string[];
          is_featured?: boolean;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          number: string;
          slug: string;
          name: string;
          short_description: string;
          overview: string;
          problems_solved: string[];
          includes: string[];
          process: string[];
          timeline: string;
          image: string;
          related_project_image: string;
          tags: string[];
          sort_order: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          number: string;
          slug: string;
          name: string;
          short_description: string;
          overview?: string;
          problems_solved?: string[];
          includes?: string[];
          process?: string[];
          timeline?: string;
          image?: string;
          related_project_image?: string;
          tags?: string[];
          sort_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          number?: string;
          slug?: string;
          name?: string;
          short_description?: string;
          overview?: string;
          problems_solved?: string[];
          includes?: string[];
          process?: string[];
          timeline?: string;
          image?: string;
          related_project_image?: string;
          tags?: string[];
          sort_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      articles: {
        Row: {
          id: string;
          title: string;
          slug: string;
          category: string;
          excerpt: string;
          content: { heading?: string; body: string }[];
          hero_image: string;
          read_time: string;
          date: string;
          service_slugs: string[];
          project_slugs: string[];
          property_link: string | null;
          author_id: string | null;
          is_published: boolean;
          is_featured: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          category: string;
          excerpt: string;
          content?: { heading?: string; body: string }[];
          hero_image?: string;
          read_time?: string;
          date?: string;
          service_slugs?: string[];
          project_slugs?: string[];
          property_link?: string | null;
          author_id?: string | null;
          is_published?: boolean;
          is_featured?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          category?: string;
          excerpt?: string;
          content?: { heading?: string; body: string }[];
          hero_image?: string;
          read_time?: string;
          date?: string;
          service_slugs?: string[];
          project_slugs?: string[];
          property_link?: string | null;
          author_id?: string | null;
          is_published?: boolean;
          is_featured?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string;
          whatsapp: string | null;
          interest_type: string;
          property_id: string | null;
          service_id: string | null;
          message: string;
          source: string;
          page_url: string;
          status: string;
          notes: string | null;
          assigned_to: string | null;
          preferred_date: string | null;
          preferred_time: string | null;
          is_read: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone: string;
          whatsapp?: string | null;
          interest_type: string;
          property_id?: string | null;
          service_id?: string | null;
          message?: string;
          source?: string;
          page_url?: string;
          status?: string;
          notes?: string | null;
          assigned_to?: string | null;
          preferred_date?: string | null;
          preferred_time?: string | null;
          is_read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string;
          whatsapp?: string | null;
          interest_type?: string;
          property_id?: string | null;
          service_id?: string | null;
          message?: string;
          source?: string;
          page_url?: string;
          status?: string;
          notes?: string | null;
          assigned_to?: string | null;
          preferred_date?: string | null;
          preferred_time?: string | null;
          is_read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      analytics_events: {
        Row: {
          id: string;
          event_name: string;
          visitor_id: string;
          session_id: string;
          page_path: string;
          page_title: string | null;
          property_id: string | null;
          service_id: string | null;
          source: string | null;
          medium: string | null;
          campaign: string | null;
          content: string | null;
          term: string | null;
          referrer: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_name: string;
          visitor_id: string;
          session_id: string;
          page_path: string;
          page_title?: string | null;
          property_id?: string | null;
          service_id?: string | null;
          source?: string | null;
          medium?: string | null;
          campaign?: string | null;
          content?: string | null;
          term?: string | null;
          referrer?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_name?: string;
          visitor_id?: string;
          session_id?: string;
          page_path?: string;
          page_title?: string | null;
          property_id?: string | null;
          service_id?: string | null;
          source?: string | null;
          medium?: string | null;
          campaign?: string | null;
          content?: string | null;
          term?: string | null;
          referrer?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_analytics_metrics: {
        Args: {
          start_date: string;
          end_date: string;
        };
        Returns: AnalyticsMetricsResponse;
      };
    };
    Enums: {
      user_role: "admin" | "editor" | "staff" | "user";
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "appointment"
        | "converted"
        | "closed"
        | "archived";
      property_availability: "available" | "reserved" | "sold";
    };
  };
};

// Create a type-safe Supabase client type
type TypedSupabaseClient = SupabaseClient<Database>;

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

// Create and export the Supabase client
// This will be a dummy client if not configured, allowing the app to run with demo data
let supabaseClient: TypedSupabaseClient;

if (isSupabaseConfigured()) {
  supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
} else {
  // Create a dummy client that won't be used but satisfies TypeScript
  // When not configured, the app will use demo data
  supabaseClient = createClient<Database>(
    "https://placeholder.supabase.co",
    "placeholder-key"
  );
}

export const supabase = supabaseClient;

// Re-export database types for convenience
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Property = Database["public"]["Tables"]["properties"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Service = Database["public"]["Tables"]["services"]["Row"];
export type Article = Database["public"]["Tables"]["articles"]["Row"];
export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type AnalyticsEvent =
  Database["public"]["Tables"]["analytics_events"]["Row"];

export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type PropertyInsert =
  Database["public"]["Tables"]["properties"]["Insert"];
export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
export type ServiceInsert = Database["public"]["Tables"]["services"]["Insert"];
export type ArticleInsert = Database["public"]["Tables"]["articles"]["Insert"];
export type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
export type AnalyticsEventInsert =
  Database["public"]["Tables"]["analytics_events"]["Insert"];

export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
export type PropertyUpdate =
  Database["public"]["Tables"]["properties"]["Update"];
export type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];
export type ServiceUpdate = Database["public"]["Tables"]["services"]["Update"];
export type ArticleUpdate = Database["public"]["Tables"]["articles"]["Update"];
export type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];
export type AnalyticsEventUpdate =
  Database["public"]["Tables"]["analytics_events"]["Update"];

export type UserRole = Database["public"]["Enums"]["user_role"];
export type LeadStatus = Database["public"]["Enums"]["lead_status"];
export type PropertyAvailability =
  Database["public"]["Enums"]["property_availability"];

// Analytics Metrics RPC Types
export interface AnalyticsOverviewMetrics {
  totalEvents: number;
  uniqueVisitors: number;
  sessions: number;
  propertyViews: number;
  serviceViews: number;
  whatsappClicks: number;
  enquiries: number;
}

export interface TrafficSourceMetric {
  source: string;
  visitors: number;
  events: number;
  whatsappClicks: number;
  enquiries: number;
}

export interface TrafficMediumMetric {
  medium: string;
  visitors: number;
  events: number;
  whatsappClicks: number;
  enquiries: number;
}

export interface CampaignMetric {
  campaign: string;
  visitors: number;
  events: number;
  whatsappClicks: number;
  enquiries: number;
}

export interface TopPropertyMetric {
  propertyId: string;
  views: number;
  whatsappClicks: number;
  enquiries: number;
}

export interface TopServiceMetric {
  serviceId: string;
  views: number;
  whatsappClicks: number;
  enquiries: number;
}

export interface ReferrerMetric {
  referrer: string;
  visitors: number;
  events: number;
}

export interface DailyTrafficMetric {
  date: string;
  visitors: number;
  events: number;
}

export interface EnquiryTypeMetric {
  type: string;
  count: number;
}

export interface AnalyticsMetricsResponse {
  overview: AnalyticsOverviewMetrics;
  trafficSources: TrafficSourceMetric[];
  trafficMediums: TrafficMediumMetric[];
  campaigns: CampaignMetric[];
  topProperties: TopPropertyMetric[];
  topServices: TopServiceMetric[];
  referrers: ReferrerMetric[];
  dailyTraffic: DailyTrafficMetric[];
  enquiryTypes: EnquiryTypeMetric[];
}
