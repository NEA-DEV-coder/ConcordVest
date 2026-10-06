// @vitest-environment jsdom
/**
 * ConcordVest Analytics Utility Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  VISITOR_ID_STORAGE_KEY,
  SESSION_ID_STORAGE_KEY,
  UTM_STORAGE_KEY,
  generateAnonymousId,
  getVisitorId,
  getSessionId,
  extractUtmParameters,
  getAttributionParameters,
  trackEvent,
} from "./analytics";
import * as supabaseModule from "@/lib/supabase";

// In-memory mock storage implementation if jsdom storage is missing or restricted
function createMockStorage(): Storage {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
}

if (!globalThis.localStorage || typeof globalThis.localStorage.clear !== "function") {
  Object.defineProperty(globalThis, "localStorage", {
    value: createMockStorage(),
    writable: true,
  });
}

if (!globalThis.sessionStorage || typeof globalThis.sessionStorage.clear !== "function") {
  Object.defineProperty(globalThis, "sessionStorage", {
    value: createMockStorage(),
    writable: true,
  });
}

describe("generateAnonymousId", () => {
  it("generates non-empty string IDs without PII", () => {
    const id1 = generateAnonymousId();
    const id2 = generateAnonymousId();

    expect(typeof id1).toBe("string");
    expect(id1.length).toBeGreaterThan(10);
    expect(id1).not.toBe(id2);

    // Verify absence of email or IP markers
    expect(id1).not.toContain("@");
    expect(id1).not.toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
  });
});

describe("Visitor ID Management", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("generates and persists an anonymous visitor ID in localStorage", () => {
    expect(localStorage.getItem(VISITOR_ID_STORAGE_KEY)).toBeNull();

    const id = getVisitorId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
    expect(localStorage.getItem(VISITOR_ID_STORAGE_KEY)).toBe(id);
  });

  it("reuses existing visitor ID from localStorage across invocations", () => {
    const existingId = "existing-visitor-12345";
    localStorage.setItem(VISITOR_ID_STORAGE_KEY, existingId);

    const retrievedId = getVisitorId();
    expect(retrievedId).toBe(existingId);
    expect(localStorage.getItem(VISITOR_ID_STORAGE_KEY)).toBe(existingId);
  });
});

describe("Session ID Management", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("generates and persists an anonymous session ID in sessionStorage", () => {
    expect(sessionStorage.getItem(SESSION_ID_STORAGE_KEY)).toBeNull();

    const id = getSessionId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
    expect(sessionStorage.getItem(SESSION_ID_STORAGE_KEY)).toBe(id);
  });

  it("reuses existing session ID from sessionStorage across calls", () => {
    const existingSession = "existing-session-67890";
    sessionStorage.setItem(SESSION_ID_STORAGE_KEY, existingSession);

    const retrievedSession = getSessionId();
    expect(retrievedSession).toBe(existingSession);
    expect(sessionStorage.getItem(SESSION_ID_STORAGE_KEY)).toBe(existingSession);
  });
});

describe("UTM Parameter Capture & Attribution", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("extracts UTM parameters from query string correctly", () => {
    const query =
      "?utm_source=instagram&utm_medium=social&utm_campaign=luxury_villas&utm_content=carousel_ad&utm_term=abuja_real_estate";
    const utm = extractUtmParameters(query);

    expect(utm.source).toBe("instagram");
    expect(utm.medium).toBe("social");
    expect(utm.campaign).toBe("luxury_villas");
    expect(utm.content).toBe("carousel_ad");
    expect(utm.term).toBe("abuja_real_estate");
  });

  it("handles missing or partial UTM parameters gracefully", () => {
    const query = "?utm_source=newsletter";
    const utm = extractUtmParameters(query);

    expect(utm.source).toBe("newsletter");
    expect(utm.medium).toBeNull();
    expect(utm.campaign).toBeNull();
    expect(utm.content).toBeNull();
    expect(utm.term).toBeNull();
  });

  it("persists UTM parameters to sessionStorage for cross-page session attribution", () => {
    const query = "?utm_source=google&utm_medium=cpc&utm_campaign=spring_launch";
    const utm = extractUtmParameters(query);

    // Save as session attribution
    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));

    // When called on another page without query params
    const attribution = getAttributionParameters();
    expect(attribution.source).toBe("google");
    expect(attribution.medium).toBe("cpc");
    expect(attribution.campaign).toBe("spring_launch");
  });
});

describe("trackEvent Execution", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("skips tracking and logs warning when eventName is empty or invalid", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const res1 = await trackEvent("");
    expect(res1.success).toBe(false);

    const res2 = await trackEvent("   ");
    expect(res2.success).toBe(false);

    expect(warnSpy).toHaveBeenCalled();
  });

  it("gathers required parameters and safely skips insert if Supabase is unconfigured", async () => {
    vi.spyOn(supabaseModule, "isSupabaseConfigured").mockReturnValue(false);

    const result = await trackEvent("page_view");
    expect(result.success).toBe(true);
  });

  it("inserts populated event payload when Supabase is configured", async () => {
    vi.spyOn(supabaseModule, "isSupabaseConfigured").mockReturnValue(true);

    let insertedPayload: any = null;
    const mockInsert = vi.fn().mockImplementation((payload: any) => {
      insertedPayload = payload;
      return Promise.resolve({ error: null });
    });

    vi.spyOn(supabaseModule.supabase, "from").mockReturnValue({
      insert: mockInsert,
    } as any);

    const result = await trackEvent("property_view", {
      propertyId: "prop-uuid-123",
      metadata: { source_card: "featured_slider" },
    });

    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(insertedPayload).toBeDefined();
    expect(insertedPayload.event_name).toBe("property_view");
    expect(insertedPayload.property_id).toBe("prop-uuid-123");
    expect(insertedPayload.metadata).toEqual({ source_card: "featured_slider" });
    expect(insertedPayload.visitor_id).toBeDefined();
    expect(insertedPayload.session_id).toBeDefined();
    expect(insertedPayload.page_path).toBeDefined();
  });

  it("handles Supabase insertion errors gracefully without throwing to the UI", async () => {
    vi.spyOn(supabaseModule, "isSupabaseConfigured").mockReturnValue(true);

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const mockInsert = vi.fn().mockResolvedValue({
      error: { message: "Row Level Security policy violation" },
    });

    vi.spyOn(supabaseModule.supabase, "from").mockReturnValue({
      insert: mockInsert,
    } as any);

    // Must NOT throw
    const result = await trackEvent("click_contact");
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain("Row Level Security");
    expect(warnSpy).toHaveBeenCalled();
  });

  it("allows overriding pagePath, pageTitle, and referrer", async () => {
    vi.spyOn(supabaseModule, "isSupabaseConfigured").mockReturnValue(true);

    let insertedPayload: any = null;
    const mockInsert = vi.fn().mockImplementation((payload: any) => {
      insertedPayload = payload;
      return Promise.resolve({ error: null });
    });

    vi.spyOn(supabaseModule.supabase, "from").mockReturnValue({
      insert: mockInsert,
    } as any);

    await trackEvent("service_view", {
      serviceId: "srv-456",
      pagePath: "/services/architectural-design",
      pageTitle: "Architectural Design | ConcordVest",
      referrer: "https://google.com",
    });

    expect(insertedPayload.page_path).toBe("/services/architectural-design");
    expect(insertedPayload.page_title).toBe(
      "Architectural Design | ConcordVest"
    );
    expect(insertedPayload.referrer).toBe("https://google.com");
    expect(insertedPayload.service_id).toBe("srv-456");
  });

  it("supports session-based deduplication for property views", async () => {
    vi.spyOn(supabaseModule, "isSupabaseConfigured").mockReturnValue(true);

    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    vi.spyOn(supabaseModule.supabase, "from").mockReturnValue({
      insert: mockInsert,
    } as any);

    const SESSION_KEY = "concordvest_viewed_properties";
    const recordPropertyView = async (propId: string) => {
      const stored = sessionStorage.getItem(SESSION_KEY);
      const viewed: string[] = stored ? JSON.parse(stored) : [];
      if (!viewed.includes(propId)) {
        viewed.push(propId);
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(viewed));
        await trackEvent("property_view", { propertyId: propId });
      }
    };

    // First view of Property A
    await recordPropertyView("cv-001");
    expect(mockInsert).toHaveBeenCalledTimes(1);

    // Refresh / re-render of Property A in same session
    await recordPropertyView("cv-001");
    expect(mockInsert).toHaveBeenCalledTimes(1); // Not called again

    // View Property B
    await recordPropertyView("cv-002");
    expect(mockInsert).toHaveBeenCalledTimes(2);

    // Re-visit Property A in same session
    await recordPropertyView("cv-001");
    expect(mockInsert).toHaveBeenCalledTimes(2); // Still not called again
  });

  it("supports session-based deduplication for service views with concordvest_viewed_services", async () => {
    vi.spyOn(supabaseModule, "isSupabaseConfigured").mockReturnValue(true);

    const insertedList: any[] = [];
    const mockInsert = vi.fn().mockImplementation((data: any) => {
      insertedList.push(data);
      return Promise.resolve({ error: null });
    });
    vi.spyOn(supabaseModule.supabase, "from").mockReturnValue({
      insert: mockInsert,
    } as any);

    const SESSION_KEY = "concordvest_viewed_services";
    const inMemoryFallback = new Set<string>();

    const recordServiceView = async (serviceId: string) => {
      let alreadyViewed = inMemoryFallback.has(serviceId);
      try {
        const stored = sessionStorage.getItem(SESSION_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.includes(serviceId)) {
            alreadyViewed = true;
          }
        }
      } catch {
        // storage restricted
      }

      if (!alreadyViewed) {
        inMemoryFallback.add(serviceId);
        try {
          const stored = sessionStorage.getItem(SESSION_KEY);
          const list = stored ? JSON.parse(stored) : [];
          if (!list.includes(serviceId)) {
            list.push(serviceId);
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(list));
          }
        } catch {
          // storage restricted
        }

        await trackEvent("service_view", {
          serviceId,
          metadata: {
            location: "service_detail",
          },
        });
      }
    };

    // 1. Opens Service A -> count once
    await recordServiceView("svc-01");
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(insertedList[0].event_name).toBe("service_view");
    expect(insertedList[0].service_id).toBe("svc-01");
    expect(insertedList[0].metadata).toEqual({ location: "service_detail" });

    // 2. Refreshes Service A -> do not count again
    await recordServiceView("svc-01");
    expect(mockInsert).toHaveBeenCalledTimes(1);

    // 3. Opens Service B -> count once
    await recordServiceView("svc-02");
    expect(mockInsert).toHaveBeenCalledTimes(2);
    expect(insertedList[1].service_id).toBe("svc-02");

    // 4. Returns to Service A -> do not count again during same session
    await recordServiceView("svc-01");
    expect(mockInsert).toHaveBeenCalledTimes(2);
  });

  describe("WhatsApp Click Tracking (whatsapp_click)", () => {
    it("tracks whatsapp_click with propertyId and location: property_detail", async () => {
      vi.spyOn(supabaseModule, "isSupabaseConfigured").mockReturnValue(true);

      let payload: any = null;
      const mockInsert = vi.fn().mockImplementation((data: any) => {
        payload = data;
        return Promise.resolve({ error: null });
      });

      vi.spyOn(supabaseModule.supabase, "from").mockReturnValue({
        insert: mockInsert,
      } as any);

      const result = await trackEvent("whatsapp_click", {
        propertyId: "prop-456",
        metadata: {
          location: "property_detail",
        },
      });

      expect(result.success).toBe(true);
      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(payload.event_name).toBe("whatsapp_click");
      expect(payload.property_id).toBe("prop-456");
      expect(payload.metadata).toEqual({ location: "property_detail" });
      expect(payload.metadata).not.toHaveProperty("phone");
      expect(payload.metadata).not.toHaveProperty("whatsapp");
    });

    it("tracks whatsapp_click for header and general locations", async () => {
      vi.spyOn(supabaseModule, "isSupabaseConfigured").mockReturnValue(true);

      const payloads: any[] = [];
      const mockInsert = vi.fn().mockImplementation((data: any) => {
        payloads.push(data);
        return Promise.resolve({ error: null });
      });

      vi.spyOn(supabaseModule.supabase, "from").mockReturnValue({
        insert: mockInsert,
      } as any);

      // Header click
      await trackEvent("whatsapp_click", {
        metadata: { location: "header" },
      });

      // Mobile floating CTA
      await trackEvent("whatsapp_click", {
        metadata: { location: "general" },
      });

      expect(payloads).toHaveLength(2);
      expect(payloads[0].metadata).toEqual({ location: "header" });
      expect(payloads[1].metadata).toEqual({ location: "general" });
    });

    it("tracks whatsapp_click for service flows with serviceId", async () => {
      vi.spyOn(supabaseModule, "isSupabaseConfigured").mockReturnValue(true);

      let payload: any = null;
      const mockInsert = vi.fn().mockImplementation((data: any) => {
        payload = data;
        return Promise.resolve({ error: null });
      });

      vi.spyOn(supabaseModule.supabase, "from").mockReturnValue({
        insert: mockInsert,
      } as any);

      await trackEvent("whatsapp_click", {
        serviceId: "srv-kitchen-123",
        metadata: { location: "service" },
      });

      expect(payload.event_name).toBe("whatsapp_click");
      expect(payload.service_id).toBe("srv-kitchen-123");
      expect(payload.metadata).toEqual({ location: "service" });
    });

    it("tracks whatsapp_click for contact and building consultation flows", async () => {
      vi.spyOn(supabaseModule, "isSupabaseConfigured").mockReturnValue(true);

      let payload: any = null;
      const mockInsert = vi.fn().mockImplementation((data: any) => {
        payload = data;
        return Promise.resolve({ error: null });
      });

      vi.spyOn(supabaseModule.supabase, "from").mockReturnValue({
        insert: mockInsert,
      } as any);

      await trackEvent("whatsapp_click", {
        metadata: { location: "contact" },
      });

      expect(payload.event_name).toBe("whatsapp_click");
      expect(payload.metadata).toEqual({ location: "contact" });
    });
  });
});

