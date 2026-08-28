/**
 * Tests for ConcordVest Lead conversion and validation utilities
 */

import { describe, it, expect, vi } from "vitest";
import {
  leadPayloadToDb,
  leadDbToPayload,
  submitLead,
} from "../hooks/useLeads";
import { type LeadPayload } from "./leads";
import { type Lead } from "./supabase";

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
