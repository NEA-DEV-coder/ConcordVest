/**
 * ConcordVest Admin Dashboard
 * 
 * A comprehensive admin dashboard with real Supabase authentication.
 * Falls back to demo mode when Supabase is not configured.
 */

import { useState } from "react";
import { ArrowUpRight, BarChart3, Building2, Check, Copy, Edit3, ExternalLink, FileText, Filter, FolderKanban, Image, Loader2, MoreHorizontal, Plus, Search, Sparkles, Trash2, Users, X } from "lucide-react";
import { useLocation } from "wouter";
import { AdminShell } from "@/components/AdminShell";
import { useAuth, AuthProvider, canAccessAdmin } from "@/contexts/AuthContext";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAdminProperties } from "@/hooks/useProperties";
import { useAdminLeads, useDashboardStats } from "@/hooks/useLeads";
import { useProjects, useServices, useArticles } from "@/hooks/useContent";
import { demoProperties, type PropertyRecord, formatNaira } from "@/lib/properties";
import { servicePackages, type ServicePackage } from "@/lib/services";
import { projects, articles, type ProjectRecord, type ArticleRecord } from "@/lib/content";
import { adminLeads, adminActivities, staffMembers, contentStats } from "@/lib/admin";

const navy = "#012770";
const orange = "#ED7D01";
const muted = "#637085";

// Main Admin component wrapped with AuthProvider
export default function Admin() {
  return (
    <AuthProvider>
      <AdminContent />
    </AuthProvider>
  );
}

// Admin content that requires authentication
function AdminContent() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isLoading, isAdmin, signOut, profile } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f1ea]">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#ED7D01]" />
          <p className="mt-4 text-[0.75rem] text-[#637085]">Loading admin workspace...</p>
        </div>
      </div>
    );
  }

  // Check if user can access admin (staff, editor, or admin role)
  if (!isAuthenticated || !canAccessAdmin(profile?.role || null)) {
    return <AdminLogin />;
  }

  return (
    <AdminShell
      path={location}
      onNavigate={setLocation}
      onSignOut={signOut}
      userName={profile?.full_name}
      userRole={profile?.role}
    >
      <AdminRouter path={location} onNavigate={setLocation} />
    </AdminShell>
  );
}

// Router for admin sections
function AdminRouter({ path, onNavigate }: { path: string; onNavigate: (path: string) => void }) {
  if (path === "/admin" || path === "/admin/") return <Dashboard onNavigate={onNavigate} />;
  if (path.startsWith("/admin/properties")) return <PropertiesSection />;
  if (path.startsWith("/admin/projects")) return <ProjectsSection />;
  if (path.startsWith("/admin/services")) return <ServicesSection />;
  if (path.startsWith("/admin/leads")) return <LeadsSection />;
  if (path.startsWith("/admin/content")) return <ContentSection />;
  if (path.startsWith("/admin/media")) return <MediaSection />;
  if (path.startsWith("/admin/staff")) return <StaffSection />;
  return <Dashboard onNavigate={onNavigate} />;
}

// ============================================================================
// DASHBOARD
// ============================================================================

function Dashboard({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { stats, isLoading } = useDashboardStats();
  const { leads } = useAdminLeads();

  const displayStats = [
    { label: "Total Properties", value: stats.totalProperties, detail: "Across all listing sources", icon: Building2 },
    { label: "Available Properties", value: stats.availableProperties, detail: "Ready for enquiry", icon: Check },
    { label: "Reserved / Sold", value: stats.reservedSold, detail: "Requires follow-up", icon: BarChart3 },
    { label: "New Leads", value: stats.newLeads, detail: `${stats.totalLeads} total captured`, icon: Users },
    { label: "Renovation Enquiries", value: stats.renovationEnquiries, detail: "Quote-led requests", icon: Sparkles },
    { label: "Site Inspections", value: stats.siteInspections, detail: "Appointments & viewings", icon: ExternalLink },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#ED7D01]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Overview"
        title="Good morning."
        description="A clear view of what is moving across the Concordvest property, renovation, and editorial systems."
        action={
          <button type="button" onClick={() => onNavigate("/admin/properties?new=1")} className="admin-primary">
            <Plus size={15} /> Add property
          </button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {displayStats.map(({ label, value, detail, icon: Icon }) => (
          <div key={label} className="bg-white p-5 shadow-[0_8px_30px_rgba(1,39,112,0.05)]">
            <div className="flex items-start justify-between">
              <div className="text-[0.62rem] font-extrabold uppercase tracking-[0.13em] text-[#637085]">{label}</div>
              <Icon size={17} className="text-[#ED7D01]" />
            </div>
            <div className="mt-5 text-[2.4rem] font-extrabold tracking-[-0.06em] text-[#012770]">{value}</div>
            <div className="mt-2 text-[0.68rem] text-[#637085]">{detail}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="bg-white p-5 sm:p-7">
          <SectionHeader
            eyebrow="Recent leads"
            title="Follow the conversation."
            action={
              <button type="button" onClick={() => onNavigate("/admin/leads")} className="admin-link">
                View all <ArrowUpRight size={13} />
              </button>
            }
          />
          <div className="mt-7 space-y-1">
            {leads.slice(0, 5).map(lead => (
              <LeadRow key={lead.id} lead={lead} />
            ))}
          </div>
        </section>

        <section className="bg-[#012770] p-5 text-white sm:p-7">
          <SectionHeader eyebrow="Recent activity" title="The workspace, in motion." light />
          <div className="mt-7 space-y-5">
            {adminActivities.map(item => (
              <div key={item.id} className="flex gap-3 border-b border-white/12 pb-5 last:border-0">
                <span className={`mt-1 h-2.5 w-2.5 shrink-0 ${item.tone === "orange" ? "bg-[#ED7D01]" : "bg-white/40"}`} />
                <div>
                  <p className="text-[0.75rem] font-bold text-white">{item.title}</p>
                  <p className="mt-1 text-[0.68rem] leading-[1.5] text-white/58">{item.detail}</p>
                  <p className="mt-2 text-[0.58rem] font-extrabold uppercase tracking-[0.12em] text-[#ED7D01]">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="bg-white p-5 sm:p-7">
        <SectionHeader
          eyebrow="Recent properties"
          title="Catalogue at a glance."
          action={
            <button type="button" onClick={() => onNavigate("/admin/properties")} className="admin-link">
              Manage catalogue <ArrowUpRight size={13} />
            </button>
          }
        />
        <div className="mt-7 grid gap-3 md:grid-cols-3">
          {demoProperties.slice(0, 3).map(property => (
            <div key={property.id} className="border border-[#012770]/10 p-4">
              <div className="flex items-center justify-between">
                <span className="admin-kicker">{property.propertyType}</span>
                <span className={`admin-status ${property.availability === "Available" ? "available" : "muted"}`}>{property.availability}</span>
              </div>
              <h3 className="mt-4 text-[0.92rem] font-extrabold text-[#012770]">{property.title}</h3>
              <p className="mt-2 text-[0.68rem] text-[#637085]">{property.location}, {property.area} · {formatNaira(property.price)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ============================================================================
// PROPERTIES SECTION
// ============================================================================

function PropertiesSection() {
  const { properties, isLoading, createProperty, updateProperty, deleteProperty } = useAdminProperties();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<PropertyRecord | null>(null);
  const [toast, setToast] = useState("");

  const filtered = properties.filter(item =>
    `${item.title} ${item.location} ${item.propertyType}`.toLowerCase().includes(query.toLowerCase())
  );

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  const duplicate = (row: PropertyRecord) => {
    const duplicated: PropertyRecord = {
      ...row,
      id: `${row.id}-copy`,
      slug: `${row.slug}-copy`,
      title: `${row.title} (Copy)`,
    };
    createProperty({
      ...duplicated,
      title: duplicated.title,
      slug: duplicated.slug,
    } as any).then(() => notify("Property duplicated"));
  };

  const remove = async (id: string) => {
    if (confirm("Are you sure you want to delete this property?")) {
      const { error } = await deleteProperty(id);
      if (error) {
        notify(`Error: ${error.message}`);
      } else {
        notify("Property removed");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#ED7D01]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Property management"
        title="The property catalogue."
        description="Manage listings, availability, and the information staff need for the next conversation."
        action={
          <button type="button" onClick={() => setEditing(blankProperty)} className="admin-primary">
            <Plus size={15} /> Add property
          </button>
        }
      />

      <Toolbar query={query} setQuery={setQuery} label={`${filtered.length} listings`} />

      <div className="overflow-hidden bg-white shadow-[0_8px_30px_rgba(1,39,112,0.05)]">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Location</th>
                <th>Type</th>
                <th>Price</th>
                <th>Availability</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <img src={row.images[0]} alt="" className="h-10 w-12 object-cover" />
                      <div>
                        <div className="font-extrabold text-[#012770]">{row.title}</div>
                        <div className="mt-1 text-[0.62rem] text-[#637085]">{row.listingType}</div>
                      </div>
                    </div>
                  </td>
                  <td>{row.location}, {row.area}</td>
                  <td>{row.propertyType}</td>
                  <td>{formatNaira(row.price)}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => updateProperty(row.id, { availability: row.availability === "Available" ? "reserved" : "available" })}
                      className={`admin-status ${row.availability === "Available" ? "available" : "muted"}`}
                    >
                      {row.availability}
                    </button>
                  </td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <IconButton label="Edit" onClick={() => setEditing(row)}><Edit3 size={14} /></IconButton>
                      <IconButton label="Duplicate" onClick={() => duplicate(row)}><Copy size={14} /></IconButton>
                      <IconButton label="Delete" onClick={() => remove(row.id)}><Trash2 size={14} /></IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <EmptyState label="No properties match this search." />}
      </div>

      {toast && <Toast text={toast} />}

      {editing && (
        <PropertyEditor
          property={editing}
          onClose={() => setEditing(null)}
          onSave={async (property) => {
            const { error } = await (properties.some(p => p.id === property.id)
              ? updateProperty(property.id, property as any)
              : createProperty(property as any));
            if (error) {
              notify(`Error: ${error.message}`);
            } else {
              setEditing(null);
              notify("Property saved");
            }
          }}
        />
      )}
    </div>
  );
}

const blankProperty: PropertyRecord = {
  id: `cv-${Date.now()}`,
  title: "",
  slug: "",
  category: "All Properties",
  listingType: "Concordvest Property",
  propertyType: "Apartment",
  location: "",
  area: "Abuja",
  price: 0,
  bedrooms: 0,
  bathrooms: 0,
  landSize: 0,
  buildingSize: 0,
  description: "",
  features: [],
  amenities: [],
  documentation: [],
  availability: "Available",
  images: [],
  video: "",
  coordinates: { lat: 9.07, lng: 7.43 },
  tags: [],
};

function PropertyEditor({ property, onClose, onSave }: { property: PropertyRecord; onClose: () => void; onSave: (property: PropertyRecord) => void }) {
  const [form, setForm] = useState(property);
  const update = (key: keyof PropertyRecord, value: string | number | string[]) => setForm(current => ({ ...current, [key]: value } as PropertyRecord));

  return (
    <Modal title={property.title ? "Edit property" : "Add property"} onClose={onClose}>
      <form onSubmit={event => { event.preventDefault(); onSave(form); }} className="grid gap-5 sm:grid-cols-2">
        <AdminField label="Title" value={form.title} onChange={value => update("title", value)} required />
        <AdminField label="Slug" value={form.slug} onChange={value => update("slug", value)} required />
        <AdminField label="Price" type="number" value={String(form.price)} onChange={value => update("price", Number(value))} required />
        <AdminField label="Location" value={form.location} onChange={value => update("location", value)} required />
        <AdminField label="Area" value={form.area} onChange={value => update("area", value)} />
        <AdminField label="Property type" value={form.propertyType} onChange={value => update("propertyType", value)} />
        <AdminField label="Listing type" value={form.listingType} onChange={value => update("listingType", value)} />
        <AdminField label="Bedrooms" type="number" value={String(form.bedrooms)} onChange={value => update("bedrooms", Number(value))} />
        <AdminField label="Bathrooms" type="number" value={String(form.bathrooms)} onChange={value => update("bathrooms", Number(value))} />
        <AdminField label="Land size (sqm)" type="number" value={String(form.landSize)} onChange={value => update("landSize", Number(value))} />
        <AdminField label="Building size (sqm)" type="number" value={String(form.buildingSize)} onChange={value => update("buildingSize", Number(value))} />
        <AdminField label="Availability" value={form.availability} onChange={value => update("availability", value)} />
        <AdminField label="Features" value={form.features.join(", ")} onChange={value => update("features", value.split(",").map((item: string) => item.trim()).filter(Boolean))} />
        <AdminField label="Amenities" value={form.amenities.join(", ")} onChange={value => update("amenities", value.split(",").map((item: string) => item.trim()).filter(Boolean))} />
        <div className="sm:col-span-2">
          <AdminField label="Documentation" value={form.documentation.join(", ")} onChange={value => update("documentation", value.split(",").map((item: string) => item.trim()).filter(Boolean))} />
          <AdminField label="Description" as="textarea" value={form.description} onChange={value => update("description", value)} />
        </div>
        <div className="sm:col-span-2 flex justify-end gap-3 border-t border-[#012770]/10 pt-5">
          <button type="button" onClick={onClose} className="admin-secondary">Cancel</button>
          <button type="submit" className="admin-primary">Save property</button>
        </div>
      </form>
    </Modal>
  );
}

// ============================================================================
// PROJECTS SECTION
// ============================================================================

function ProjectsSection() {
  const { projects, isLoading } = useProjects();
  const displayProjects = projects.length > 0 ? projects : projects;

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <ContentManager
      title="Projects"
      eyebrow="Project portfolio"
      icon={<FolderKanban size={18} />}
      count={displayProjects.length}
      rows={displayProjects.map(item => ({
        id: item.id,
        title: item.title,
        meta: `${item.location} · ${item.type}`,
        status: "Published",
      }))}
    />
  );
}

// ============================================================================
// SERVICES SECTION
// ============================================================================

function ServicesSection() {
  const { services, isLoading } = useServices();

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <ContentManager
      title="Services"
      eyebrow="Renovation & finishing"
      icon={<Sparkles size={18} />}
      count={services.length}
      rows={services.map(item => ({
        id: item.id,
        title: item.name,
        meta: `${item.timeline} · Quote-led`,
        status: "Published",
      }))}
      service
    />
  );
}

// ============================================================================
// LEADS SECTION
// ============================================================================

function LeadsSection() {
  const { leads, isLoading, updateLeadStatus } = useAdminLeads();
  const [status, setStatus] = useState<string>("All");

  const filtered = status === "All" ? leads : leads.filter(row => row.status === status);

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Lead management"
        title="The next conversations."
        description="Review enquiries, keep status current, and move the right people toward a useful next step."
      />

      <div className="flex flex-wrap gap-2">
        {["All", "New", "Contacted", "Qualified", "Appointment", "Converted", "Closed"].map(item => (
          <button
            type="button"
            key={item}
            onClick={() => setStatus(item)}
            className={`admin-filter ${status === item ? "active" : ""}`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="overflow-hidden bg-white shadow-[0_8px_30px_rgba(1,39,112,0.05)]">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Interest</th>
                <th>Property / Service</th>
                <th>Source</th>
                <th>Date</th>
                <th>Status</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.id}>
                  <td className="font-extrabold text-[#012770]">{row.name}</td>
                  <td>{row.interestType}</td>
                  <td>{row.property || row.service || "—"}</td>
                  <td>{row.source}</td>
                  <td>{new Date(row.date).toLocaleDateString()}</td>
                  <td>
                    <select
                      value={row.status}
                      onChange={event => updateLeadStatus(row.id, event.target.value.toLowerCase() as any)}
                      className="admin-select"
                    >
                      <option>New</option>
                      <option>Contacted</option>
                      <option>Qualified</option>
                      <option>Appointment</option>
                      <option>Converted</option>
                      <option>Closed</option>
                    </select>
                  </td>
                  <td>
                    <a href={`https://wa.me/${row.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="admin-link">
                      {row.phone} <ArrowUpRight size={12} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CONTENT SECTION
// ============================================================================

function ContentSection() {
  const { articles, isLoading } = useArticles();

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <ContentManager
      title="Content"
      eyebrow="Editorial system"
      icon={<FileText size={18} />}
      count={articles.length}
      rows={articles.map(item => ({
        id: item.id,
        title: item.title,
        meta: `${item.category} · ${item.date}`,
        status: "Published",
      }))}
    />
  );
}

// ============================================================================
// MEDIA SECTION
// ============================================================================

function MediaSection() {
  const assets = demoProperties.flatMap(item =>
    item.images.map((src, index) => ({
      src,
      name: `${item.slug}-${index + 1}.jpg`,
      type: "Property image",
    }))
  ).slice(0, 12);

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Media library"
        title="The visual archive."
        description="A lightweight library for reviewing the imagery used across properties, services, projects, and inspiration."
        action={<button type="button" className="admin-primary"><Plus size={15} /> Add media</button>}
      />
      <div className="flex items-center justify-between bg-white p-4">
        <div className="flex items-center gap-2 text-[0.7rem] font-bold text-[#637085]">
          <Image size={15} className="text-[#ED7D01]" /> {contentStats.media} assets
        </div>
        <button type="button" className="admin-secondary">Filter library <Filter size={14} /></button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {assets.map(asset => (
          <div key={asset.name} className="group bg-white">
            <div className="aspect-[4/3] overflow-hidden">
              <img src={asset.src} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
            <div className="p-4">
              <p className="truncate text-[0.68rem] font-extrabold text-[#012770]">{asset.name}</p>
              <p className="mt-1 text-[0.6rem] text-[#637085]">{asset.type}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// STAFF SECTION
// ============================================================================

function StaffSection() {
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Staff access"
        title="The people behind the work."
        description="Manage staff roles and access. Admin and Editor roles have full access to content management."
        action={<button type="button" className="admin-primary"><Plus size={15} /> Invite staff</button>}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {staffMembers.map(staff => (
          <div key={staff.id} className="bg-white p-5">
            <div className="flex items-start justify-between">
              <span className="grid h-10 w-10 place-items-center bg-[#012770] text-[0.65rem] font-extrabold text-white">
                {staff.name.split(" ").map(part => part[0]).join("")}
              </span>
              <span className={`admin-status ${staff.status === "Active" ? "available" : "muted"}`}>{staff.status}</span>
            </div>
            <h3 className="mt-5 text-[0.9rem] font-extrabold text-[#012770]">{staff.name}</h3>
            <p className="mt-1 text-[0.67rem] text-[#637085]">{staff.email}</p>
            <div className="mt-5 border-t border-[#012770]/10 pt-4 text-[0.61rem] font-extrabold uppercase tracking-[0.12em] text-[#ED7D01]">{staff.role}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// SHARED COMPONENTS
// ============================================================================

function ContentManager({ title, eyebrow, icon, count, rows, service = false }: {
  title: string;
  eyebrow: string;
  icon: React.ReactNode;
  count: number;
  rows: { id: string; title: string; meta: string; status: string }[];
  service?: boolean;
}) {
  const [items, setItems] = useState(rows);
  const [query, setQuery] = useState("");

  const filtered = items.filter(item =>
    `${item.title} ${item.meta}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow={eyebrow}
        title={`${title}.`}
        description={service ? "Edit the seven quote-led packages without publishing fixed prices." : `Manage ${title.toLowerCase()} in the workspace.`}
        action={
          <button type="button" onClick={() => setItems(current => [{ id: `new-${Date.now()}`, title: `New ${title === "Content" ? "article" : title.slice(0, -1).toLowerCase()}`, meta: "Draft · Local only", status: "Draft" }, ...current])} className="admin-primary">
            <Plus size={15} /> Add {title === "Content" ? "content" : title.slice(0, -1).toLowerCase()}
          </button>
        }
      />
      <Toolbar query={query} setQuery={setQuery} label={`${count} records`} />
      <div className="overflow-hidden bg-white">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{title === "Content" ? "Title" : `${title.slice(0, -1)} name`}</th>
              <th>Details</th>
              <th>Status</th>
              <th><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center bg-[#f4f1ea] text-[#ED7D01]">{icon}</span>
                    <span className="font-extrabold text-[#012770]">{item.title}</span>
                  </div>
                </td>
                <td>{item.meta}</td>
                <td><span className="admin-status available">{item.status}</span></td>
                <td>
                  <div className="flex justify-end gap-1">
                    <IconButton label="Edit" onClick={() => setItems(current => current.map(row => row.id === item.id ? { ...row, status: row.status === "Draft" ? "Published" : "Edited" } : row))}><Edit3 size={14} /></IconButton>
                    <IconButton label="Delete" onClick={() => setItems(current => current.filter(row => row.id !== item.id))}><Trash2 size={14} /></IconButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminLogin() {
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isSupabaseConfigured()) {
      // Demo mode - show message about configuration
      setError("Supabase is not configured. Please set up VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.");
      return;
    }

    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#012770] px-5 py-12">
      <div className="w-full max-w-md bg-white p-7 shadow-[0_25px_70px_rgba(0,0,0,0.22)] sm:p-10">
        <div className="flex items-center justify-between">
          <div className="text-xl font-extrabold text-[#012770]">ConcordVest</div>
          <span className="border border-[#ED7D01] px-2 py-1 text-[0.54rem] font-extrabold uppercase tracking-[0.14em] text-[#ED7D01]">Staff only</span>
        </div>

        <div className="mt-12">
          <p className="eyebrow">Concordvest admin</p>
          <h1 className="display-serif mt-5 text-[3.5rem] leading-[0.9] text-[#012770]">Sign in to the workspace.</h1>
          <p className="mt-5 text-[0.78rem] leading-[1.7] text-[#637085]">
            {isSupabaseConfigured()
              ? "Enter your credentials to access the admin dashboard."
              : "Configure Supabase to enable real authentication."}
          </p>
        </div>

        {error && (
          <div className="mt-6 border border-red-200 bg-red-50 p-4 text-[0.75rem] text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-9 space-y-5">
          <label className="form-label">
            Email
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="admin@concordvest.com"
              required
            />
          </label>
          <label className="form-label">
            Password
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
          </label>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#ED7D01] px-5 py-4 text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-[#012770] transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Enter workspace ↗"}
          </button>
        </form>

        <p className="mt-6 border-t border-[#012770]/10 pt-5 text-[0.63rem] leading-[1.6] text-[#637085]">
          {isSupabaseConfigured()
            ? "Contact your administrator if you need access."
            : "Set up Supabase environment variables to enable authentication."}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// UI HELPERS
// ============================================================================

function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-6 border-b border-[#012770]/12 pb-7 sm:flex-row sm:items-end">
      <div>
        <p className="admin-eyebrow">{eyebrow}</p>
        <h1 className="mt-3 text-[2.5rem] font-extrabold tracking-[-0.06em] text-[#012770] sm:text-[3.6rem]">{title}</h1>
        <p className="mt-3 max-w-2xl text-[0.78rem] leading-[1.7] text-[#637085]">{description}</p>
      </div>
      {action}
    </div>
  );
}

function SectionHeader({ eyebrow, title, action, light = false }: { eyebrow: string; title: string; action?: React.ReactNode; light?: boolean }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className={`admin-eyebrow ${light ? "text-[#ED7D01]" : ""}`}>{eyebrow}</p>
        <h2 className={`mt-2 text-[1.5rem] font-extrabold tracking-[-0.04em] ${light ? "text-white" : "text-[#012770]"}`}>{title}</h2>
      </div>
      {action}
    </div>
  );
}

function Toolbar({ query, setQuery, label }: { query: string; setQuery: (value: string) => void; label: string }) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <label className="flex max-w-sm items-center gap-3 border border-[#012770]/12 bg-white px-4 py-3">
        <Search size={15} className="text-[#637085]" />
        <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search the workspace" className="w-full bg-transparent text-[0.72rem] outline-none placeholder:text-[#637085]/60" />
      </label>
      <span className="text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-[#637085]">{label}</span>
    </div>
  );
}

function LeadRow({ lead }: { lead: { id: string; name: string; interestType: string; property?: string; service?: string; status: string; date: string } }) {
  return (
    <div className="flex flex-col justify-between gap-3 border-b border-[#012770]/10 py-4 last:border-0 sm:flex-row sm:items-center">
      <div>
        <p className="text-[0.76rem] font-extrabold text-[#012770]">{lead.name}</p>
        <p className="mt-1 text-[0.66rem] text-[#637085]">{lead.interestType} · {lead.property || lead.service || "General enquiry"}</p>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[0.61rem] text-[#637085]">{new Date(lead.date).toLocaleDateString()}</span>
        <span className={`admin-status ${lead.status === "New" ? "new" : lead.status === "Converted" ? "available" : "muted"}`}>{lead.status}</span>
      </div>
    </div>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="grid h-8 w-8 place-items-center border border-[#012770]/12 text-[#637085] hover:border-[#ED7D01] hover:text-[#012770]">
      {children}
    </button>
  );
}

function AdminField({ label, value, onChange, type = "text", required, as = "textarea" }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; as?: "input" | "textarea" }) {
  return (
    <label className="form-label">
      {label}
      {as === "textarea" ? (
        <textarea required={required} value={value} onChange={event => onChange(event.target.value)} className="form-input min-h-24 resize-y" />
      ) : (
        <input required={required} type={type} value={value} onChange={event => onChange(event.target.value)} className="form-input" />
      )}
    </label>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#012770]/60 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto bg-white p-6 shadow-[0_25px_80px_rgba(1,39,112,0.25)] sm:p-9">
        <div className="flex items-center justify-between border-b border-[#012770]/12 pb-5">
          <div>
            <p className="admin-eyebrow">Property editor</p>
            <h2 className="mt-2 text-[1.6rem] font-extrabold tracking-[-0.04em] text-[#012770]">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center border border-[#012770]/12 text-[#012770]">
            <X size={16} />
          </button>
        </div>
        <div className="mt-7">{children}</div>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <div className="p-12 text-center text-[0.75rem] text-[#637085]">{label}</div>;
}

function Toast({ text }: { text: string }) {
  return (
    <div className="fixed bottom-6 right-6 z-[90] flex items-center gap-2 bg-[#012770] px-4 py-3 text-[0.68rem] font-bold text-white shadow-xl">
      <Check size={15} className="text-[#ED7D01]" /> {text}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-[#ED7D01]" />
    </div>
  );
}
