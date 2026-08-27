/**
 * ConcordVest Leads Data Hooks
 * 
 * Provides hooks for fetching and managing leads/enquiries from Supabase.
 * Falls back to localStorage when Supabase is not configured.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConfigured, type Lead, type LeadInsert, type LeadUpdate } from "@/lib/supabase";
import { createLead, recordLead, buildLeadWhatsAppMessage, buildWhatsAppUrl, type LeadPayload, type LeadContext, getLeadContext } from "@/lib/leads";

// Convert LeadPayload (app) to LeadInsert (database)
export function leadPayloadToDb(payload: LeadPayload): LeadInsert {
  return {
    id: payload.id,
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    whatsapp: payload.whatsapp || null,
    interest_type: payload.interestType,
    property_id: payload.property || null,
    service_id: payload.service || null,
    message: payload.message,
    source: payload.source,
    page_url: payload.page,
    status: payload.status.toLowerCase() as "new" | "contacted" | "qualified" | "appointment" | "converted" | "closed" | "archived",
  };
}

// Convert Lead (database) to LeadPayload (app format)
export function leadDbToPayload(lead: Lead): LeadPayload {
  return {
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    whatsapp: lead.whatsapp || "",
    email: lead.email,
    interestType: lead.interest_type as LeadPayload["interestType"],
    property: lead.property_id || undefined,
    service: lead.service_id || undefined,
    message: lead.message,
    source: lead.source as LeadPayload["source"],
    page: lead.page_url,
    date: lead.created_at,
    status: lead.status.charAt(0).toUpperCase() + lead.status.slice(1) as LeadPayload["status"],
  };
}

// Submit a new lead
export async function submitLead(payload: Omit<LeadPayload, "id" | "date" | "status">): Promise<{ success: boolean; leadId: string; error: Error | null }> {
  const newLead = createLead(payload);

  // Always save to localStorage as backup
  recordLead(newLead);

  if (!isSupabaseConfigured()) {
    return { success: true, leadId: newLead.id, error: null };
  }

  try {
    const { error } = await supabase
      .from("leads")
      .insert(leadPayloadToDb(newLead) as never);

    if (error) {
      console.error("Failed to save lead to Supabase:", error);
      // Lead is still saved to localStorage, so we return success
      return { success: true, leadId: newLead.id, error: new Error(error.message) };
    }

    return { success: true, leadId: newLead.id, error: null };
  } catch (error) {
    console.error("Failed to submit lead:", error);
    return { success: true, leadId: newLead.id, error: error instanceof Error ? error : new Error("Unknown error") };
  }
}

// Admin: Fetch all leads
export function useAdminLeads(): {
  leads: LeadPayload[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  updateLeadStatus: (id: string, status: LeadUpdate["status"]) => Promise<{ error: Error | null }>;
  updateLeadNotes: (id: string, notes: string) => Promise<{ error: Error | null }>;
  assignLead: (id: string, assignedTo: string) => Promise<{ error: Error | null }>;
} {
  const [leads, setLeads] = useState<LeadPayload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      // Try to load from localStorage
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
      const { data, error: fetchError } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setLeads((data || []).map(leadDbToPayload));
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch leads"));
      // Try localStorage fallback
      try {
        const stored = JSON.parse(window.localStorage.getItem("concordvest-leads") || "[]") as LeadPayload[];
        setLeads(stored);
      } catch {
        setLeads([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const updateLeadStatus = useCallback(async (id: string, status: LeadUpdate["status"]): Promise<{ error: Error | null }> => {
    if (!isSupabaseConfigured()) {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status: (status || "new").charAt(0).toUpperCase() + (status || "new").slice(1) as LeadPayload["status"] } : l));
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
      return { error: err instanceof Error ? err : new Error("Failed to update lead") };
    }
  }, [fetchLeads]);

  const updateLeadNotes = useCallback(async (id: string, notes: string): Promise<{ error: Error | null }> => {
    if (!isSupabaseConfigured()) {
      return { error: new Error("Notes can only be saved with Supabase configured") };
    }

    try {
      const { error: updateError } = await supabase
        .from("leads")
        .update({
          notes,
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
  }, [fetchLeads]);

  const assignLead = useCallback(async (id: string, assignedTo: string): Promise<{ error: Error | null }> => {
    if (!isSupabaseConfigured()) {
      return { error: new Error("Assignment can only be done with Supabase configured") };
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
  }, [fetchLeads]);

  return { leads, isLoading, error, refetch: fetchLeads, updateLeadStatus, updateLeadNotes, assignLead };
}

// Dashboard stats
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
      // Use demo data
      const { demoProperties } = require("@/lib/properties");
      const { projects, articles } = require("@/lib/content");
      const { adminLeads } = require("@/lib/admin");

      setStats({
        totalProperties: demoProperties.length,
        availableProperties: demoProperties.filter((p: { availability: string }) => p.availability === "Available").length,
        reservedSold: demoProperties.filter((p: { availability: string }) => p.availability !== "Available").length,
        totalProjects: projects.length,
        publishedArticles: articles.length,
        newLeads: adminLeads.filter((l: { status: string }) => l.status === "New").length,
        totalLeads: adminLeads.length,
        renovationEnquiries: adminLeads.filter((l: { interest: string }) => l.interest === "Renovation Quote").length,
        siteInspections: adminLeads.filter((l: { interest: string }) => l.interest === "Site Inspection" || l.interest === "Viewing Request").length,
      });
      setIsLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        // Fetch all counts in parallel
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
          supabase.from("properties").select("id", { count: "exact", head: true }).eq("availability", "available"),
          supabase.from("properties").select("id", { count: "exact", head: true }).neq("availability", "available"),
          supabase.from("projects").select("id", { count: "exact", head: true }).eq("is_published", true),
          supabase.from("articles").select("id", { count: "exact", head: true }).eq("is_published", true),
          supabase.from("leads").select("id", { count: "exact", head: true }),
          supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
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
        setError(err instanceof Error ? err : new Error("Failed to fetch stats"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, isLoading, error };
}

// Re-export utilities
export { buildLeadWhatsAppMessage, buildWhatsAppUrl, getLeadContext };
