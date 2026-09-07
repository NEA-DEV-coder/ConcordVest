/* CONCORDVEST / Quiet Structure: lead data stays compact, contextual, and ready for a future CRM without changing the current front-end experience. */

export type LeadStatus =
  | "New"
  | "Contacted"
  | "Qualified"
  | "Appointment"
  | "Converted"
  | "Closed"
  | "Archived";

export type LeadInterestType =
  | "Property Enquiry"
  | "Viewing Request"
  | "Renovation Quote"
  | "Site Inspection"
  | "Agent Conversation"
  | "Building Project";

export type LeadSource =
  | "Instagram"
  | "Facebook"
  | "Google"
  | "Direct"
  | "Property Page"
  | "Service Page"
  | "Inspiration"
  | "Projects"
  | "Unknown";

export interface LeadPayload {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  interestType: LeadInterestType;
  propertyId?: string; // UUID from database
  serviceId?: string; // UUID from database
  property?: string; // Display name
  service?: string; // Display name
  message: string;
  source: LeadSource;
  page: string;
  date: string;
  status: LeadStatus;
  notes?: string;
  assignedTo?: string; // Profile UUID
  preferredDate?: string;
  preferredTime?: string;
  isRead: boolean;
}

export interface LeadContext {
  page: string;
  source: LeadSource;
  propertyId?: string;
  propertyName?: string;
  propertyUrl?: string;
  serviceId?: string;
  serviceName?: string;
}

const configuredWhatsAppNumber = import.meta.env
  .VITE_CONCORDVEST_WHATSAPP_NUMBER as string | undefined;
export const CONCORDVEST_WHATSAPP_NUMBER =
  configuredWhatsAppNumber?.replace(/\D/g, "") || "";

export function getLeadContext(
  overrides: Partial<LeadContext> = {}
): LeadContext {
  const params = new URLSearchParams(window.location.search);
  const sourceParam = params.get("source")?.toLowerCase();
  const sourceMap: Record<string, LeadSource> = {
    instagram: "Instagram",
    facebook: "Facebook",
    google: "Google",
    direct: "Direct",
    property: "Property Page",
    service: "Service Page",
    inspiration: "Inspiration",
    projects: "Projects",
  };
  const referrer = document.referrer.toLowerCase();
  const inferredSource =
    sourceMap[sourceParam || ""] ||
    (referrer.includes("instagram")
      ? "Instagram"
      : referrer.includes("facebook")
        ? "Facebook"
        : referrer.includes("google")
          ? "Google"
          : "Direct");

  return {
    page: window.location.href,
    source: inferredSource || "Unknown",
    ...overrides,
  };
}

// Generate a temporary ID for fallback/demo only
export function createLeadId(): string {
  return `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Create a lead with proper fields
export function createLead(
  payload: Omit<LeadPayload, "id" | "date" | "status" | "isRead">
): LeadPayload {
  return {
    ...payload,
    id: createLeadId(),
    date: new Date().toISOString(),
    status: "New",
    isRead: false,
  };
}

export function buildWhatsAppUrl(message: string) {
  const base = CONCORDVEST_WHATSAPP_NUMBER
    ? `https://wa.me/${CONCORDVEST_WHATSAPP_NUMBER}`
    : "https://api.whatsapp.com/send";
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function buildPropertyWhatsAppMessage(propertyName: string) {
  return `Hello Concordvest, I'm interested in ${propertyName}. I found it through your website and would like more information.`;
}

export function buildViewingWhatsAppMessage(
  propertyName: string,
  date: string,
  time: string
) {
  return `Hello Concordvest, I would like to request a viewing for ${propertyName}. My preferred time is ${date} at ${time}. I found it through your website.`;
}

export function recordLead(lead: LeadPayload) {
  try {
    const existing = JSON.parse(
      window.localStorage.getItem("concordvest-leads") || "[]"
    ) as LeadPayload[];
    window.localStorage.setItem(
      "concordvest-leads",
      JSON.stringify([...existing, lead])
    );
  } catch {
    // Fail silently in private/incognito modes
  }
}

export function buildLeadWhatsAppMessage(
  lead: Pick<
    LeadPayload,
    | "interestType"
    | "name"
    | "phone"
    | "whatsapp"
    | "email"
    | "property"
    | "service"
    | "message"
    | "preferredDate"
    | "preferredTime"
  >
) {
  const context = [
    lead.property && `Property: ${lead.property}`,
    lead.service && `Service: ${lead.service}`,
    lead.preferredDate && `Date: ${lead.preferredDate}`,
    lead.preferredTime && `Time: ${lead.preferredTime}`,
  ]
    .filter(Boolean)
    .join("\n");

  return [
    `Hello Concordvest, I would like help with a ${lead.interestType.toLowerCase()}.`,
    `Name: ${lead.name}`,
    `Phone: ${lead.phone}`,
    `WhatsApp: ${lead.whatsapp}`,
    `Email: ${lead.email}`,
    context,
    `Message: ${lead.message}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildBuildingProjectWhatsAppMessage(params: {
  name: string;
  buildingType: string;
  landStatus: string;
  stage: string;
  budget: string;
}) {
  return [
    "Hello Concordvest, I just submitted a Building Project assessment.",
    "",
    `Name: ${params.name}`,
    `Project: ${params.buildingType}`,
    `Land: ${params.landStatus}`,
    `Stage: ${params.stage}`,
    `Budget: ${params.budget || "To discuss"}`,
    "",
    "I would like to speak with an agent about next steps.",
  ].join("\n");
}
