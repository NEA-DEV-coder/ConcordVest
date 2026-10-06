/**
 * Tests for ConcordVest Lead conversion and validation utilities
 */

import { describe, it, expect, vi } from "vitest";
import {
  leadPayloadToDb,
  leadDbToPayload,
  submitLead,
} from "../hooks/useLeads";
import { type LeadPayload, buildBuildingProjectWhatsAppMessage } from "./leads";
import { type Lead } from "./supabase";
import * as analyticsModule from "./analytics";
import * as supabaseModule from "./supabase";

describe("leadPayloadToDb", () => {
  it("correctly maps camelCase frontend payload to snake_case database insert object", () => {
    const payload: LeadPayload = {
      id: "lead-12345", // temporary or invalid UUID format
      name: "Chinedu Okafor",
      email: "chinedu@example.com",
      phone: "08012345678",
      whatsapp: "08012345678",
      interestType: "Property Enquiry",
      propertyId: "3b764267-27b9-4c8d-9fa6-200cc550ad41",
      serviceId: "5c864267-27b9-4c8d-9fa6-200cc550ad42",
      message: "I am interested in buying this terrace.",
      source: "Google",
      page: "http://localhost:5173/properties/terrace",
      date: new Date().toISOString(),
      status: "New",
      notes: "First follow-up call scheduled.",
      assignedTo: "8b764267-27b9-4c8d-9fa6-200cc550ad43",
      preferredDate: "2026-09-01",
      preferredTime: "Morning · 9:00–12:00",
      isRead: false,
    };

    const dbRecord = leadPayloadToDb(payload, true); // isNew = true

    expect(dbRecord.name).toBe("Chinedu Okafor");
    expect(dbRecord.email).toBe("chinedu@example.com");
    expect(dbRecord.phone).toBe("08012345678");
    expect(dbRecord.whatsapp).toBe("08012345678");
    expect(dbRecord.interest_type).toBe("Property Enquiry");
    expect(dbRecord.property_id).toBe("3b764267-27b9-4c8d-9fa6-200cc550ad41");
    expect(dbRecord.service_id).toBe("5c864267-27b9-4c8d-9fa6-200cc550ad42");
    expect(dbRecord.message).toBe("I am interested in buying this terrace.");
    expect(dbRecord.source).toBe("Google");
    expect(dbRecord.page_url).toBe("http://localhost:5173/properties/terrace");
    expect(dbRecord.status).toBe("new");
    expect(dbRecord.notes).toBe("First follow-up call scheduled.");
    expect(dbRecord.assigned_to).toBe("8b764267-27b9-4c8d-9fa6-200cc550ad43");
    expect(dbRecord.preferred_date).toBe("2026-09-01");
    expect(dbRecord.preferred_time).toBe("Morning · 9:00–12:00");
    expect(dbRecord.is_read).toBe(false);

    // Should omit temporary non-UUID ID for new records
    expect(dbRecord.id).toBeUndefined();
  });

  it("retains valid UUID id for existing records being updated", () => {
    const validUuid = "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d";
    const payload: LeadPayload = {
      id: validUuid,
      name: "Audu",
      email: "audu@example.com",
      phone: "123",
      whatsapp: "",
      interestType: "Agent Conversation",
      message: "",
      source: "Direct",
      page: "",
      date: "",
      status: "Contacted",
      isRead: true,
    };

    const dbRecord = leadPayloadToDb(payload, false); // isNew = false
    expect(dbRecord.id).toBe(validUuid);
    expect(dbRecord.status).toBe("contacted");
  });
});

describe("leadDbToPayload", () => {
  it("correctly maps snake_case database row to camelCase frontend payload and resolves names", () => {
    const dbRow: Lead = {
      id: "uuid-1234",
      name: "Grace Benson",
      email: "grace@example.com",
      phone: "09087654321",
      whatsapp: null,
      interest_type: "Renovation Quote",
      property_id: null,
      service_id: "srv-uuid-5678",
      message: "Please renovate my bathroom.",
      source: "Instagram",
      page_url: "http://concordvest.com/services/bathroom",
      status: "appointment",
      notes: "Wants premium tiling.",
      assigned_to: "profile-uuid-abc",
      preferred_date: "2026-10-12",
      preferred_time: "Afternoon · 12:00–15:00",
      is_read: true,
      created_at: "2026-08-28T10:00:00Z",
      updated_at: "2026-08-28T11:00:00Z",
    };

    const propertyLookup = { "prop-123": "Maitama Heights" };
    const serviceLookup = { "srv-uuid-5678": "Luxury Bathroom Upgrade" };

    const payload = leadDbToPayload(dbRow, propertyLookup, serviceLookup);

    expect(payload.id).toBe("uuid-1234");
    expect(payload.name).toBe("Grace Benson");
    expect(payload.email).toBe("grace@example.com");
    expect(payload.phone).toBe("09087654321");
    expect(payload.whatsapp).toBe("");
    expect(payload.interestType).toBe("Renovation Quote");
    expect(payload.propertyId).toBeUndefined();
    expect(payload.serviceId).toBe("srv-uuid-5678");
    expect(payload.property).toBeUndefined();
    expect(payload.service).toBe("Luxury Bathroom Upgrade"); // successfully resolved
    expect(payload.message).toBe("Please renovate my bathroom.");
    expect(payload.source).toBe("Instagram");
    expect(payload.page).toBe("http://concordvest.com/services/bathroom");
    expect(payload.status).toBe("Appointment"); // properly capitalized
    expect(payload.notes).toBe("Wants premium tiling.");
    expect(payload.assignedTo).toBe("profile-uuid-abc");
    expect(payload.preferredDate).toBe("2026-10-12");
    expect(payload.preferredTime).toBe("Afternoon · 12:00–15:00");
    expect(payload.isRead).toBe(true);
  });
});

describe("submitLead Validations", () => {
  it("rejects payload with empty name", async () => {
    const payload = {
      name: "",
      phone: "080",
      whatsapp: "",
      email: "test@example.com",
      interestType: "Property Enquiry" as const,
      message: "Hello",
      source: "Direct" as const,
      page: "",
    };

    const result = await submitLead(payload);
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain("Name is required");
  });

  it("rejects payload with invalid email format", async () => {
    const payload = {
      name: "Tunde",
      phone: "080",
      whatsapp: "",
      email: "invalid-email-format",
      interestType: "Property Enquiry" as const,
      message: "Hello",
      source: "Direct" as const,
      page: "",
    };

    const result = await submitLead(payload);
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain("valid email address");
  });
});

describe("Building Project Lead & WhatsApp formatting", () => {
  it("converts Building Project lead payload to db record correctly", () => {
    const payload: LeadPayload = {
      id: "test-building-id",
      name: "Ibrahim Abubakar",
      email: "ibrahim@example.com",
      phone: "08012345678",
      whatsapp: "08012345678",
      interestType: "Building Project",
      message:
        "[BUILDING PROJECT CONSULTATION]\nBuilding Type: Residential Home\nLand Status: Yes, I already have land",
      source: "Direct",
      page: "/start-building-project",
      date: new Date().toISOString(),
      status: "New",
      isRead: false,
    };

    const dbRecord = leadPayloadToDb(payload, true);
    expect(dbRecord.interest_type).toBe("Building Project");
    expect(dbRecord.page_url).toBe("/start-building-project");
    expect(dbRecord.source).toBe("Direct");
    expect(dbRecord.message).toContain("[BUILDING PROJECT CONSULTATION]");
  });

  it("builds concise, correctly formatted WhatsApp message for building project", () => {
    const message = buildBuildingProjectWhatsAppMessage({
      name: "Ibrahim Abubakar",
      buildingType: "Residential Home",
      landStatus: "Yes, I already have land",
      stage: "I have architectural drawings/plans",
      budget: "₦100M – ₦250M",
    });

    expect(message).toContain(
      "Hello Concordvest, I just submitted a Building Project assessment."
    );
    expect(message).toContain("Name: Ibrahim Abubakar");
    expect(message).toContain("Project: Residential Home");
    expect(message).toContain("Land: Yes, I already have land");
    expect(message).toContain("Stage: I have architectural drawings/plans");
    expect(message).toContain("Budget: ₦100M – ₦250M");
    expect(message).toContain(
      "I would like to speak with an agent about next steps."
    );
  });

  it("handles empty budget gracefully in WhatsApp message", () => {
    const message = buildBuildingProjectWhatsAppMessage({
      name: "Fatima Danjuma",
      buildingType: "Commercial Building",
      landStatus: "No, I need help finding land",
      stage: "Just an idea",
      budget: "",
    });

    expect(message).toContain("Budget: To discuss");
  });
});

describe("submitLead Analytics Tracking (enquiry_submit)", () => {
  it("tracks enquiry_submit with propertyId, interestType, and location on successful submission", async () => {
    vi.spyOn(supabaseModule, "isSupabaseConfigured").mockReturnValue(true);
    vi.spyOn(supabaseModule.supabase, "from").mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    } as any);

    const trackSpy = vi.spyOn(analyticsModule, "trackEvent").mockResolvedValue({
      success: true,
    });

    const payload = {
      name: "Amina Yusuf",
      phone: "08012345678",
      whatsapp: "08012345678",
      email: "amina@example.com",
      interestType: "Property Enquiry" as const,
      propertyId: "3b764267-27b9-4c8d-9fa6-200cc550ad41",
      property: "Asokoro Contemporary Villa",
      message: "I want to schedule an inspection.",
      source: "Direct" as const,
      page: "/properties/asokoro-villa",
      location: "property_enquiry",
      formType: "property_enquiry_modal",
    };

    const result = await submitLead(payload);
    expect(result.success).toBe(true);

    expect(trackSpy).toHaveBeenCalledWith("enquiry_submit", {
      propertyId: "3b764267-27b9-4c8d-9fa6-200cc550ad41",
      serviceId: undefined,
      metadata: {
        interestType: "Property Enquiry",
        location: "property_enquiry",
        formType: "property_enquiry_modal",
      },
    });

    // Verify zero PII in analytics metadata
    const calledMetadata = trackSpy.mock.calls[0][1]?.metadata;
    expect(calledMetadata).not.toHaveProperty("name");
    expect(calledMetadata).not.toHaveProperty("email");
    expect(calledMetadata).not.toHaveProperty("phone");
    expect(calledMetadata).not.toHaveProperty("whatsapp");
    expect(calledMetadata).not.toHaveProperty("message");

    vi.restoreAllMocks();
  });

  it("tracks enquiry_submit with serviceId for renovation quotes and site inspections", async () => {
    vi.spyOn(supabaseModule, "isSupabaseConfigured").mockReturnValue(true);
    vi.spyOn(supabaseModule.supabase, "from").mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    } as any);

    const trackSpy = vi.spyOn(analyticsModule, "trackEvent").mockResolvedValue({
      success: true,
    });

    const payload = {
      name: "Emeka Okonkwo",
      phone: "09012345678",
      whatsapp: "09012345678",
      email: "emeka@example.com",
      interestType: "Renovation Quote" as const,
      serviceId: "5c864267-27b9-4c8d-9fa6-200cc550ad42",
      service: "Kitchen Transformation",
      message: "Full kitchen remodeling.",
      source: "Service Page" as const,
      page: "/services/kitchen-transformation",
    };

    const result = await submitLead(payload);
    expect(result.success).toBe(true);

    expect(trackSpy).toHaveBeenCalledWith("enquiry_submit", {
      propertyId: undefined,
      serviceId: "5c864267-27b9-4c8d-9fa6-200cc550ad42",
      metadata: {
        interestType: "Renovation Quote",
        location: "renovation_quote",
      },
    });

    vi.restoreAllMocks();
  });

  it("does NOT track enquiry_submit if validation fails", async () => {
    const trackSpy = vi.spyOn(analyticsModule, "trackEvent").mockResolvedValue({
      success: true,
    });

    const invalidPayload = {
      name: "",
      phone: "080",
      whatsapp: "",
      email: "invalid-email",
      interestType: "Property Enquiry" as const,
      message: "",
      source: "Direct" as const,
      page: "",
    };

    const result = await submitLead(invalidPayload);
    expect(result.success).toBe(false);
    expect(trackSpy).not.toHaveBeenCalled();

    trackSpy.mockRestore();
  });

  it("does NOT track enquiry_submit if database insertion fails", async () => {
    vi.spyOn(supabaseModule, "isSupabaseConfigured").mockReturnValue(true);
    vi.spyOn(supabaseModule.supabase, "from").mockReturnValue({
      insert: vi.fn().mockResolvedValue({
        error: { message: "Database connection failed" },
      }),
    } as any);

    const trackSpy = vi.spyOn(analyticsModule, "trackEvent").mockResolvedValue({
      success: true,
    });

    const payload = {
      name: "Ngozi Eze",
      phone: "08099998888",
      whatsapp: "",
      email: "ngozi@example.com",
      interestType: "Viewing Request" as const,
      propertyId: "prop-123",
      message: "Please view on Monday.",
      source: "Direct" as const,
      page: "/properties/view",
    };

    const result = await submitLead(payload);
    expect(result.success).toBe(false);
    expect(trackSpy).not.toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  it("preserves lead submission success even if analytics tracking fails", async () => {
    vi.spyOn(supabaseModule, "isSupabaseConfigured").mockReturnValue(false);
    const trackSpy = vi
      .spyOn(analyticsModule, "trackEvent")
      .mockRejectedValue(new Error("Network offline"));

    const payload = {
      name: "Bala Mohammed",
      phone: "08055554444",
      whatsapp: "",
      email: "bala@example.com",
      interestType: "Building Project" as const,
      message: "Building from foundation.",
      source: "Direct" as const,
      page: "/start-building-project",
    };

    const result = await submitLead(payload);
    expect(result.success).toBe(true);
    expect(result.leadId).toBeDefined();

    trackSpy.mockRestore();
  });
});
