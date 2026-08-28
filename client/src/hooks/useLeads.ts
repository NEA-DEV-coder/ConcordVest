/**
 * ConcordVest Leads Data Hooks
 * 
 * Provides hooks for fetching, submitting, and managing leads/enquiries.
 * Supabase is the primary production database and source of truth.
 * Falls back to localStorage only when Supabase is unconfigured (demo/dev mode).
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, isSupabaseConfigured, type Lead, type LeadInsert, type LeadUpdate } from "@/lib/supabase";
import { createLead, recordLead, type LeadPayload, type LeadStatus } from "@/lib/leads";

// Simple email regex for validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Convert LeadPayload (app camelCase) to LeadInsert (database snake_case)
 */
export function leadPayloadToDb(payload: LeadPayload, isNew: boolean = false): LeadInsert {
  const dbRecord: LeadInsert = {
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    phone: payload.phone.trim(),
    whatsapp: payload.whatsapp ? payload.whatsapp.trim() : null,
    interest_type: payload.interestType,
    property_id: payload.propertyId || null,
    service_id: payload.serviceId || null,
    message: payload.message.trim(),
    source: payload.source,
    page_url: payload.page,
    status: payload.status.toLowerCase() as "new" | "contacted" | "qualified" | "appointment" | "converted" | "closed" | "archived",
    notes: payload.notes || null,
    assigned_to: payload.assignedTo || null,
    preferred_date: payload.preferredDate || null,
    preferred_time: payload.preferredTime || null,
    is_read: payload.isRead,
  };

  // Only include id if it's a valid UUID (for updates), not for new records
  if (!isNew && payload.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.id)) {
    dbRecord.id = payload.id;
  }

  return dbRecord;
}

/**
 * Convert Lead (database snake_case) to LeadPayload (app camelCase format)
 */
export function leadDbToPayload(
  lead: Lead,
  propertyNameMap?: Record<string, string>,
  serviceNameMap?: Record<string, string>
): LeadPayload {
  const dbStatus = lead.status.toLowerCase();
  
  // Map database status string back to LeadStatus enum
  let mappedStatus: LeadStatus = "New";
  if (dbStatus === "new") mappedStatus = "New";
  else if (dbStatus === "contacted") mappedStatus = "Contacted";
  else if (dbStatus === "qualified") mappedStatus = "Qualified";
  else if (dbStatus === "appointment") mappedStatus = "Appointment";
  else if (dbStatus === "converted") mappedStatus = "Converted";
  else if (dbStatus === "closed") mappedStatus = "Closed";
  else if (dbStatus === "archived") mappedStatus = "Archived";

  return {
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    whatsapp: lead.whatsapp || "",
    email: lead.email,
    interestType: lead.interest_type as LeadPayload["interestType"],
    propertyId: lead.property_id || undefined,
    serviceId: lead.service_id || undefined,
    property: (lead.property_id && propertyNameMap?.[lead.property_id]) || undefined,
    service: (lead.service_id && serviceNameMap?.[lead.service_id]) || undefined,
    message: lead.message,
    source: lead.source as LeadPayload["source"],
    page: lead.page_url,
    date: lead.created_at,
    status: mappedStatus,
    notes: lead.notes || "",
    assignedTo: lead.assigned_to || undefined,
    preferredDate: lead.preferred_date || undefined,
    preferredTime: lead.preferred_time || undefined,
    isRead: lead.is_read,
  };
}

/**
 * Submit a new lead
 */
export async function submitLead(
  payload: Omit<LeadPayload, "id" | "date" | "status" | "isRead">
): Promise<{ success: boolean; leadId: string; error: Error | null }> {
  // 1. Validation
  if (!payload.name?.trim()) {
    return { success: false, leadId: "", error: new Error("Name is required.") };
  }
  if (!payload.phone?.trim()) {
    return { success: false, leadId: "", error: new Error("Phone number is required.") };
  }
  if (!payload.email?.trim()) {
    return { success: false, leadId: "", error: new Error("Email address is required.") };
  }
  if (!EMAIL_REGEX.test(payload.email.trim())) {
    return { success: false, leadId: "", error: new Error("Please enter a valid email address.") };
  }
  if (!payload.interestType) {
    return { success: false, leadId: "", error: new Error("Interest type is required.") };
  }

  const newLead = createLead(payload);

  // In demo mode, save to localStorage and return success
  if (!isSupabaseConfigured()) {
    recordLead(newLead);
    return { success: true, leadId: newLead.id, error: null };
  }

  try {
    // Submit to Supabase - omit ID so PostgreSQL generates it
    const dbPayload = leadPayloadToDb(newLead, true);
    
    const { data, error } = await supabase
      .from("leads")
      .insert(dbPayload as never)
      .select("id")
      .single();

    if (error) {
      console.error("Failed to save lead to Supabase:", error);
      return { success: false, leadId: "", error: new Error(error.message) };
    }

    const uuid = (data as { id: string })?.id;
    if (!uuid) {
      return { success: false, leadId: "", error: new Error("Failed to retrieve generated lead ID.") };
    }

    // Save local copy for historical audit/debug
    recordLead({ ...newLead, id: uuid });

    return { success: true, leadId: uuid, error: null };
  } catch (error) {
    console.error("Failed to submit lead:", error);
    return {
      success: false,
      leadId: "",
      error: error instanceof Error ? error : new Error("Unexpected connection error during submission"),
    };
  }
}

/**
 * Admin Hook: Fetch, update and manage leads
 */
export function useAdminLeads(): {
  leads: LeadPayload[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  updateLeadStatus: (id: string, status: LeadUpdate["status"]) => Promise<{ error: Error | null }>;
  updateLeadNotes: (id: string, notes: string) => Promise<{ error: Error | null }>;
  assignLead: (id: string, assignedTo: string | null) => Promise<{ error: Error | null }>;
  markAsRead: (id: string) => Promise<{ error: Error | null }>;
  deleteLead: (id: string) => Promise<{ error: Error | null }>;
  unreadCount: number;
} {
  const [leads, setLeads] = useState<LeadPayload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const pollingRef = useRef<number | null>(null);

  const fetchLeads = useCallback(async () => {
    setError(null);

    if (!isSupabaseConfigured()) {
      try {
        const stored = JSON.parse(window.localStorage.getItem("concordvest-leads") || "[]") as LeadPayload[];
        setLeads(stored.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch {
        setLeads([]);
      }
      setIsLoading(false);
      return;
    }

    try {
      // 1. Fetch properties and services map for display names
      const [propertiesRes, servicesRes] = await Promise.all([
        supabase.from("properties").select("id, title"),
        supabase.from("services").select("id, name"),
      ]);

      const propertyMap: Record<string, string> = {};
      if (propertiesRes.data) {
        propertiesRes.data.forEach((p: { id: string; title: string }) => {
          propertyMap[p.id] = p.title;
        });
      }

      const serviceMap: Record<string, string> = {};
      if (servicesRes.data) {
        servicesRes.data.forEach((s: { id: string; name: string }) => {
          serviceMap[s.id] = s.name;
        });
      }

      // 2. Fetch leads
      const { data, error: fetchError } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const mappedLeads = (data || []).map(lead =>
        leadDbToPayload(lead, propertyMap, serviceMap)
      );

      setLeads(mappedLeads);
    } catch (err) {
      console.error("Error fetching leads:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch leads"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set up 30-second polling for real-time lead updates
  useEffect(() => {
    fetchLeads();

    const interval = window.setInterval(() => {
      fetchLeads();
    }, 30000); // 30 seconds

    pollingRef.current = interval;

    return () => {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
      }
    };
  }, [fetchLeads]);

  const updateLeadStatus = useCallback(
    async (id: string, status: LeadUpdate["status"]): Promise<{ error: Error | null }> => {
      if (!isSupabaseConfigured()) {
        setLeads(prev =>
          prev.map(l =>
            l.id === id
              ? {
                  ...l,
                  status:
                    ((status || "new").charAt(0).toUpperCase() +
                      (status || "new").slice(1)) as LeadPayload["status"],
                }
              : l
          )
        );
        return { error: null };
      }

      try {
        const { error: updateError } = await supabase
          .from("leads")
          .update({
            status,
            updated_at: new Date().toISOString(),
          } as never)
          .eq("id", id);

        if (updateError) {
          return { error: new Error(updateError.message) };
        }

        await fetchLeads();
        return { error: null };
      } catch (err) {
        return { error: err instanceof Error ? err : new Error("Failed to update status") };
      }
    },
    [fetchLeads]
  );

  const updateLeadNotes = useCallback(
    async (id: string, notes: string): Promise<{ error: Error | null }> => {
      if (!isSupabaseConfigured()) {
        setLeads(prev => prev.map(l => (l.id === id ? { ...l, notes } : l)));
        return { error: null };
      }

      try {
        const { error: updateError } = await supabase
          .from("leads")
          .update({
            notes: notes || null,
            updated_at: new Date().toISOString(),
          } as never)
          .eq("id", id);

        if (updateError) {
          return { error: new Error(updateError.message) };
        }

        await fetchLeads();
        return { error: null };
      } catch (err) {
        return { error: err instanceof Error ? err : new Error("Failed to update notes") };
      }
    },
    [fetchLeads]
  );

  const assignLead = useCallback(
    async (id: string, assignedTo: string | null): Promise<{ error: Error | null }> => {
      if (!isSupabaseConfigured()) {
        setLeads(prev => prev.map(l => (l.id === id ? { ...l, assignedTo: assignedTo || undefined } : l)));
        return { error: null };
      }

      try {
        const { error: updateError } = await supabase
          .from("leads")
          .update({
            assigned_to: assignedTo,
            updated_at: new Date().toISOString(),
          } as never)
          .eq("id", id);

        if (updateError) {
          return { error: new Error(updateError.message) };
        }

        await fetchLeads();
        return { error: null };
      } catch (err) {
        return { error: err instanceof Error ? err : new Error("Failed to assign lead") };
      }
    },
    [fetchLeads]
  );

  const markAsRead = useCallback(
    async (id: string): Promise<{ error: Error | null }> => {
      if (!isSupabaseConfigured()) {
        setLeads(prev => prev.map(l => (l.id === id ? { ...l, isRead: true } : l)));
        return { error: null };
      }

      try {
        const { error: updateError } = await supabase
          .from("leads")
          .update({
            is_read: true,
            updated_at: new Date().toISOString(),
          } as never)
          .eq("id", id);

        if (updateError) {
          return { error: new Error(updateError.message) };
        }

        // Fast update in local state to prevent visual lag
        setLeads(prev => prev.map(l => (l.id === id ? { ...l, isRead: true } : l)));
        return { error: null };
      } catch (err) {
        return { error: err instanceof Error ? err : new Error("Failed to mark lead as read") };
      }
    },
    []
  );

  const deleteLead = useCallback(
    async (id: string): Promise<{ error: Error | null }> => {
      if (!isSupabaseConfigured()) {
        setLeads(prev => prev.filter(l => l.id !== id));
        return { error: null };
      }

      try {
        const { error: deleteError } = await supabase
          .from("leads")
          .delete()
          .eq("id", id);

        if (deleteError) {
          return { error: new Error(deleteError.message) };
        }

        setLeads(prev => prev.filter(l => l.id !== id));
        return { error: null };
      } catch (err) {
        return { error: err instanceof Error ? err : new Error("Failed to delete lead") };
      }
    },
    []
  );

  const unreadCount = leads.filter(l => !l.isRead).length;

  return {
    leads,
    isLoading,
    error,
    refetch: fetchLeads,
    updateLeadStatus,
    updateLeadNotes,
    assignLead,
    markAsRead,
    deleteLead,
    unreadCount,
  };
}

/**
 * Dashboard stats hook
 */
export function useDashboardStats(): {
  stats: {
    totalProperties: number;
    availableProperties: number;
    reservedSold: number;
    totalProjects: number;
    publishedArticles: number;
    newLeads: number;
    totalLeads: number;
    renovationEnquiries: number;
    siteInspections: number;
  };
  isLoading: boolean;
  error: Error | null;
} {
  const [stats, setStats] = useState({
    totalProperties: 0,
    availableProperties: 0,
    reservedSold: 0,
    totalProjects: 0,
    publishedArticles: 0,
    newLeads: 0,
    totalLeads: 0,
    renovationEnquiries: 0,
    siteInspections: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      // Lazy load mock databases
      const { demoProperties } = require("@/lib/properties");
      const { projects, articles } = require("@/lib/content");
      const { adminLeads } = require("@/lib/admin");

      setStats({
        totalProperties: demoProperties.length,
        availableProperties: demoProperties.filter((p: any) => p.availability === "Available").length,
        reservedSold: demoProperties.filter((p: any) => p.availability !== "Available").length,
        totalProjects: projects.length,
        publishedArticles: articles.length,
        newLeads: adminLeads.filter((l: any) => l.status === "New").length,
        totalLeads: adminLeads.length,
        renovationEnquiries: adminLeads.filter((l: any) => l.interest === "Renovation Quote").length,
        siteInspections: adminLeads.filter(
          (l: any) => l.interest === "Site Inspection" || l.interest === "Viewing Request"
        ).length,
      });
      setIsLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const [
          propertiesResult,
          availableResult,
          reservedResult,
          projectsResult,
          articlesResult,
          leadsResult,
          newLeadsResult,
          renovationResult,
          inspectionsResult,
        ] = await Promise.all([
          supabase.from("properties").select("id", { count: "exact", head: true }),
          supabase.from("properties").select("id", { count: "exact", head: true }).eq("availability", "Available"),
          supabase.from("properties").select("id", { count: "exact", head: true }).neq("availability", "Available"),
          supabase.from("projects").select("id", { count: "exact", head: true }).eq("is_published", true),
          supabase.from("articles").select("id", { count: "exact", head: true }).eq("is_published", true),
          supabase.from("leads").select("id", { count: "exact", head: true }),
          supabase.from("leads").select("id", { count: "exact", head: true }).eq("is_read", false),
          supabase.from("leads").select("id", { count: "exact", head: true }).eq("interest_type", "Renovation Quote"),
          supabase.from("leads").select("id", { count: "exact", head: true }).or("interest_type.eq.Site Inspection,interest_type.eq.Viewing Request"),
        ]);

        setStats({
          totalProperties: propertiesResult.count || 0,
          availableProperties: availableResult.count || 0,
          reservedSold: reservedResult.count || 0,
          totalProjects: projectsResult.count || 0,
          publishedArticles: articlesResult.count || 0,
          newLeads: newLeadsResult.count || 0,
          totalLeads: leadsResult.count || 0,
          renovationEnquiries: renovationResult.count || 0,
          siteInspections: inspectionsResult.count || 0,
        });
      } catch (err) {
        console.error("Error loading dashboard stats:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch dashboard stats"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, isLoading, error };
}
