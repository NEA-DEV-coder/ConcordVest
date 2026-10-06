/**
 * ConcordVest Analytics Tracking Utility
 *
 * Provides a lightweight, privacy-conscious analytics utility for tracking
 * user interactions, page views, and conversions.
 *
 * Privacy Invariants:
 * - Strictly anonymous identifiers (random UUIDs / opaque tokens).
 * - Never stores or transmits PII (name, email, phone number, IP address)
 *   in visitor_id, session_id, or default event parameters.
 * - Non-blocking and fault-tolerant: analytics errors are caught and logged
 *   to console.warn without throwing or breaking UI execution.
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const VISITOR_ID_STORAGE_KEY = "concordvest_visitor_id";
export const SESSION_ID_STORAGE_KEY = "concordvest_session_id";
export const UTM_STORAGE_KEY = "concordvest_utm_params";

export interface UtmParameters {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  term: string | null;
}

export interface AnalyticsEventData {
  propertyId?: string | null;
  serviceId?: string | null;
  metadata?: Record<string, unknown> | null;
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  content?: string | null;
  term?: string | null;
  pagePath?: string | null;
  pageTitle?: string | null;
  referrer?: string | null;
}

export interface AnalyticsEventPayload {
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
}

// In-memory fallbacks if Web Storage is disabled or restricted (e.g. private mode)
let memoryVisitorId: string | null = null;
let memorySessionId: string | null = null;
let memoryUtmParams: UtmParameters | null = null;

/**
 * Generate a cryptographically random, non-PII unique identifier.
 */
export function generateAnonymousId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  // Fallback for older browser runtimes
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  const extra = Math.random().toString(36).substring(2, 6);
  return `cv-${timestamp}-${randomPart}-${extra}`;
}

/**
 * Retrieve or generate an anonymous, persistent visitor ID.
 * Stored in localStorage under "concordvest_visitor_id".
 */
export function getVisitorId(): string {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const stored = window.localStorage.getItem(VISITOR_ID_STORAGE_KEY);
      if (stored && stored.trim()) {
        return stored.trim();
      }
      const newId = generateAnonymousId();
      window.localStorage.setItem(VISITOR_ID_STORAGE_KEY, newId);
      return newId;
    }
  } catch {
    // LocalStorage restricted or disabled
  }

  if (!memoryVisitorId) {
    memoryVisitorId = generateAnonymousId();
  }
  return memoryVisitorId;
}

/**
 * Retrieve or generate an anonymous session ID.
 * Stored in sessionStorage under "concordvest_session_id".
 * A new ID is automatically generated when a new browser session begins.
 */
export function getSessionId(): string {
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      const stored = window.sessionStorage.getItem(SESSION_ID_STORAGE_KEY);
      if (stored && stored.trim()) {
        return stored.trim();
      }
      const newId = generateAnonymousId();
      window.sessionStorage.setItem(SESSION_ID_STORAGE_KEY, newId);
      return newId;
    }
  } catch {
    // SessionStorage restricted or disabled
  }

  if (!memorySessionId) {
    memorySessionId = generateAnonymousId();
  }
  return memorySessionId;
}

/**
 * Extract UTM parameters from a query string or the current URL.
 */
export function extractUtmParameters(searchQuery?: string): UtmParameters {
  const result: UtmParameters = {
    source: null,
    medium: null,
    campaign: null,
    content: null,
    term: null,
  };

  try {
    const search =
      searchQuery !== undefined
        ? searchQuery
        : typeof window !== "undefined"
          ? window.location.search
          : "";

    if (search) {
      const params = new URLSearchParams(search);
      result.source = params.get("utm_source") || null;
      result.medium = params.get("utm_medium") || null;
      result.campaign = params.get("utm_campaign") || null;
      result.content = params.get("utm_content") || null;
      result.term = params.get("utm_term") || null;
    }
  } catch {
    // Malformed search query
  }

  return result;
}

/**
 * Get active UTM attribution parameters.
 * Captures UTM parameters from current URL and persists them in sessionStorage
 * so attribution is retained across subsequent page views within the session.
 */
export function getAttributionParameters(): UtmParameters {
  const fromUrl = extractUtmParameters();
  const hasUrlUtm = Boolean(
    fromUrl.source ||
      fromUrl.medium ||
      fromUrl.campaign ||
      fromUrl.content ||
      fromUrl.term
  );

  if (hasUrlUtm) {
    // Save to sessionStorage for first-touch attribution throughout this session
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(fromUrl));
      }
    } catch {
      // Storage restricted
    }
    memoryUtmParams = fromUrl;
    return fromUrl;
  }

  // Fallback to active session attribution if previously recorded
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      const stored = window.sessionStorage.getItem(UTM_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UtmParameters;
        return {
          source: parsed.source || null,
          medium: parsed.medium || null,
          campaign: parsed.campaign || null,
          content: parsed.content || null,
          term: parsed.term || null,
        };
      }
    }
  } catch {
    // Storage restricted or malformed JSON
  }

  if (memoryUtmParams) {
    return memoryUtmParams;
  }

  return fromUrl;
}

/**
 * Track an analytics event.
 * Automatically enriches the payload with anonymous visitor_id, session_id,
 * current page path, page title, referrer, and UTM attribution parameters.
 *
 * Safe and non-blocking: errors are caught and logged to console.warn without throwing.
 */
export async function trackEvent(
  eventName: string,
  data?: AnalyticsEventData
): Promise<{ success: boolean; error?: Error | null }> {
  try {
    if (!eventName || typeof eventName !== "string" || !eventName.trim()) {
      console.warn(
        "[Analytics] Skipped tracking: eventName must be a non-empty string."
      );
      return { success: false, error: new Error("Invalid eventName") };
    }

    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    const attribution = getAttributionParameters();

    const pagePath =
      data?.pagePath !== undefined && data?.pagePath !== null
        ? data.pagePath
        : typeof window !== "undefined"
          ? window.location.pathname
          : "/";

    const pageTitle =
      data?.pageTitle !== undefined && data?.pageTitle !== null
        ? data.pageTitle
        : typeof document !== "undefined"
          ? document.title || null
          : null;

    const referrer =
      data?.referrer !== undefined && data?.referrer !== null
        ? data.referrer
        : typeof document !== "undefined"
          ? document.referrer || null
          : null;

    const payload: AnalyticsEventPayload = {
      event_name: eventName.trim(),
      visitor_id: visitorId,
      session_id: sessionId,
      page_path: pagePath,
      page_title: pageTitle,
      property_id: data?.propertyId || null,
      service_id: data?.serviceId || null,
      source: data?.source !== undefined ? data.source : attribution.source,
      medium: data?.medium !== undefined ? data.medium : attribution.medium,
      campaign:
        data?.campaign !== undefined ? data.campaign : attribution.campaign,
      content: data?.content !== undefined ? data.content : attribution.content,
      term: data?.term !== undefined ? data.term : attribution.term,
      referrer,
      metadata: data?.metadata || null,
    };

    if (!isSupabaseConfigured()) {
      // In dev or demo mode without Supabase credentials, do not attempt insert
      return { success: true };
    }

    const { error } = await supabase
      .from("analytics_events")
      .insert(payload as never);

    if (error) {
      console.warn(
        `[Analytics] Failed to record event "${eventName}":`,
        error.message
      );
      return { success: false, error: new Error(error.message) };
    }

    return { success: true, error: null };
  } catch (err) {
    const errorObj =
      err instanceof Error ? err : new Error("Unexpected error in trackEvent");
    console.warn("[Analytics] Error tracking event:", errorObj.message);
    return { success: false, error: errorObj };
  }
}

