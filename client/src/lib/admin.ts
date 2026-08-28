/* CONCORDVEST / Admin Prototype: local-only data contracts keep the staff workspace demonstrable without implying production authentication or persistence. */
import { demoProperties, type PropertyRecord } from "@/lib/properties";
import { servicePackages, type ServicePackage } from "@/lib/services";
import { projects, articles, type ProjectRecord, type ArticleRecord } from "@/lib/content";

export type AdminLeadStatus = "New" | "Contacted" | "Qualified" | "Appointment" | "Converted" | "Closed";
export type AdminLead = { id: string; name: string; interest: string; context: string; source: string; date: string; status: AdminLeadStatus; contact: string };
export type AdminActivity = { id: string; title: string; detail: string; time: string; tone: "orange" | "navy" | "muted" };
export type StaffMember = { id: string; name: string; email: string; role: "Admin" | "Editor" | "Property Manager" | "Content Manager"; status: "Active" | "Invited" };

export const adminLeads: AdminLead[] = [
  { id: "lead-001", name: "Amina Yusuf", interest: "Viewing Request", context: "Modern 3 Bedroom Apartment", source: "Property detail", date: "Today, 10:42", status: "New", contact: "0815 664 8952" },
  { id: "lead-002", name: "Chinedu Okafor", interest: "Renovation Quote", context: "Kitchen Transformation", source: "Service detail", date: "Yesterday, 16:18", status: "Qualified", contact: "0803 102 6671" },
  { id: "lead-003", name: "Fatima Bello", interest: "Property Enquiry", context: "Courtyard House at Guzape", source: "Properties", date: "21 Aug, 09:06", status: "Contacted", contact: "fatima@example.com" },
  { id: "lead-004", name: "Emeka Nwosu", interest: "Site Inspection", context: "Complete Home Remodeling", source: "WhatsApp", date: "20 Aug, 13:31", status: "Appointment", contact: "0903 324 0600" },
  { id: "lead-005", name: "Sarah James", interest: "Renovation Quote", context: "Home Refresh", source: "Inspiration", date: "18 Aug, 11:24", status: "Converted", contact: "sarah@example.com" },
];

export const adminActivities: AdminActivity[] = [
  { id: "activity-001", title: "Viewing request received", detail: "Amina Yusuf · Jabi", time: "12 min ago", tone: "orange" },
  { id: "activity-002", title: "Property availability updated", detail: "Build-Ready Plot at Life Camp · Sold", time: "2 hr ago", tone: "navy" },
  { id: "activity-003", title: "Article draft edited", detail: "Construction Mistakes Homeowners Should Avoid", time: "Yesterday", tone: "muted" },
  { id: "activity-004", title: "Service package reviewed", detail: "Luxury Bathroom Upgrade", time: "Yesterday", tone: "muted" },
];

export const staffMembers: StaffMember[] = [
  { id: "staff-001", name: "Nadia Ibrahim", email: "nadia@concordvest.com", role: "Admin", status: "Active" },
  { id: "staff-002", name: "Tobi Adeyemi", email: "tobi@concordvest.com", role: "Property Manager", status: "Active" },
  { id: "staff-003", name: "Mariam Bello", email: "mariam@concordvest.com", role: "Content Manager", status: "Active" },
  { id: "staff-004", name: "Kelechi Okoro", email: "kelechi@concordvest.com", role: "Editor", status: "Invited" },
];

export const contentStats = { articles: articles.length, projects: projects.length, categories: 6, media: 18 };
export const seedAdminProperties: PropertyRecord[] = demoProperties;
export const seedAdminProjects: ProjectRecord[] = projects;
export const seedAdminServices: ServicePackage[] = servicePackages;
export const seedAdminArticles: ArticleRecord[] = articles;

export function isAdminAuthenticated() {
  if (process.env.NODE_ENV === 'production') return false;
  return typeof window !== "undefined" && window.localStorage.getItem("concordvest-admin-auth") === "demo-authenticated";
}
export function setAdminAuthenticated(value: boolean) {
  if (process.env.NODE_ENV === 'production' || typeof window === "undefined") return;
  if (value) window.localStorage.setItem("concordvest-admin-auth", "demo-authenticated");
  else window.localStorage.removeItem("concordvest-admin-auth");
}
