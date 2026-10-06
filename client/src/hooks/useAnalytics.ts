/**
 * ConcordVest Admin Analytics Data Hook
 *
 * Calls the secure database RPC: get_analytics_metrics(start_date, end_date)
 * Manages date ranges, loading states, error handling, and demo fallbacks.
 *
 * SECURITY: Never queries analytics_events directly.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  supabase,
  isSupabaseConfigured,
  type AnalyticsMetricsResponse,
} from "@/lib/supabase";

export type DateRangePreset = "today" | "7d" | "30d" | "90d" | "custom";

export interface DateRangeFilter {
  preset: DateRangePreset;
  customStartDate?: string; // YYYY-MM-DD
  customEndDate?: string;   // YYYY-MM-DD
}

/**
 * Computes ISO timestamp boundaries for a given date range filter.
 * Boundaries are [startDate, endDate) where endDate is exclusive.
 */
export function computeDateBoundaries(
  preset: DateRangePreset,
  customStart?: string,
  customEnd?: string
): { startDate: string; endDate: string } {
  const now = new Date();

  if (preset === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }

  if (preset === "7d") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }

  if (preset === "30d") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }

  if (preset === "90d") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }

  if (preset === "custom" && customStart && customEnd) {
    const [sY, sM, sD] = customStart.split("-").map(Number);
    const [eY, eM, eD] = customEnd.split("-").map(Number);
    const start = new Date(sY, sM - 1, sD, 0, 0, 0, 0);
    // Inclusive of the custom end date by extending boundary to start of next calendar day
    const end = new Date(eY, eM - 1, eD + 1, 0, 0, 0, 0);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }

  // Fallback default: 30 days
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

/**
 * Safely calculates a percentage rate formatted as a string (e.g. "12.5%").
 * Explicitly guards against division by zero, null, undefined, or negative values.
 */
export function calculateRate(numerator: number, denominator: number): string {
  if (!denominator || denominator <= 0 || !numerator || numerator < 0) {
    return "0.0%";
  }
  return ((numerator / denominator) * 100).toFixed(1) + "%";
}

/**
 * Safely calculates a percentage rate as a number (e.g. 12.5).
 * Explicitly guards against division by zero, null, undefined, or negative values.
 */
export function calculateRateNumeric(numerator: number, denominator: number): number {
  if (!denominator || denominator <= 0 || !numerator || numerator < 0) {
    return 0;
  }
  return Number(((numerator / denominator) * 100).toFixed(1));
}

/**
 * Resolves an entity ID to a human-readable title/name without exposing raw UUIDs.
 */
export function resolveEntityName(
  id: string | null | undefined,
  nameMap: Record<string, string>,
  fallback: string
): string {
  if (!id) return fallback;
  return nameMap[id] || fallback;
}

/**
 * Generates mock analytics response for prototype/demo workspace mode.
 */
function generateDemoAnalytics(preset: DateRangePreset): AnalyticsMetricsResponse {
  const daysCount = preset === "today" ? 1 : preset === "7d" ? 7 : preset === "90d" ? 90 : 30;
  const now = new Date();
  const dailyTraffic: AnalyticsMetricsResponse["dailyTraffic"] = [];

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const baseVisitors = 35 + ((i * 7 + 13) % 45);
    const baseEvents = baseVisitors * (3 + ((i * 3) % 3));
    dailyTraffic.push({
      date: dateStr,
      visitors: baseVisitors,
      events: baseEvents,
    });
  }

  const totalVisitors = dailyTraffic.reduce((acc, curr) => acc + curr.visitors, 0);
  const totalEvents = dailyTraffic.reduce((acc, curr) => acc + curr.events, 0);

  return {
    overview: {
      totalEvents,
      uniqueVisitors: Math.round(totalVisitors * 0.75),
      sessions: Math.round(totalVisitors * 0.95),
      propertyViews: Math.round(totalEvents * 0.42),
      serviceViews: Math.round(totalEvents * 0.22),
      whatsappClicks: Math.round(totalEvents * 0.09),
      enquiries: Math.round(totalEvents * 0.03),
    },
    trafficSources: [
      { source: "google", visitors: Math.round(totalVisitors * 0.45), events: Math.round(totalEvents * 0.44), whatsappClicks: 24, enquiries: 11 },
      { source: "direct", visitors: Math.round(totalVisitors * 0.28), events: Math.round(totalEvents * 0.27), whatsappClicks: 14, enquiries: 8 },
      { source: "instagram", visitors: Math.round(totalVisitors * 0.16), events: Math.round(totalEvents * 0.18), whatsappClicks: 18, enquiries: 5 },
      { source: "whatsapp", visitors: Math.round(totalVisitors * 0.11), events: Math.round(totalEvents * 0.11), whatsappClicks: 9, enquiries: 3 },
    ],
    trafficMediums: [
      { medium: "organic", visitors: Math.round(totalVisitors * 0.45), events: Math.round(totalEvents * 0.44), whatsappClicks: 24, enquiries: 11 },
      { medium: "none", visitors: Math.round(totalVisitors * 0.28), events: Math.round(totalEvents * 0.27), whatsappClicks: 14, enquiries: 8 },
      { medium: "social", visitors: Math.round(totalVisitors * 0.16), events: Math.round(totalEvents * 0.18), whatsappClicks: 18, enquiries: 5 },
      { medium: "referral", visitors: Math.round(totalVisitors * 0.11), events: Math.round(totalEvents * 0.11), whatsappClicks: 9, enquiries: 3 },
    ],
    campaigns: [
      { campaign: "none", visitors: Math.round(totalVisitors * 0.82), events: Math.round(totalEvents * 0.81), whatsappClicks: 45, enquiries: 18 },
      { campaign: "ikoyi_luxury_launch", visitors: Math.round(totalVisitors * 0.12), events: Math.round(totalEvents * 0.13), whatsappClicks: 14, enquiries: 6 },
      { campaign: "banana_island_promo", visitors: Math.round(totalVisitors * 0.06), events: Math.round(totalEvents * 0.06), whatsappClicks: 6, enquiries: 3 },
    ],
    topProperties: [
      { propertyId: "demo-1", views: 320, whatsappClicks: 65, enquiries: 19 },
      { propertyId: "demo-2", views: 240, whatsappClicks: 48, enquiries: 14 },
      { propertyId: "demo-3", views: 180, whatsappClicks: 36, enquiries: 11 },
      { propertyId: "demo-4", views: 140, whatsappClicks: 28, enquiries: 8 },
      { propertyId: "demo-5", views: 110, whatsappClicks: 22, enquiries: 6 },
    ],
    topServices: [
      { serviceId: "svc-01", views: 190, whatsappClicks: 42, enquiries: 13 },
      { serviceId: "svc-02", views: 150, whatsappClicks: 33, enquiries: 10 },
      { serviceId: "svc-03", views: 120, whatsappClicks: 26, enquiries: 7 },
    ],
    referrers: [
      { referrer: "direct", visitors: Math.round(totalVisitors * 0.35), events: Math.round(totalEvents * 0.33) },
      { referrer: "https://www.google.com", visitors: Math.round(totalVisitors * 0.33), events: Math.round(totalEvents * 0.34) },
      { referrer: "https://l.instagram.com", visitors: Math.round(totalVisitors * 0.18), events: Math.round(totalEvents * 0.2) },
      { referrer: "https://m.facebook.com", visitors: Math.round(totalVisitors * 0.14), events: Math.round(totalEvents * 0.13) },
    ],
    dailyTraffic,
    enquiryTypes: [
      { type: "Property Enquiry", count: 14 },
      { type: "Viewing Request", count: 7 },
      { type: "Building Project", count: 3 },
      { type: "Renovation Quote", count: 2 },
      { type: "Agent Conversation", count: 1 },
    ],
  };
}

export function useAnalytics() {
  const [filter, setFilter] = useState<DateRangeFilter>({
    preset: "30d",
  });
  const [data, setData] = useState<AnalyticsMetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const { startDate, endDate } = useMemo(
    () => computeDateBoundaries(filter.preset, filter.customStartDate, filter.customEndDate),
    [filter.preset, filter.customStartDate, filter.customEndDate]
  );

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      // Prototype workspace mode with demo metrics
      setData(generateDemoAnalytics(filter.preset));
      setIsLoading(false);
      return;
    }

    try {
      const { data: rpcData, error: rpcError } = await (supabase.rpc as any)(
        "get_analytics_metrics",
        {
          start_date: startDate,
          end_date: endDate,
        }
      );

      if (rpcError) {
        console.error("Analytics RPC error:", rpcError);
        setError(new Error("Analytics data could not be loaded."));
      } else {
        const raw = rpcData as Partial<AnalyticsMetricsResponse>;
        const normalized: AnalyticsMetricsResponse = {
          overview: raw.overview || {
            totalEvents: 0,
            uniqueVisitors: 0,
            sessions: 0,
            propertyViews: 0,
            serviceViews: 0,
            whatsappClicks: 0,
            enquiries: 0,
          },
          trafficSources: (raw.trafficSources || []).map(s => ({
            source: s.source || "direct",
            visitors: s.visitors || 0,
            events: s.events || 0,
            whatsappClicks: s.whatsappClicks || 0,
            enquiries: s.enquiries || 0,
          })),
          trafficMediums: (raw.trafficMediums || []).map(m => ({
            medium: m.medium || "none",
            visitors: m.visitors || 0,
            events: m.events || 0,
            whatsappClicks: m.whatsappClicks || 0,
            enquiries: m.enquiries || 0,
          })),
          campaigns: (raw.campaigns || []).map(c => ({
            campaign: c.campaign || "none",
            visitors: c.visitors || 0,
            events: c.events || 0,
            whatsappClicks: c.whatsappClicks || 0,
            enquiries: c.enquiries || 0,
          })),
          topProperties: (raw.topProperties || []).map(p => ({
            propertyId: p.propertyId || "",
            views: p.views || 0,
            whatsappClicks: p.whatsappClicks || 0,
            enquiries: p.enquiries || 0,
          })),
          topServices: (raw.topServices || []).map(s => ({
            serviceId: s.serviceId || "",
            views: s.views || 0,
            whatsappClicks: s.whatsappClicks || 0,
            enquiries: s.enquiries || 0,
          })),
          referrers: (raw.referrers || []).map(r => ({
            referrer: r.referrer || "direct",
            visitors: r.visitors || 0,
            events: r.events || 0,
          })),
          dailyTraffic: (raw.dailyTraffic || []).map(d => ({
            date: d.date || "",
            visitors: d.visitors || 0,
            events: d.events || 0,
          })),
          enquiryTypes: (raw.enquiryTypes || []).map(e => ({
            type: e.type || "other",
            count: e.count || 0,
          })),
        };
        setData(normalized);
      }
    } catch (err) {
      console.error("Unexpected error executing analytics RPC:", err);
      setError(new Error("Analytics data could not be loaded."));
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, filter.preset]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const setPreset = useCallback((preset: DateRangePreset) => {
    setFilter(prev => ({
      ...prev,
      preset,
    }));
  }, []);

  const setCustomRange = useCallback((startDateStr: string, endDateStr: string) => {
    setFilter({
      preset: "custom",
      customStartDate: startDateStr,
      customEndDate: endDateStr,
    });
  }, []);

  return {
    data,
    isLoading,
    error,
    filter,
    setPreset,
    setCustomRange,
    refetch: fetchMetrics,
    startDate,
    endDate,
  };
}
