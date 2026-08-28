/**
 * ConcordVest Recent Activity Hook
 *
 * Dynamically constructs a unified, chronologically sorted list of recent events
 * across properties, projects, services, articles, leads, and staff entities.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { demoProperties } from "@/lib/properties";
import { projects, articles } from "@/lib/content";
import { adminLeads } from "@/lib/admin";

export interface RecentActivity {
  id: string;
  type: "property" | "project" | "service" | "article" | "lead" | "staff";
  action: "created" | "updated" | "published" | "received";
  title: string;
  detail: string;
  timestamp: string; // ISO date string
  tone: "orange" | "navy" | "muted";
}

export function useRecentActivity(): {
  activities: RecentActivity[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchActivities = useCallback(async () => {
    setError(null);

    if (!isSupabaseConfigured()) {
      // Reconstruct dynamic activity list in prototype mode using mock databases
      const localActivities: RecentActivity[] = [];

      // 1. Properties
      demoProperties.slice(0, 3).forEach(p => {
        localActivities.push({
          id: `demo-prop-${p.id}`,
          type: "property",
          action: "created",
          title: "Property added",
          detail: p.title,
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
          tone: "orange",
        });
      });

      // 2. Projects
      projects.slice(0, 2).forEach(p => {
        localActivities.push({
          id: `demo-proj-${p.id}`,
          type: "project",
          action: "updated",
          title: "Project updated",
          detail: p.title,
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
          tone: "navy",
        });
      });

      // 3. Articles
      articles.slice(0, 2).forEach(a => {
        localActivities.push({
          id: `demo-art-${a.id}`,
          type: "article",
          action: "published",
          title: "Article published",
          detail: a.title,
          timestamp: new Date(Date.now() - 3600000 * 8).toISOString(), // 8 hours ago
          tone: "muted",
        });
      });

      // 4. Leads
      adminLeads.slice(0, 3).forEach(l => {
        localActivities.push({
          id: `demo-lead-${l.id}`,
          type: "lead",
          action: "received",
          title: "New enquiry received",
          detail: `${l.name} · ${l.interest}`,
          timestamp: new Date(Date.now() - 60000 * 12).toISOString(), // 12 mins ago
          tone: "orange",
        });
      });

      // Sort and slice
      localActivities.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setActivities(localActivities.slice(0, 5));
      setIsLoading(false);
      return;
    }

    try {
      const results = await Promise.allSettled([
        // Properties
        supabase
          .from("properties")
          .select("id, title, created_at, updated_at")
          .order("updated_at", { ascending: false })
          .limit(5),
        // Projects
        supabase
          .from("projects")
          .select("id, title, created_at, updated_at")
          .order("updated_at", { ascending: false })
          .limit(5),
        // Services
        supabase
          .from("services")
          .select("id, name, created_at, updated_at")
          .order("updated_at", { ascending: false })
          .limit(5),
        // Articles
        supabase
          .from("articles")
          .select("id, title, created_at, updated_at, published_at")
          .order("updated_at", { ascending: false })
          .limit(5),
        // Leads
        supabase
          .from("leads")
          .select("id, name, interest_type, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        // Profiles (Staff)
        supabase
          .from("profiles")
          .select("id, full_name, email, created_at, updated_at")
          .order("updated_at", { ascending: false })
          .limit(5),
      ]);

      const compiled: RecentActivity[] = [];

      // 1. Properties
      if (results[0].status === "fulfilled" && results[0].value.data) {
        results[0].value.data.forEach((p: any) => {
          const isNew = p.created_at === p.updated_at || !p.updated_at;
          compiled.push({
            id: `prop-${p.id}`,
            type: "property",
            action: isNew ? "created" : "updated",
            title: isNew ? "Property added" : "Property updated",
            detail: p.title,
            timestamp: p.updated_at || p.created_at,
            tone: isNew ? "orange" : "navy",
          });
        });
      }

      // 2. Projects
      if (results[1].status === "fulfilled" && results[1].value.data) {
        results[1].value.data.forEach((p: any) => {
          const isNew = p.created_at === p.updated_at || !p.updated_at;
          compiled.push({
            id: `proj-${p.id}`,
            type: "project",
            action: isNew ? "created" : "updated",
            title: isNew ? "Project created" : "Project updated",
            detail: p.title,
            timestamp: p.updated_at || p.created_at,
            tone: isNew ? "orange" : "navy",
          });
        });
      }

      // 3. Services
      if (results[2].status === "fulfilled" && results[2].value.data) {
        results[2].value.data.forEach((s: any) => {
          const isNew = s.created_at === s.updated_at || !s.updated_at;
          compiled.push({
            id: `srv-${s.id}`,
            type: "service",
            action: isNew ? "created" : "updated",
            title: isNew ? "Service package added" : "Service package updated",
            detail: s.name,
            timestamp: s.updated_at || s.created_at,
            tone: isNew ? "orange" : "navy",
          });
        });
      }

      // 4. Articles
      if (results[3].status === "fulfilled" && results[3].value.data) {
        results[3].value.data.forEach((a: any) => {
          const isPublished = !!a.published_at;
          compiled.push({
            id: `art-${a.id}`,
            type: "article",
            action: isPublished ? "published" : "created",
            title: isPublished ? "Article published" : "Article draft created",
            detail: a.title,
            timestamp: a.published_at || a.updated_at || a.created_at,
            tone: isPublished ? "orange" : "muted",
          });
        });
      }

      // 5. Leads
      if (results[4].status === "fulfilled" && results[4].value.data) {
        results[4].value.data.forEach((l: any) => {
          compiled.push({
            id: `lead-${l.id}`,
            type: "lead",
            action: "received",
            title: "New enquiry received",
            detail: `${l.name} · ${l.interest_type || "General enquiry"}`,
            timestamp: l.created_at,
            tone: "orange",
          });
        });
      }

      // 6. Profiles
      if (results[5].status === "fulfilled" && results[5].value.data) {
        results[5].value.data.forEach((pr: any) => {
          compiled.push({
            id: `prof-${pr.id}`,
            type: "staff",
            action: "created",
            title: "New staff registered",
            detail: pr.full_name || pr.email,
            timestamp: pr.created_at,
            tone: "muted",
          });
        });
      }

      // Sort and slice
      compiled.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setActivities(compiled.slice(0, 5));
    } catch (err) {
      console.error("Error generating recent activities:", err);
      setError(
        err instanceof Error
          ? err
          : new Error("Failed to load recent activities")
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();

    // Align with Leads hook 30-second polling for real-time overview state synchronization
    const interval = window.setInterval(() => {
      fetchActivities();
    }, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, [fetchActivities]);

  return {
    activities,
    isLoading,
    error,
    refetch: fetchActivities,
  };
}
