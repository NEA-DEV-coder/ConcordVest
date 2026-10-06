/**
 * ConcordVest Admin Dashboard
 *
 * A comprehensive admin dashboard with real Supabase authentication.
 * Falls back to demo mode when Supabase is not configured.
 */

import { useState, useRef, useEffect } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit3,
  ExternalLink,
  FileText,
  Filter,
  FolderKanban,
  Image as ImageIcon,
  ImagePlus,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  Trash2,
  Upload,
  Users,
  Video,
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import { AdminShell } from "@/components/AdminShell";
import { useAuth, AuthProvider, canAccessAdmin } from "@/contexts/AuthContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { type LeadPayload } from "@/lib/leads";
import { toast } from "sonner";
import { useAdminProperties } from "@/hooks/useProperties";
import { useAdminLeads, useDashboardStats } from "@/hooks/useLeads";
import { useMedia } from "@/hooks/useMedia";
import { useStaff } from "@/hooks/useStaff";
import { useRecentActivity } from "@/hooks/useRecentActivity";
import { formatRelativeTime } from "@/lib/utils";
import {
  useProjects,
  useServices,
  useArticles,
  useAdminProjects,
  useAdminServices,
  useAdminArticles,
} from "@/hooks/useContent";
import { uploadProjectImages, deleteProjectImage } from "@/lib/projectStorage";
import { uploadArticleImage, deleteArticleImage } from "@/lib/articleStorage";
import {
  demoProperties,
  type PropertyRecord,
  formatNaira,
} from "@/lib/properties";
import {
  servicePackages,
  type ServicePackage,
  calculateNextServiceNumber,
  calculateNextSortOrder,
} from "@/lib/services";
import {
  projects,
  articles,
  type ProjectRecord,
  type ArticleRecord,
  type ProjectCategory,
  inspirationCategories,
} from "@/lib/content";
import {
  adminLeads,
  adminActivities,
  staffMembers,
  contentStats,
} from "@/lib/admin";
import {
  uploadPropertyImages,
  deletePropertyImage,
  validateImageFile,
  DEFAULT_PROPERTY_IMAGE,
  uploadPropertyVideo,
  deletePropertyVideo,
  validateVideoFile,
  MAX_VIDEO_FILE_SIZE,
} from "@/lib/storage";
import AdminAnalytics from "./AdminAnalytics";

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
  const { unreadCount } = useAdminLeads();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f1ea]">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#ED7D01]" />
          <p className="mt-4 text-[0.75rem] text-[#637085]">
            Loading admin workspace...
          </p>
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
      unreadCount={unreadCount}
    >
      <AdminRouter path={location} onNavigate={setLocation} />
    </AdminShell>
  );
}

// Router for admin sections
function AdminRouter({
  path,
  onNavigate,
}: {
  path: string;
  onNavigate: (path: string) => void;
}) {
  if (path === "/admin" || path === "/admin/")
    return <Dashboard onNavigate={onNavigate} />;
  if (path.startsWith("/admin/analytics")) return <AdminAnalytics />;
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

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning.";
  if (hour < 17) return "Good afternoon.";
  return "Good evening.";
}

function Dashboard({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { stats, isLoading } = useDashboardStats();
  const { leads } = useAdminLeads();
  const {
    activities,
    isLoading: isActivityLoading,
    error: activityError,
  } = useRecentActivity();

  const [greeting, setGreeting] = useState(getGreeting());

  useEffect(() => {
    const interval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const displayStats = [
    {
      label: "Total Properties",
      value: stats.totalProperties,
      detail: "Across all listing sources",
      icon: Building2,
    },
    {
      label: "Available Properties",
      value: stats.availableProperties,
      detail: "Ready for enquiry",
      icon: Check,
    },
    {
      label: "Reserved / Sold",
      value: stats.reservedSold,
      detail: "Requires follow-up",
      icon: BarChart3,
    },
    {
      label: "New Leads",
      value: stats.newLeads,
      detail: `${stats.totalLeads} total captured`,
      icon: Users,
    },
    {
      label: "Renovation Enquiries",
      value: stats.renovationEnquiries,
      detail: "Quote-led requests",
      icon: Sparkles,
    },
    {
      label: "Site Inspections",
      value: stats.siteInspections,
      detail: "Appointments & viewings",
      icon: ExternalLink,
    },
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
        title={greeting}
        description="A clear view of what is moving across the Concordvest property, renovation, and editorial systems."
        action={
          <button
            type="button"
            onClick={() => onNavigate("/admin/properties?new=1")}
            className="admin-primary"
          >
            <Plus size={15} /> Add property
          </button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {displayStats.map(({ label, value, detail, icon: Icon }) => (
          <div
            key={label}
            className="bg-white p-5 shadow-[0_8px_30px_rgba(1,39,112,0.05)]"
          >
            <div className="flex items-start justify-between">
              <div className="text-[0.62rem] font-extrabold uppercase tracking-[0.13em] text-[#637085]">
                {label}
              </div>
              <Icon size={17} className="text-[#ED7D01]" />
            </div>
            <div className="mt-5 text-[2.4rem] font-extrabold tracking-[-0.06em] text-[#012770]">
              {value}
            </div>
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
              <button
                type="button"
                onClick={() => onNavigate("/admin/leads")}
                className="admin-link"
              >
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
          <SectionHeader
            eyebrow="Recent activity"
            title="The workspace, in motion."
            light
          />
          <div className="mt-7">
            {isActivityLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-[#ED7D01]" />
              </div>
            ) : activityError ? (
              <div className="border border-red-500/20 bg-red-500/10 p-4 text-[0.7rem] text-red-200">
                Unable to load recent activity.
              </div>
            ) : activities.length === 0 ? (
              <div className="py-8 text-center text-[0.72rem] text-white/45">
                No recent activity yet.
              </div>
            ) : (
              <div className="space-y-5">
                {activities.map(item => (
                  <div
                    key={item.id}
                    className="flex gap-3 border-b border-white/12 pb-5 last:border-0"
                  >
                    <span
                      className={`mt-1 h-2.5 w-2.5 shrink-0 ${item.tone === "orange" ? "bg-[#ED7D01]" : item.tone === "navy" ? "bg-blue-400" : "bg-white/40"}`}
                    />
                    <div>
                      <p className="text-[0.75rem] font-bold text-white">
                        {item.title}
                      </p>
                      <p className="mt-1 text-[0.68rem] leading-[1.5] text-white/58">
                        {item.detail}
                      </p>
                      <p className="mt-2 text-[0.58rem] font-extrabold uppercase tracking-[0.12em] text-[#ED7D01]">
                        {formatRelativeTime(item.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="bg-white p-5 sm:p-7">
        <SectionHeader
          eyebrow="Recent properties"
          title="Catalogue at a glance."
          action={
            <button
              type="button"
              onClick={() => onNavigate("/admin/properties")}
              className="admin-link"
            >
              Manage catalogue <ArrowUpRight size={13} />
            </button>
          }
        />
        <div className="mt-7 grid gap-3 md:grid-cols-3">
          {demoProperties.slice(0, 3).map(property => (
            <div key={property.id} className="border border-[#012770]/10 p-4">
              <div className="flex items-center justify-between">
                <span className="admin-kicker">{property.propertyType}</span>
                <span
                  className={`admin-status ${property.availability === "Available" ? "available" : "muted"}`}
                >
                  {property.availability}
                </span>
              </div>
              <h3 className="mt-4 text-[0.92rem] font-extrabold text-[#012770]">
                {property.title}
              </h3>
              <p className="mt-2 text-[0.68rem] text-[#637085]">
                {property.location}, {property.area} ·{" "}
                {formatNaira(property.price)}
              </p>
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
  const {
    properties,
    isLoading,
    createProperty,
    updateProperty,
    deleteProperty,
  } = useAdminProperties();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<PropertyRecord | null>(null);
  const [toast, setToast] = useState("");

  const filtered = properties.filter(item =>
    `${item.title} ${item.location} ${item.propertyType}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  const duplicate = (row: PropertyRecord) => {
    // Create a new property without an ID - PostgreSQL will generate a UUID
    const duplicated: Omit<PropertyRecord, "id"> = {
      ...row,
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
          <button
            type="button"
            onClick={() => setEditing(blankProperty)}
            className="admin-primary"
          >
            <Plus size={15} /> Add property
          </button>
        }
      />

      <Toolbar
        query={query}
        setQuery={setQuery}
        label={`${filtered.length} listings`}
      />

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
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <img
                        src={row.images[0] || DEFAULT_PROPERTY_IMAGE}
                        alt=""
                        onError={e => {
                          (e.currentTarget as HTMLImageElement).src =
                            DEFAULT_PROPERTY_IMAGE;
                        }}
                        className="h-10 w-12 object-cover border border-[#012770]/10"
                      />
                      <div>
                        <div className="font-extrabold text-[#012770]">
                          {row.title}
                        </div>
                        <div className="mt-1 text-[0.62rem] text-[#637085]">
                          {row.listingType} · {row.images.length}{" "}
                          {row.images.length === 1 ? "image" : "images"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {row.location}, {row.area}
                  </td>
                  <td>{row.propertyType}</td>
                  <td>{formatNaira(row.price)}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() =>
                        updateProperty(row.id, {
                          availability:
                            row.availability === "Available"
                              ? "reserved"
                              : "available",
                        })
                      }
                      className={`admin-status ${row.availability === "Available" ? "available" : "muted"}`}
                    >
                      {row.availability}
                    </button>
                  </td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <IconButton label="Edit" onClick={() => setEditing(row)}>
                        <Edit3 size={14} />
                      </IconButton>
                      <IconButton
                        label="Duplicate"
                        onClick={() => duplicate(row)}
                      >
                        <Copy size={14} />
                      </IconButton>
                      <IconButton label="Delete" onClick={() => remove(row.id)}>
                        <Trash2 size={14} />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <EmptyState label="No properties match this search." />
        )}
      </div>

      {toast && <Toast text={toast} />}

      {editing && (
        <PropertyEditor
          property={editing}
          onClose={() => setEditing(null)}
          notify={notify}
          createProperty={createProperty}
          updateProperty={updateProperty}
          deleteProperty={deleteProperty}
        />
      )}
    </div>
  );
}

const blankProperty: PropertyRecord = {
  id: "", // Empty for new properties - PostgreSQL generates UUID
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

interface ImageEntry {
  id: string;
  url: string;
  file?: File;
  isNew: boolean;
}

interface VideoEntry {
  url: string;
  file?: File;
  isNew: boolean;
  fileName?: string;
  fileSize?: number;
}

function PropertyEditor({
  property,
  onClose,
  notify,
  createProperty,
  updateProperty,
  deleteProperty,
}: {
  property: PropertyRecord;
  onClose: () => void;
  notify: (msg: string) => void;
  createProperty: (
    prop: PropertyRecord
  ) => Promise<{ data: any; error: Error | null }>;
  updateProperty: (
    id: string,
    updates: any
  ) => Promise<{ error: Error | null }>;
  deleteProperty: (id: string) => Promise<{ error: Error | null }>;
}) {
  const [form, setForm] = useState(property);
  const [imageEntries, setImageEntries] = useState<ImageEntry[]>(() =>
    (property.images || []).map((url, i) => ({
      id: `existing-${i}-${url}`,
      url,
      isNew: false,
    }))
  );
  const [removedUrls, setRemovedUrls] = useState<string[]>([]);
  const [videoEntry, setVideoEntry] = useState<VideoEntry | null>(() => {
    if (property.video && property.video.trim()) {
      return {
        url: property.video.trim(),
        isNew: false,
      };
    }
    return null;
  });
  const [removedVideoUrl, setRemovedVideoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (videoEntry?.isNew && videoEntry.url.startsWith("blob:")) {
        URL.revokeObjectURL(videoEntry.url);
      }
    };
  }, [videoEntry]);

  const update = (
    key: keyof PropertyRecord,
    value: string | number | string[]
  ) => setForm(current => ({ ...current, [key]: value }) as PropertyRecord);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setValidationError(null);

    const validNewEntries: ImageEntry[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        errors.push(validation.error || `Invalid file: ${file.name}`);
      } else {
        const previewUrl = URL.createObjectURL(file);
        validNewEntries.push({
          id: `new-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          url: previewUrl,
          file,
          isNew: true,
        });
      }
    }

    if (errors.length > 0) {
      setValidationError(errors.join(" "));
      notify(errors[0]);
    }

    if (validNewEntries.length > 0) {
      setImageEntries(prev => [...prev, ...validNewEntries]);
    }

    // Reset input so re-selecting the same file works
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleVideoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setValidationError(null);

    const validation = validateVideoFile(file);
    if (!validation.valid) {
      setValidationError(validation.error || "Invalid video file");
      notify(validation.error || "Invalid video file");
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }
      return;
    }

    // Queue existing saved video for cleanup upon successful save
    if (videoEntry && !videoEntry.isNew && videoEntry.url) {
      setRemovedVideoUrl(videoEntry.url);
    } else if (videoEntry?.isNew && videoEntry.url.startsWith("blob:")) {
      URL.revokeObjectURL(videoEntry.url);
    }

    const previewUrl = URL.createObjectURL(file);
    setVideoEntry({
      url: previewUrl,
      file,
      isNew: true,
      fileName: file.name,
      fileSize: file.size,
    });

    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  const handleRemoveVideo = () => {
    if (!videoEntry) return;
    if (videoEntry.isNew && videoEntry.url.startsWith("blob:")) {
      URL.revokeObjectURL(videoEntry.url);
    } else if (!videoEntry.isNew && videoEntry.url) {
      setRemovedVideoUrl(videoEntry.url);
    }
    setVideoEntry(null);
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    const target = imageEntries[index];
    if (target.isNew && target.url.startsWith("blob:")) {
      URL.revokeObjectURL(target.url);
    } else if (!target.isNew) {
      setRemovedUrls(prev => [...prev, target.url]);
    }
    setImageEntries(prev => prev.filter((_, i) => i !== index));
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    setImageEntries(prev => {
      const target = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      return [target, ...rest];
    });
  };

  const handleMoveLeft = (index: number) => {
    if (index === 0) return;
    setImageEntries(prev => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleMoveRight = (index: number) => {
    if (index >= imageEntries.length - 1) return;
    setImageEntries(prev => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setValidationError(null);

    // Track state for rollback of newly created resources during THIS save attempt
    let newlyCreatedPropertyId: string | null = null;
    const newlyUploadedImageUrls: string[] = [];
    let newlyUploadedVideoUrl: string | null = null;

    try {
      const isNewProperty = !property.id;
      let targetPropertyId = property.id;

      if (isNewProperty) {
        setUploadStatus("Creating property record...");
        // 1. Create property in PostgreSQL first to obtain real UUID
        const { data: created, error: createError } = await createProperty({
          ...form,
          images: [],
          video: "",
        });

        if (createError || !created) {
          throw new Error(
            createError?.message || "Failed to create property in database"
          );
        }

        targetPropertyId = created.id;
        newlyCreatedPropertyId = created.id; // Marked for rollback if subsequent operations fail
      }

      // 2. Identify new media files to upload
      const newEntries = imageEntries.filter(
        entry => entry.isNew && entry.file
      );
      const newFiles = newEntries.map(entry => entry.file!);
      const hasNewImages = newFiles.length > 0;
      const hasNewVideo = Boolean(videoEntry?.isNew && videoEntry?.file);
      const videoSizeMb = videoEntry?.fileSize
        ? (videoEntry.fileSize / (1024 * 1024)).toFixed(1)
        : null;

      // Report initial upload status
      if (hasNewImages && hasNewVideo) {
        setUploadStatus(
          `Uploading ${newFiles.length} image(s) & video tour (${videoSizeMb} MB)...`
        );
      } else if (hasNewVideo) {
        setUploadStatus(`Uploading video tour (${videoSizeMb} MB)...`);
      } else if (hasNewImages) {
        setUploadStatus(`Uploading ${newFiles.length} image(s)...`);
      } else {
        setUploadStatus("Saving property...");
      }

      // 3. Concurrently upload images and video using Promise.allSettled
      // This ensures all started uploads settle so any successful files can be identified and rolled back on error.
      let videoUploadFinished = false;

      const imagesPromise = hasNewImages
        ? uploadPropertyImages(
            targetPropertyId,
            newFiles,
            (completed, total) => {
              if (hasNewVideo && !videoUploadFinished) {
                if (completed < total) {
                  setUploadStatus(
                    `Uploading image ${completed} of ${total} & video tour...`
                  );
                } else {
                  // All images uploaded; transition message to clearly indicate active video upload
                  setUploadStatus(
                    `Uploading video tour (${videoSizeMb} MB)...`
                  );
                }
              } else {
                setUploadStatus(`Uploading image ${completed} of ${total}...`);
              }
            }
          )
        : Promise.resolve({
            urls: [] as string[],
            paths: [] as string[],
            errors: [] as string[],
          });

      const videoPromise = hasNewVideo
        ? uploadPropertyVideo(targetPropertyId, videoEntry!.file!).then(res => {
            videoUploadFinished = true;
            return res;
          })
        : Promise.resolve({
            url: videoEntry ? videoEntry.url : "",
            path: null as string | null,
            error: null as Error | null,
          });

      const [imagesSettled, videoSettled] = await Promise.allSettled([
        imagesPromise,
        videoPromise,
      ]);

      // Extract results and track newly uploaded files for rollback
      let imagesResult: {
        urls: string[];
        paths: string[];
        errors: string[];
      } | null = null;
      let videoResult: {
        url: string | null;
        path: string | null;
        error: Error | null;
      } | null = null;

      if (imagesSettled.status === "fulfilled") {
        imagesResult = imagesSettled.value;
        if (hasNewImages && imagesResult.urls.length > 0) {
          for (const u of imagesResult.urls) {
            if (u) newlyUploadedImageUrls.push(u);
          }
        }
      }

      if (videoSettled.status === "fulfilled") {
        videoResult = videoSettled.value;
        if (hasNewVideo && videoResult.url) {
          newlyUploadedVideoUrl = videoResult.url;
        }
      }

      // Evaluate upload failures
      if (videoSettled.status === "rejected") {
        const reason = videoSettled.reason;
        throw new Error(
          `Video upload failed: ${reason instanceof Error ? reason.message : "Could not upload video tour"}`
        );
      }
      if (videoResult?.error || (hasNewVideo && !videoResult?.url)) {
        throw new Error(
          `Video upload failed: ${videoResult?.error?.message || "Could not upload video tour"}`
        );
      }

      if (imagesSettled.status === "rejected") {
        const reason = imagesSettled.reason;
        throw new Error(
          `Image upload failed: ${reason instanceof Error ? reason.message : "Could not upload images"}`
        );
      }
      if (hasNewImages && imagesResult && imagesResult.errors.length > 0) {
        throw new Error(`Image upload failed: ${imagesResult.errors[0]}`);
      }

      const uploadedUrls = imagesResult ? imagesResult.urls : [];
      const finalVideoUrl = videoResult
        ? videoResult.url || ""
        : videoEntry?.url || "";

      // 4. Assemble final ordered image URLs
      let uploadIndex = 0;
      const finalImageUrls: string[] = [];

      for (const entry of imageEntries) {
        if (entry.isNew) {
          const uploadedUrl = uploadedUrls[uploadIndex++];
          if (uploadedUrl) {
            finalImageUrls.push(uploadedUrl);
          }
        } else {
          finalImageUrls.push(entry.url);
        }
      }

      // 5. Update the property record with final image URLs and video URL
      setUploadStatus("Finalizing property...");
      const { error: updateError } = await updateProperty(targetPropertyId, {
        ...form,
        images: finalImageUrls,
        video: finalVideoUrl,
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Mark property creation as finalized so it will not be rolled back
      newlyCreatedPropertyId = null;

      setUploadStatus("Property saved successfully");

      // 6. Clean up removed storage media AFTER successful persistence
      for (const removedUrl of removedUrls) {
        deletePropertyImage(removedUrl).catch(cleanupErr => {
          console.error("Failed to delete removed property image:", cleanupErr);
        });
      }

      if (removedVideoUrl && removedVideoUrl !== finalVideoUrl) {
        deletePropertyVideo(removedVideoUrl).catch(cleanupErr => {
          console.error("Failed to delete removed property video:", cleanupErr);
        });
      }

      notify(
        isNewProperty
          ? "Property created successfully"
          : "Property updated successfully"
      );
      onClose();
    } catch (err) {
      const primaryError =
        err instanceof Error
          ? err
          : new Error("An error occurred while saving property");

      // Best-effort rollback of newly uploaded media created during THIS failed save attempt
      if (newlyUploadedImageUrls.length > 0) {
        for (const imgUrl of newlyUploadedImageUrls) {
          deletePropertyImage(imgUrl).catch(cleanupErr => {
            console.error(
              "Rollback error deleting newly uploaded image:",
              cleanupErr
            );
          });
        }
      }

      if (newlyUploadedVideoUrl) {
        deletePropertyVideo(newlyUploadedVideoUrl).catch(cleanupErr => {
          console.error(
            "Rollback error deleting newly uploaded video:",
            cleanupErr
          );
        });
      }

      // Best-effort rollback of newly created property draft row if THIS save operation created it
      if (newlyCreatedPropertyId) {
        deleteProperty(newlyCreatedPropertyId).catch(cleanupErr => {
          console.error(
            "Rollback error deleting incomplete property row:",
            cleanupErr
          );
        });
      }

      setValidationError(primaryError.message);
      notify(`Error: ${primaryError.message}`);
    } finally {
      setIsSubmitting(false);
      setUploadStatus("");
    }
  };

  return (
    <Modal
      title={property.title ? "Edit property" : "Add property"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-7">
        {validationError && (
          <div className="flex items-start gap-2.5 border border-red-200 bg-red-50 p-3.5 text-[0.72rem] text-red-800">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
            <div>{validationError}</div>
          </div>
        )}

        {/* Basic Property Details */}
        <div className="grid gap-5 sm:grid-cols-2">
          <AdminField
            label="Title"
            value={form.title}
            onChange={value => update("title", value)}
            required
          />
          <AdminField
            label="Slug"
            value={form.slug}
            onChange={value => update("slug", value)}
            required
          />
          <AdminField
            label="Price (₦)"
            type="number"
            value={String(form.price)}
            onChange={value => update("price", Number(value))}
            required
          />
          <AdminField
            label="Location"
            value={form.location}
            onChange={value => update("location", value)}
            required
          />
          <AdminField
            label="Area"
            value={form.area}
            onChange={value => update("area", value)}
          />
          <AdminField
            label="Property type"
            value={form.propertyType}
            onChange={value => update("propertyType", value)}
          />
          <AdminField
            label="Listing type"
            value={form.listingType}
            onChange={value => update("listingType", value)}
          />
          <AdminField
            label="Availability"
            value={form.availability}
            onChange={value => update("availability", value)}
          />
          <AdminField
            label="Bedrooms"
            type="number"
            value={String(form.bedrooms)}
            onChange={value => update("bedrooms", Number(value))}
          />
          <AdminField
            label="Bathrooms"
            type="number"
            value={String(form.bathrooms)}
            onChange={value => update("bathrooms", Number(value))}
          />
          <AdminField
            label="Land size (sqm)"
            type="number"
            value={String(form.landSize)}
            onChange={value => update("landSize", Number(value))}
          />
          <AdminField
            label="Building size (sqm)"
            type="number"
            value={String(form.buildingSize)}
            onChange={value => update("buildingSize", Number(value))}
          />
          <AdminField
            label="Features (comma separated)"
            value={form.features.join(", ")}
            onChange={value =>
              update(
                "features",
                value
                  .split(",")
                  .map((item: string) => item.trim())
                  .filter(Boolean)
              )
            }
          />
          <AdminField
            label="Amenities (comma separated)"
            value={form.amenities.join(", ")}
            onChange={value =>
              update(
                "amenities",
                value
                  .split(",")
                  .map((item: string) => item.trim())
                  .filter(Boolean)
              )
            }
          />
          <div className="sm:col-span-2">
            <AdminField
              label="Documentation (comma separated)"
              value={form.documentation.join(", ")}
              onChange={value =>
                update(
                  "documentation",
                  value
                    .split(",")
                    .map((item: string) => item.trim())
                    .filter(Boolean)
                )
              }
            />
            <AdminField
              label="Description"
              as="textarea"
              value={form.description}
              onChange={value => update("description", value)}
            />
          </div>
        </div>

        {/* Property Image Management Section */}
        <div className="border-t border-[#012770]/10 pt-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-[0.88rem] font-extrabold uppercase tracking-[0.08em] text-[#012770]">
                Property Images ({imageEntries.length})
              </h3>
              <p className="mt-1 text-[0.66rem] text-[#637085]">
                Upload JPG, PNG, or WebP (max 5 MB each). The first image serves
                as the primary cover photo.
              </p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFilesSelected}
                className="hidden"
                id="property-image-picker"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 border border-[#012770] bg-[#012770] px-4 py-2.5 text-[0.62rem] font-extrabold uppercase tracking-[0.1em] text-white transition-colors hover:border-[#ED7D01] hover:bg-[#ED7D01] hover:text-[#012770] disabled:opacity-50"
              >
                <ImagePlus size={14} /> Add Images
              </button>
            </div>
          </div>

          {/* Image Previews Grid */}
          {imageEntries.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {imageEntries.map((entry, index) => {
                const isPrimary = index === 0;
                return (
                  <div
                    key={entry.id}
                    className={`group relative overflow-hidden border bg-[#f4f1ea] transition-all ${
                      isPrimary
                        ? "border-2 border-[#ED7D01] shadow-md"
                        : "border-[#012770]/15"
                    }`}
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden">
                      <img
                        src={entry.url}
                        alt={`Property image ${index + 1}`}
                        onError={e => {
                          (e.currentTarget as HTMLImageElement).src =
                            DEFAULT_PROPERTY_IMAGE;
                        }}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    </div>

                    {/* Primary Badge */}
                    <div className="absolute left-2 top-2">
                      {isPrimary ? (
                        <span className="inline-flex items-center gap-1 bg-[#ED7D01] px-2 py-1 text-[0.52rem] font-extrabold uppercase tracking-[0.1em] text-[#012770]">
                          <Star size={10} fill="currentColor" /> Primary
                        </span>
                      ) : (
                        <span className="bg-[#012770]/80 px-1.5 py-0.5 text-[0.5rem] font-bold text-white">
                          #{index + 1}
                        </span>
                      )}
                    </div>

                    {/* New Upload Indicator */}
                    {entry.isNew && (
                      <span className="absolute right-2 top-2 bg-blue-600 px-1.5 py-0.5 text-[0.48rem] font-bold uppercase tracking-[0.08em] text-white">
                        New
                      </span>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center justify-between border-t border-[#012770]/10 bg-white/95 p-1.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          title="Move left"
                          disabled={index === 0 || isSubmitting}
                          onClick={() => handleMoveLeft(index)}
                          className="grid h-6 w-6 place-items-center border border-[#012770]/15 text-[#012770] hover:border-[#ED7D01] hover:text-[#ED7D01] disabled:opacity-30"
                        >
                          <ChevronLeft size={12} />
                        </button>
                        <button
                          type="button"
                          title="Move right"
                          disabled={
                            index === imageEntries.length - 1 || isSubmitting
                          }
                          onClick={() => handleMoveRight(index)}
                          className="grid h-6 w-6 place-items-center border border-[#012770]/15 text-[#012770] hover:border-[#ED7D01] hover:text-[#ED7D01] disabled:opacity-30"
                        >
                          <ChevronRight size={12} />
                        </button>
                        {!isPrimary && (
                          <button
                            type="button"
                            title="Set as primary image"
                            disabled={isSubmitting}
                            onClick={() => handleSetPrimary(index)}
                            className="grid h-6 w-6 place-items-center border border-[#012770]/15 text-[#012770] hover:border-[#ED7D01] hover:text-[#ED7D01]"
                          >
                            <Star size={12} />
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        title="Remove image"
                        disabled={isSubmitting}
                        onClick={() => handleRemoveImage(index)}
                        className="grid h-6 w-6 place-items-center border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-30"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 flex cursor-pointer flex-col items-center justify-center border-2 border-dashed border-[#012770]/20 bg-[#f4f1ea]/40 p-8 text-center transition-colors hover:border-[#ED7D01]"
            >
              <Upload size={24} className="text-[#012770]/60" />
              <p className="mt-2 text-[0.74rem] font-bold text-[#012770]">
                No images added yet
              </p>
              <p className="mt-1 text-[0.62rem] text-[#637085]">
                Click here or use the "Add Images" button to select property
                photos.
              </p>
            </div>
          )}
        </div>

        {/* Property Video Tour Section */}
        <div className="border-t border-[#012770]/10 pt-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-[0.88rem] font-extrabold uppercase tracking-[0.08em] text-[#012770]">
                Property Video Tour
              </h3>
              <p className="mt-1 text-[0.66rem] text-[#637085]">
                Upload MP4, WebM, or MOV (maximum 50 MB). Walkthrough video of
                the property.
              </p>
            </div>
            <div>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleVideoSelected}
                className="hidden"
                id="property-video-picker"
                disabled={isSubmitting}
              />
              {!videoEntry && (
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 border border-[#012770] bg-[#012770] px-4 py-2.5 text-[0.62rem] font-extrabold uppercase tracking-[0.1em] text-white transition-colors hover:border-[#ED7D01] hover:bg-[#ED7D01] hover:text-[#012770] disabled:opacity-50"
                >
                  <Video size={14} /> Add Video
                </button>
              )}
            </div>
          </div>

          {/* Video Preview or Dropzone */}
          {videoEntry ? (
            <div className="mt-4 border border-[#012770]/15 bg-[#f4f1ea] p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <div className="relative aspect-video w-full overflow-hidden border border-[#012770]/20 bg-black md:w-80">
                  <video
                    src={videoEntry.url}
                    controls
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-contain"
                  >
                    Your browser does not support video playback.
                  </video>
                  <div className="absolute left-2 top-2">
                    {videoEntry.isNew ? (
                      <span className="bg-blue-600 px-2 py-0.5 text-[0.52rem] font-bold uppercase tracking-[0.08em] text-white">
                        New (Pending Save)
                      </span>
                    ) : (
                      <span className="bg-[#012770] px-2 py-0.5 text-[0.52rem] font-bold uppercase tracking-[0.08em] text-white">
                        Existing Video
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-between py-1">
                  <div>
                    <div className="text-[0.74rem] font-bold text-[#012770]">
                      {videoEntry.fileName || "Property Video Walkthrough"}
                    </div>
                    {videoEntry.fileSize && (
                      <div className="mt-1 text-[0.62rem] text-[#637085]">
                        File size:{" "}
                        {(videoEntry.fileSize / (1024 * 1024)).toFixed(2)} MB
                      </div>
                    )}
                    <div className="mt-2 text-[0.64rem] text-[#637085]">
                      {videoEntry.isNew
                        ? "This video file will be uploaded to Supabase Storage when you save this property."
                        : "Active video tour associated with this property in storage."}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1.5 border border-[#012770]/20 bg-white px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-[#012770] hover:border-[#ED7D01] hover:text-[#ED7D01] disabled:opacity-50"
                    >
                      <RefreshCw size={12} /> Replace Video
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveVideo}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1.5 border border-red-200 bg-white px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 size={12} /> Remove Video
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => videoInputRef.current?.click()}
              className="mt-4 flex cursor-pointer flex-col items-center justify-center border-2 border-dashed border-[#012770]/20 bg-[#f4f1ea]/40 p-8 text-center transition-colors hover:border-[#ED7D01]"
            >
              <Video size={28} className="text-[#012770]/60" />
              <p className="mt-2 text-[0.74rem] font-bold text-[#012770]">
                Property Video Tour
              </p>
              <p className="mt-1 text-[0.62rem] text-[#637085]">
                Upload MP4, WebM, or MOV · Maximum 50 MB
              </p>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  videoInputRef.current?.click();
                }}
                disabled={isSubmitting}
                className="mt-4 inline-flex items-center gap-2 border border-[#012770] bg-[#012770] px-4 py-2 text-[0.62rem] font-extrabold uppercase tracking-[0.1em] text-white transition-colors hover:border-[#ED7D01] hover:bg-[#ED7D01] hover:text-[#012770] disabled:opacity-50"
              >
                <Video size={13} /> Add Video
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-[#012770]/10 pt-5">
          <div className="text-[0.68rem] text-[#637085]">
            {uploadStatus && (
              <span className="inline-flex items-center gap-2 font-semibold text-[#012770]">
                <Loader2 size={13} className="animate-spin text-[#ED7D01]" />
                {uploadStatus}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="admin-secondary disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="admin-primary inline-flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Saving...
                </>
              ) : (
                "Save property"
              )}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// ============================================================================
// PROJECTS SECTION
// ============================================================================

function ProjectsSection() {
  const { projects, isLoading, createProject, updateProject, deleteProject } =
    useAdminProjects();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ProjectRecord | null>(null);

  const filtered = projects.filter(item =>
    `${item.title} ${item.location} ${item.type}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  const notify = (message: string) => {
    toast(message);
  };

  const duplicate = (row: ProjectRecord) => {
    const duplicated: Omit<ProjectRecord, "id"> = {
      ...row,
      slug: `${row.slug}-copy`,
      title: `${row.title} (Copy)`,
      isPublished: false,
    };
    createProject(duplicated as any).then(() => notify("Project duplicated"));
  };

  const remove = async (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      const { error } = await deleteProject(id);
      if (error) {
        notify(`Error: ${error.message}`);
      } else {
        notify("Project removed");
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
        eyebrow="Project management"
        title="The project archive."
        description="Manage case studies, visual narratives, and publishing states for portfolio displays."
        action={
          <button
            type="button"
            onClick={() => setEditing(blankProject)}
            className="admin-primary"
          >
            <Plus size={15} /> Add project
          </button>
        }
      />

      <Toolbar
        query={query}
        setQuery={setQuery}
        label={`${filtered.length} projects`}
      />

      <div className="overflow-hidden bg-white shadow-[0_8px_30px_rgba(1,39,112,0.05)]">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Location</th>
                <th>Type</th>
                <th>Categories</th>
                <th>Status</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <img
                        src={row.heroImage || DEFAULT_PROJECT_IMAGE}
                        alt=""
                        onError={e => {
                          (e.currentTarget as HTMLImageElement).src =
                            DEFAULT_PROJECT_IMAGE;
                        }}
                        className="h-10 w-12 object-cover border border-[#012770]/10"
                      />
                      <div>
                        <div className="font-extrabold text-[#012770]">
                          {row.title}
                        </div>
                        <div className="mt-1 text-[0.62rem] text-[#637085]">
                          {row.slug}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{row.location}</td>
                  <td>{row.type}</td>
                  <td>
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {row.category.map(cat => (
                        <span
                          key={cat}
                          className="bg-[#f4f1ea] px-1.5 py-0.5 text-[0.55rem] text-[#012770]"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() =>
                        updateProject(row.id, {
                          is_published: !row.isPublished,
                        })
                      }
                      className={`admin-status ${row.isPublished ? "available" : "muted"}`}
                    >
                      {row.isPublished ? "Published" : "Draft"}
                    </button>
                  </td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <IconButton label="Edit" onClick={() => setEditing(row)}>
                        <Edit3 size={14} />
                      </IconButton>
                      <IconButton
                        label="Duplicate"
                        onClick={() => duplicate(row)}
                      >
                        <Copy size={14} />
                      </IconButton>
                      <IconButton label="Delete" onClick={() => remove(row.id)}>
                        <Trash2 size={14} />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <EmptyState label="No projects match this search." />
        )}
      </div>

      {editing && (
        <ProjectEditor
          project={editing}
          onClose={() => setEditing(null)}
          notify={notify}
          createProject={createProject}
          updateProject={updateProject}
        />
      )}
    </div>
  );
}

const DEFAULT_PROJECT_IMAGE =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=85";

const blankProject: ProjectRecord = {
  id: "",
  slug: "",
  title: "",
  location: "",
  type: "",
  category: [],
  description: "",
  heroImage: "",
  beforeImages: [],
  duringImages: [],
  afterImages: [],
  services: [],
  serviceSlugs: [],
  materials: [],
  challenges: [],
  outcome: "",
  relatedProjectSlugs: [],
  isFeatured: false,
  isPublished: true,
};

function ProjectGallery({
  title,
  description,
  entries,
  inputId,
  inputRef,
  onFilesSelected,
  onRemove,
  onMoveLeft,
  onMoveRight,
  isSubmitting,
}: {
  title: string;
  description: string;
  entries: ImageEntry[];
  inputId: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFilesSelected: (files: File[]) => void;
  onRemove: (index: number) => void;
  onMoveLeft: (index: number) => void;
  onMoveRight: (index: number) => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="border-t border-[#012770]/10 pt-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-[0.78rem] font-extrabold uppercase tracking-[0.08em] text-[#012770]">
            {title} ({entries.length})
          </h3>
          <p className="mt-1 text-[0.62rem] text-[#637085]">{description}</p>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={e => {
              const files = Array.from(e.target.files || []);
              if (files.length) onFilesSelected(files);
              if (e.target) e.target.value = "";
            }}
            className="hidden"
            id={inputId}
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 border border-[#012770] bg-[#012770] px-4 py-2.5 text-[0.62rem] font-extrabold uppercase tracking-[0.1em] text-white transition-colors hover:border-[#ED7D01] hover:bg-[#ED7D01] hover:text-[#012770] disabled:opacity-50"
          >
            <ImagePlus size={14} /> Add Images
          </button>
        </div>
      </div>

      {entries.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className="group relative overflow-hidden border border-[#012770]/15 bg-[#f4f1ea]"
            >
              <div className="aspect-[4/3] w-full overflow-hidden">
                <img
                  src={entry.url}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-[#012770]/70 opacity-0 transition-opacity group-hover:opacity-100 flex flex-col justify-between p-2">
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="p-1.5 text-white hover:text-red-400 bg-black/30 hover:bg-black/60 rounded"
                    title="Remove Image"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="flex justify-center gap-2 pb-1">
                  <button
                    type="button"
                    onClick={() => onMoveLeft(index)}
                    disabled={index === 0}
                    className="p-1.5 text-white hover:text-[#ED7D01] bg-black/30 hover:bg-black/60 disabled:opacity-30 rounded"
                    title="Move Left"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveRight(index)}
                    disabled={index === entries.length - 1}
                    className="p-1.5 text-white hover:text-[#ED7D01] bg-black/30 hover:bg-black/60 disabled:opacity-30 rounded"
                    title="Move Right"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
              {entry.isNew && (
                <span className="absolute bottom-2 left-2 bg-[#ED7D01] text-[#012770] px-1.5 py-0.5 text-[0.52rem] font-extrabold uppercase tracking-[0.05em]">
                  New
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 border border-dashed border-[#012770]/15 py-8 text-center text-[0.68rem] text-[#637085]">
          No images uploaded in this category.
        </div>
      )}
    </div>
  );
}

function ProjectEditor({
  project,
  onClose,
  notify,
  createProject,
  updateProject,
}: {
  project: ProjectRecord;
  onClose: () => void;
  notify: (msg: string) => void;
  createProject: (
    proj: ProjectRecord
  ) => Promise<{ data: any; error: Error | null }>;
  updateProject: (id: string, updates: any) => Promise<{ error: Error | null }>;
}) {
  const [form, setForm] = useState(project);
  const [heroEntry, setHeroEntry] = useState<ImageEntry | null>(() =>
    project.heroImage
      ? { id: "existing-hero", url: project.heroImage, isNew: false }
      : null
  );
  const [beforeEntries, setBeforeEntries] = useState<ImageEntry[]>(() =>
    (project.beforeImages || []).map((url, i) => ({
      id: `existing-before-${i}`,
      url,
      isNew: false,
    }))
  );
  const [duringEntries, setDuringEntries] = useState<ImageEntry[]>(() =>
    (project.duringImages || []).map((url, i) => ({
      id: `existing-during-${i}`,
      url,
      isNew: false,
    }))
  );
  const [afterEntries, setAfterEntries] = useState<ImageEntry[]>(() =>
    (project.afterImages || []).map((url, i) => ({
      id: `existing-after-${i}`,
      url,
      isNew: false,
    }))
  );

  const [removedUrls, setRemovedUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const heroInputRef = useRef<HTMLInputElement>(null);
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const duringInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const update = (key: keyof ProjectRecord, value: any) => {
    setForm(current => ({ ...current, [key]: value }) as ProjectRecord);
  };

  const handleTitleChange = (newTitle: string) => {
    setForm(current => {
      const next = { ...current, title: newTitle } as ProjectRecord;
      if (
        !project.id ||
        !current.slug ||
        current.slug === generateSlug(current.title)
      ) {
        next.slug = generateSlug(newTitle);
      }
      return next;
    });
  };

  const handleCategoryToggle = (cat: ProjectCategory) => {
    const categories = form.category.includes(cat)
      ? form.category.filter(c => c !== cat)
      : [...form.category, cat];
    update("category", categories);
  };

  const handleHeroSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const file = files[0];
    const validation = validateImageFile(file);
    if (!validation.valid) {
      notify(validation.error || "Invalid file format");
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setHeroEntry({
      id: `new-hero-${Date.now()}`,
      url: previewUrl,
      file,
      isNew: true,
    });
  };

  const handleFilesSelectedForGallery = (
    files: File[],
    setter: React.Dispatch<React.SetStateAction<ImageEntry[]>>
  ) => {
    setValidationError(null);
    const validNewEntries: ImageEntry[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        errors.push(validation.error || `Invalid file: ${file.name}`);
      } else {
        const previewUrl = URL.createObjectURL(file);
        validNewEntries.push({
          id: `new-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          url: previewUrl,
          file,
          isNew: true,
        });
      }
    }

    if (errors.length > 0) {
      setValidationError(errors.join(" "));
      notify(errors[0]);
    }

    if (validNewEntries.length > 0) {
      setter(prev => [...prev, ...validNewEntries]);
    }
  };

  const handleRemoveGalleryImage = (
    index: number,
    entries: ImageEntry[],
    setter: React.Dispatch<React.SetStateAction<ImageEntry[]>>
  ) => {
    const target = entries[index];
    if (target.isNew && target.url.startsWith("blob:")) {
      URL.revokeObjectURL(target.url);
    } else if (!target.isNew) {
      setRemovedUrls(prev => [...prev, target.url]);
    }
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const handleMoveLeft = (
    index: number,
    setter: React.Dispatch<React.SetStateAction<ImageEntry[]>>
  ) => {
    if (index === 0) return;
    setter(prev => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleMoveRight = (
    index: number,
    entries: ImageEntry[],
    setter: React.Dispatch<React.SetStateAction<ImageEntry[]>>
  ) => {
    if (index >= entries.length - 1) return;
    setter(prev => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!form.title.trim()) {
      setValidationError("Project title is required.");
      return;
    }
    if (!form.slug.trim()) {
      setValidationError("Project slug is required.");
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      const isNewProject = !project.id;
      let targetProjectId = project.id;

      if (isNewProject) {
        setUploadStatus("Creating project record...");
        const { data: created, error: createError } = await createProject({
          ...form,
          heroImage: "",
          beforeImages: [],
          duringImages: [],
          afterImages: [],
        });

        if (createError || !created) {
          throw new Error(
            createError?.message || "Failed to create project in database"
          );
        }

        targetProjectId = created.id;
      }

      // 1. Upload Hero Image
      let finalHeroImageUrl = heroEntry ? heroEntry.url : "";
      if (heroEntry && heroEntry.isNew && heroEntry.file) {
        setUploadStatus("Uploading Hero Image...");
        const { urls, errors } = await uploadProjectImages(targetProjectId, [
          heroEntry.file,
        ]);
        if (errors.length > 0) {
          notify(`Hero Upload warning: ${errors[0]}`);
        }
        if (urls.length > 0) {
          finalHeroImageUrl = urls[0];
        }
      }

      // Helper to upload a list of gallery files and return final URL list
      const processGallery = async (
        title: string,
        entries: ImageEntry[]
      ): Promise<string[]> => {
        const newEntries = entries.filter(e => e.isNew && e.file);
        const files = newEntries.map(e => e.file!);
        let uploadedUrls: string[] = [];

        if (files.length > 0) {
          setUploadStatus(`Uploading ${files.length} images for ${title}...`);
          const { urls, errors } = await uploadProjectImages(
            targetProjectId,
            files
          );
          if (errors.length > 0) {
            notify(`${title} Upload warning: ${errors[0]}`);
          }
          uploadedUrls = urls;
        }

        let uploadIndex = 0;
        const urlsList: string[] = [];
        for (const entry of entries) {
          if (entry.isNew) {
            const upUrl = uploadedUrls[uploadIndex++];
            if (upUrl) urlsList.push(upUrl);
          } else {
            urlsList.push(entry.url);
          }
        }
        return urlsList;
      };

      // 2. Upload Gallery Images
      const finalBeforeUrls = await processGallery(
        "Before images",
        beforeEntries
      );
      const finalDuringUrls = await processGallery(
        "During images",
        duringEntries
      );
      const finalAfterUrls = await processGallery("After images", afterEntries);

      // 3. Update Project Record
      setUploadStatus("Saving project case study...");
      const { error: updateError } = await updateProject(targetProjectId, {
        ...form,
        heroImage: finalHeroImageUrl,
        beforeImages: finalBeforeUrls,
        duringImages: finalDuringUrls,
        afterImages: finalAfterUrls,
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      // 4. Cleanup old storage images
      for (const removedUrl of removedUrls) {
        deleteProjectImage(removedUrl).catch(() => {});
      }

      notify(
        isNewProject
          ? "Project case study created successfully"
          : "Project case study updated successfully"
      );
      onClose();
    } catch (err) {
      const message =
        err instanceof Error
          ? err
          : new Error("An error occurred while saving project");
      setValidationError(message.message);
      notify(`Error: ${message.message}`);
    } finally {
      setIsSubmitting(false);
      setUploadStatus("");
    }
  };

  const projectCategoriesList: ProjectCategory[] = [
    "Renovation",
    "Finishing",
    "Kitchens",
    "Bathrooms",
    "Interiors",
    "Exterior",
    "Before & After",
  ];

  return (
    <Modal
      title={project.id ? "Edit project" : "Add project"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-7">
        {validationError && (
          <div className="flex items-start gap-2.5 border border-red-200 bg-red-50 p-3.5 text-[0.72rem] text-red-800">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
            <div>{validationError}</div>
          </div>
        )}

        {isSubmitting && uploadStatus && (
          <div className="border border-[#012770]/10 bg-[#f4f1ea] p-4 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#ED7D01]" />
            <p className="mt-2 text-[0.66rem] font-bold text-[#012770] uppercase tracking-[0.05em]">
              {uploadStatus}
            </p>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <AdminField
            label="Project Title"
            value={form.title}
            onChange={handleTitleChange}
            required
            disabled={isSubmitting}
          />
          <AdminField
            label="Project Slug (URL safe)"
            value={form.slug}
            onChange={value => update("slug", generateSlug(value))}
            required
            disabled={isSubmitting}
          />
          <AdminField
            label="Location (e.g. Maitama, Abuja)"
            value={form.location}
            onChange={value => update("location", value)}
            required
            disabled={isSubmitting}
          />
          <AdminField
            label="Project Type (e.g. Residential renovation)"
            value={form.type}
            onChange={value => update("type", value)}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Categories Checkboxes */}
        <div className="border-t border-[#012770]/10 pt-6">
          <label className="form-label text-[0.62rem] block mb-2">
            Categories
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {projectCategoriesList.map(cat => {
              const isChecked = form.category.includes(cat);
              return (
                <label
                  key={cat}
                  className={`flex items-center gap-2 border p-2 cursor-pointer transition-colors ${
                    isChecked
                      ? "border-[#ED7D01] bg-[#ED7D01]/5 text-[#012770] font-bold"
                      : "border-[#012770]/10 hover:border-[#ED7D01]/50 text-[#637085]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleCategoryToggle(cat)}
                    disabled={isSubmitting}
                    className="accent-[#ED7D01]"
                  />
                  <span className="text-[0.65rem]">{cat}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Narrative & Details */}
        <div className="border-t border-[#012770]/10 pt-6 space-y-5">
          <AdminField
            label="Case Study Description (Narrative Intro)"
            as="textarea"
            value={form.description}
            onChange={value => update("description", value)}
            disabled={isSubmitting}
          />
          <AdminField
            label="Project Outcome (Result / Core Accomplishment)"
            as="textarea"
            value={form.outcome}
            onChange={value => update("outcome", value)}
            disabled={isSubmitting}
          />
        </div>

        {/* Tags / String arrays */}
        <div className="grid gap-5 sm:grid-cols-2 border-t border-[#012770]/10 pt-6">
          <AdminField
            label="Services Used (comma separated)"
            value={form.services.join(", ")}
            onChange={value =>
              update(
                "services",
                value
                  .split(",")
                  .map((item: string) => item.trim())
                  .filter(Boolean)
              )
            }
            disabled={isSubmitting}
          />
          <AdminField
            label="Service Slugs (matching database services slugs, comma separated)"
            value={form.serviceSlugs.join(", ")}
            onChange={value =>
              update(
                "serviceSlugs",
                value
                  .split(",")
                  .map((item: string) => item.trim())
                  .filter(Boolean)
              )
            }
            disabled={isSubmitting}
          />
          <AdminField
            label="Materials Used (comma separated)"
            value={form.materials.join(", ")}
            onChange={value =>
              update(
                "materials",
                value
                  .split(",")
                  .map((item: string) => item.trim())
                  .filter(Boolean)
              )
            }
            disabled={isSubmitting}
          />
          <AdminField
            label="Challenges Solved (comma separated)"
            value={form.challenges.join(", ")}
            onChange={value =>
              update(
                "challenges",
                value
                  .split(",")
                  .map((item: string) => item.trim())
                  .filter(Boolean)
              )
            }
            disabled={isSubmitting}
          />
          <AdminField
            label="Related Project Slugs (comma separated)"
            value={form.relatedProjectSlugs.join(", ")}
            onChange={value =>
              update(
                "relatedProjectSlugs",
                value
                  .split(",")
                  .map((item: string) => item.trim())
                  .filter(Boolean)
              )
            }
            disabled={isSubmitting}
          />

          <div className="flex items-center gap-6 pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFeatured || false}
                onChange={e => update("isFeatured", e.target.checked)}
                disabled={isSubmitting}
                className="accent-[#ED7D01] h-3.5 w-3.5"
              />
              <span className="text-[0.66rem] font-bold text-[#012770] uppercase tracking-[0.05em]">
                Featured Project
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPublished ?? true}
                onChange={e => update("isPublished", e.target.checked)}
                disabled={isSubmitting}
                className="accent-[#ED7D01] h-3.5 w-3.5"
              />
              <span className="text-[0.66rem] font-bold text-[#012770] uppercase tracking-[0.05em]">
                Published Case Study
              </span>
            </label>
          </div>
        </div>

        {/* Hero Image Single Selector */}
        <div className="border-t border-[#012770]/10 pt-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-[0.78rem] font-extrabold uppercase tracking-[0.08em] text-[#012770]">
                Hero Banner Image
              </h3>
              <p className="mt-1 text-[0.62rem] text-[#637085]">
                Upload a single JPG, PNG, or WebP. Serves as case study cover
                and page header.
              </p>
            </div>
            <div>
              <input
                ref={heroInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleHeroSelected}
                className="hidden"
                id="project-hero-image-picker"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => heroInputRef.current?.click()}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 border border-[#012770] bg-[#012770] px-4 py-2.5 text-[0.62rem] font-extrabold uppercase tracking-[0.1em] text-white transition-colors hover:border-[#ED7D01] hover:bg-[#ED7D01] hover:text-[#012770] disabled:opacity-50"
              >
                <ImagePlus size={14} /> Upload Hero
              </button>
            </div>
          </div>

          {heroEntry ? (
            <div className="mt-4 max-w-[240px] relative overflow-hidden border border-[#012770]/15 bg-[#f4f1ea]">
              <div className="aspect-[16/10] w-full overflow-hidden">
                <img
                  src={heroEntry.url}
                  alt="Hero preview"
                  className="h-full w-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (heroEntry.isNew && heroEntry.url.startsWith("blob:")) {
                    URL.revokeObjectURL(heroEntry.url);
                  } else {
                    setRemovedUrls(prev => [...prev, heroEntry.url]);
                  }
                  setHeroEntry(null);
                }}
                className="absolute top-2 right-2 p-1.5 text-white hover:text-red-400 bg-black/40 hover:bg-black/70 rounded transition-colors"
                title="Remove Hero"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ) : (
            <div className="mt-4 border border-dashed border-[#012770]/15 py-6 text-center text-[0.68rem] text-[#637085]">
              No hero image selected.
            </div>
          )}
        </div>

        {/* Before, During, and After Galleries */}
        <ProjectGallery
          title="Before Images"
          description="Visual references of the site before project execution."
          entries={beforeEntries}
          inputId="before-images-picker"
          inputRef={beforeInputRef}
          onFilesSelected={files =>
            handleFilesSelectedForGallery(files, setBeforeEntries)
          }
          onRemove={index =>
            handleRemoveGalleryImage(index, beforeEntries, setBeforeEntries)
          }
          onMoveLeft={index => handleMoveLeft(index, setBeforeEntries)}
          onMoveRight={index =>
            handleMoveRight(index, beforeEntries, setBeforeEntries)
          }
          isSubmitting={isSubmitting}
        />

        <ProjectGallery
          title="During Images"
          description="Progress photos documenting structural, electrical, and finishing work in motion."
          entries={duringEntries}
          inputId="during-images-picker"
          inputRef={duringInputRef}
          onFilesSelected={files =>
            handleFilesSelectedForGallery(files, setDuringEntries)
          }
          onRemove={index =>
            handleRemoveGalleryImage(index, duringEntries, setDuringEntries)
          }
          onMoveLeft={index => handleMoveLeft(index, setDuringEntries)}
          onMoveRight={index =>
            handleMoveRight(index, duringEntries, setDuringEntries)
          }
          isSubmitting={isSubmitting}
        />

        <ProjectGallery
          title="After Images"
          description="Final architectural shots documenting finished rooms, design details, and outcomes."
          entries={afterEntries}
          inputId="after-images-picker"
          inputRef={afterInputRef}
          onFilesSelected={files =>
            handleFilesSelectedForGallery(files, setAfterEntries)
          }
          onRemove={index =>
            handleRemoveGalleryImage(index, afterEntries, setAfterEntries)
          }
          onMoveLeft={index => handleMoveLeft(index, setAfterEntries)}
          onMoveRight={index =>
            handleMoveRight(index, afterEntries, setAfterEntries)
          }
          isSubmitting={isSubmitting}
        />

        {/* Form Actions */}
        <div className="border-t border-[#012770]/10 pt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="border border-[#012770]/20 px-5 py-2.5 text-[0.62rem] font-extrabold uppercase tracking-[0.1em] text-[#012770] transition-colors hover:border-[#ED7D01] hover:text-[#ED7D01] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="border border-[#012770] bg-[#012770] px-6 py-2.5 text-[0.62rem] font-extrabold uppercase tracking-[0.1em] text-white transition-colors hover:border-[#ED7D01] hover:bg-[#ED7D01] hover:text-[#012770] disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Project"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ServicesSection() {
  const { services, isLoading, createService, updateService, deleteService } =
    useAdminServices();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ServicePackage | null>(null);

  const filtered = services.filter(item =>
    `${item.name} ${item.shortDescription} ${item.number}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  const notify = (message: string) => {
    toast(message);
  };

  const duplicate = (row: ServicePackage) => {
    const duplicated: Omit<ServicePackage, "id"> = {
      ...row,
      slug: `${row.slug}-copy`,
      name: `${row.name} (Copy)`,
      number: `${row.number}C`,
      isPublished: false,
    };
    createService(duplicated as any).then(() =>
      notify("Service package duplicated")
    );
  };

  const remove = async (id: string) => {
    if (confirm("Are you sure you want to delete this service package?")) {
      const { error } = await deleteService(id);
      if (error) {
        notify(`Error: ${error.message}`);
      } else {
        notify("Service package removed");
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
        eyebrow="Services management"
        title="The service registry."
        description="Configure quote-led service packages, narrative overviews, and order priorities."
        action={
          <button
            type="button"
            onClick={() => {
              const nextNum = calculateNextServiceNumber(
                services.map(s => s.number)
              );
              const nextOrder = calculateNextSortOrder(
                services.map(s => s.sortOrder ?? 0)
              );
              setEditing({
                ...blankService,
                number: nextNum,
                sortOrder: nextOrder,
              });
            }}
            className="admin-primary"
          >
            <Plus size={15} /> Add service
          </button>
        }
      />

      <Toolbar
        query={query}
        setQuery={setQuery}
        label={`${filtered.length} service packages`}
      />

      <div className="overflow-hidden bg-white shadow-[0_8px_30px_rgba(1,39,112,0.05)]">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Service Name</th>
                <th>No.</th>
                <th>Timeline</th>
                <th>Order</th>
                <th>Status</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <img
                        src={row.image || DEFAULT_SERVICE_IMAGE}
                        alt=""
                        onError={e => {
                          (e.currentTarget as HTMLImageElement).src =
                            DEFAULT_SERVICE_IMAGE;
                        }}
                        className="h-10 w-12 object-cover border border-[#012770]/10"
                      />
                      <div>
                        <div className="font-extrabold text-[#012770]">
                          {row.name}
                        </div>
                        <div className="mt-1 text-[0.62rem] text-[#637085]">
                          {row.slug}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{row.number}</td>
                  <td>{row.timeline}</td>
                  <td>{row.sortOrder ?? 0}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() =>
                        updateService(row.id, {
                          is_published: !row.isPublished,
                        })
                      }
                      className={`admin-status ${row.isPublished ? "available" : "muted"}`}
                    >
                      {row.isPublished ? "Published" : "Draft"}
                    </button>
                  </td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <IconButton label="Edit" onClick={() => setEditing(row)}>
                        <Edit3 size={14} />
                      </IconButton>
                      <IconButton
                        label="Duplicate"
                        onClick={() => duplicate(row)}
                      >
                        <Copy size={14} />
                      </IconButton>
                      <IconButton label="Delete" onClick={() => remove(row.id)}>
                        <Trash2 size={14} />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <EmptyState label="No service packages match this search." />
        )}
      </div>

      {editing && (
        <ServiceEditor
          service={editing}
          onClose={() => setEditing(null)}
          notify={notify}
          createService={createService}
          updateService={updateService}
        />
      )}
    </div>
  );
}

const DEFAULT_SERVICE_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85";

const blankService: ServicePackage = {
  id: "",
  number: "",
  slug: "",
  name: "",
  shortDescription: "",
  overview: "",
  problemsSolved: [],
  includes: [],
  process: [],
  timeline: "",
  image: "",
  relatedProjectImage: "",
  tags: [],
  isPublished: true,
  sortOrder: 0,
};

function ServiceEditor({
  service,
  onClose,
  notify,
  createService,
  updateService,
}: {
  service: ServicePackage;
  onClose: () => void;
  notify: (msg: string) => void;
  createService: (
    pkg: ServicePackage
  ) => Promise<{ data: any; error: Error | null }>;
  updateService: (id: string, updates: any) => Promise<{ error: Error | null }>;
}) {
  const [form, setForm] = useState(service);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const update = (key: keyof ServicePackage, value: any) => {
    setForm(current => ({ ...current, [key]: value }) as ServicePackage);
  };

  const handleNameChange = (newName: string) => {
    setForm(current => {
      const next = { ...current, name: newName } as ServicePackage;
      if (
        !service.id ||
        !current.slug ||
        current.slug === generateSlug(current.name)
      ) {
        next.slug = generateSlug(newName);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!form.name.trim()) {
      setValidationError("Service name is required.");
      return;
    }
    if (!form.slug.trim()) {
      setValidationError("Service slug is required.");
      return;
    }
    if (!form.number.trim()) {
      setValidationError("Service number is required.");
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      const isNewService = !service.id;
      if (isNewService) {
        const { error } = await createService(form);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await updateService(service.id, form);
        if (error) throw new Error(error.message);
      }

      notify(
        isNewService
          ? "Service package created successfully"
          : "Service package updated successfully"
      );
      onClose();
    } catch (err) {
      const message =
        err instanceof Error
          ? err
          : new Error("An error occurred while saving service package");
      setValidationError(message.message);
      notify(`Error: ${message.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title={service.id ? "Edit service package" : "Add service package"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {validationError && (
          <div className="flex items-start gap-2.5 border border-red-200 bg-red-50 p-3.5 text-[0.72rem] text-red-800">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
            <div>{validationError}</div>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <AdminField
            label="Service Name"
            value={form.name}
            onChange={handleNameChange}
            required
            disabled={isSubmitting}
          />
          <AdminField
            label="Service Slug (URL safe)"
            value={form.slug}
            onChange={value => update("slug", generateSlug(value))}
            required
            disabled={isSubmitting}
          />
          <AdminField
            label="Service Number (e.g. 01, 02)"
            value={form.number}
            onChange={value => update("number", value)}
            required
            disabled={isSubmitting || !service.id}
          />
          <AdminField
            label="Timeline (e.g. 3-4 weeks · typically scoped after inspection)"
            value={form.timeline}
            onChange={value => update("timeline", value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-5 border-t border-[#012770]/10 pt-5">
          <AdminField
            label="Short Editorial Description"
            as="textarea"
            value={form.shortDescription}
            onChange={value => update("shortDescription", value)}
            required
            disabled={isSubmitting}
          />
          <AdminField
            label="Overview (Long narrative paragraph)"
            as="textarea"
            value={form.overview}
            onChange={value => update("overview", value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 border-t border-[#012770]/10 pt-5">
          <AdminField
            label="Problems Solved (one per line)"
            as="textarea"
            value={form.problemsSolved.join("\n")}
            onChange={value =>
              update(
                "problemsSolved",
                value
                  .split("\n")
                  .map((item: string) => item.trim())
                  .filter(Boolean)
              )
            }
            disabled={isSubmitting}
          />
          <AdminField
            label="Includes (one per line)"
            as="textarea"
            value={form.includes.join("\n")}
            onChange={value =>
              update(
                "includes",
                value
                  .split("\n")
                  .map((item: string) => item.trim())
                  .filter(Boolean)
              )
            }
            disabled={isSubmitting}
          />
          <AdminField
            label="Process Steps (one per line)"
            as="textarea"
            value={form.process.join("\n")}
            onChange={value =>
              update(
                "process",
                value
                  .split("\n")
                  .map((item: string) => item.trim())
                  .filter(Boolean)
              )
            }
            disabled={isSubmitting}
          />
          <AdminField
            label="Tags (comma separated)"
            value={form.tags.join(", ")}
            onChange={value =>
              update(
                "tags",
                value
                  .split(",")
                  .map((item: string) => item.trim())
                  .filter(Boolean)
              )
            }
            disabled={isSubmitting}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 border-t border-[#012770]/10 pt-5">
          <AdminField
            label="Primary Image URL"
            value={form.image}
            onChange={value => update("image", value)}
            disabled={isSubmitting}
          />
          <AdminField
            label="Related Project Image URL"
            value={form.relatedProjectImage}
            onChange={value => update("relatedProjectImage", value)}
            disabled={isSubmitting}
          />

          <div className="flex items-center gap-5 pt-3">
            <AdminField
              label="Sort Order Index"
              type="number"
              value={String(form.sortOrder ?? 0)}
              onChange={value => update("sortOrder", Number(value))}
              disabled={isSubmitting}
            />

            <label className="flex items-center gap-2 cursor-pointer pt-4">
              <input
                type="checkbox"
                checked={form.isPublished ?? true}
                onChange={e => update("isPublished", e.target.checked)}
                disabled={isSubmitting}
                className="accent-[#ED7D01] h-3.5 w-3.5"
              />
              <span className="text-[0.66rem] font-bold text-[#012770] uppercase tracking-[0.05em]">
                Published Package
              </span>
            </label>
          </div>
        </div>

        <div className="border-t border-[#012770]/10 pt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="border border-[#012770]/20 px-5 py-2.5 text-[0.62rem] font-extrabold uppercase tracking-[0.1em] text-[#012770] transition-colors hover:border-[#ED7D01] hover:text-[#ED7D01] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="border border-[#012770] bg-[#012770] px-6 py-2.5 text-[0.62rem] font-extrabold uppercase tracking-[0.1em] text-white transition-colors hover:border-[#ED7D01] hover:bg-[#ED7D01] hover:text-[#012770] disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Service"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ============================================================================
// LEADS SECTION
// ============================================================================

function LeadsSection() {
  const { profile } = useAuth();
  const {
    leads,
    isLoading,
    updateLeadStatus,
    updateLeadNotes,
    assignLead,
    markAsRead,
    deleteLead,
  } = useAdminLeads();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [interestFilter, setInterestFilter] = useState("All");
  const [assigneeFilter, setAssigneeFilter] = useState("All");
  const [selectedLead, setSelectedLead] = useState<LeadPayload | null>(null);
  const [notesText, setNotesText] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [staff, setStaff] = useState<
    { id: string; name: string; role: string }[]
  >([]);

  // Fetch staff list for assignment options
  useEffect(() => {
    const fetchStaff = async () => {
      if (isSupabaseConfigured()) {
        try {
          const { data } = await supabase
            .from("profiles")
            .select("id, full_name, role")
            .in("role", ["admin", "editor", "staff"])
            .eq("is_active", true);

          if (data) {
            setStaff(
              data.map((d: any) => ({
                id: d.id,
                name: d.full_name || "Unknown Staff",
                role: d.role,
              }))
            );
          }
        } catch (err) {
          console.error("Error fetching staff profiles:", err);
        }
      } else {
        // Mock staff in prototype mode
        setStaff([
          { id: "staff-1", name: "Audu Ibrahim", role: "staff" },
          { id: "staff-2", name: "Grace Benson", role: "editor" },
        ]);
      }
    };
    fetchStaff();
  }, []);

  // Sync notes draft when a lead is selected
  useEffect(() => {
    if (selectedLead) {
      setNotesText(selectedLead.notes || "");
    } else {
      setNotesText("");
    }
  }, [selectedLead]);

  const handleSelectLead = async (lead: LeadPayload) => {
    setSelectedLead(lead);
    if (!lead.isRead) {
      await markAsRead(lead.id);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedLead) return;
    setIsSavingNotes(true);
    const { error } = await updateLeadNotes(selectedLead.id, notesText);
    setIsSavingNotes(false);
    if (error) {
      toast.error("Failed to update notes: " + error.message);
    } else {
      toast.success("Notes saved successfully.");
      setSelectedLead((prev: LeadPayload | null) =>
        prev ? { ...prev, notes: notesText } : null
      );
    }
  };

  const handleDelete = async (leadId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this lead? This action cannot be undone."
      )
    ) {
      return;
    }
    const { error } = await deleteLead(leadId);
    if (error) {
      toast.error("Failed to delete lead: " + error.message);
    } else {
      toast.success("Lead deleted.");
      if (selectedLead?.id === leadId) {
        setSelectedLead(null);
      }
    }
  };

  const handleAssign = async (leadId: string, assignedTo: string) => {
    const value = assignedTo === "unassigned" ? null : assignedTo;
    const { error } = await assignLead(leadId, value);
    if (error) {
      toast.error("Failed to assign lead: " + error.message);
    } else {
      toast.success("Assignment updated.");
      setSelectedLead((prev: LeadPayload | null) =>
        prev ? { ...prev, assignedTo: value || undefined } : null
      );
    }
  };

  // Perform search and filter logic
  const filtered = leads.filter(row => {
    const matchesSearch =
      row.name.toLowerCase().includes(search.toLowerCase()) ||
      row.email.toLowerCase().includes(search.toLowerCase()) ||
      row.phone.toLowerCase().includes(search.toLowerCase()) ||
      (row.property &&
        row.property.toLowerCase().includes(search.toLowerCase())) ||
      (row.service &&
        row.service.toLowerCase().includes(search.toLowerCase())) ||
      row.message.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "All" || row.status === statusFilter;
    const matchesInterest =
      interestFilter === "All" || row.interestType === interestFilter;

    let matchesAssignee = true;
    if (assigneeFilter !== "All") {
      if (assigneeFilter === "Unassigned") {
        matchesAssignee = !row.assignedTo;
      } else {
        matchesAssignee = row.assignedTo === assigneeFilter;
      }
    }

    return matchesSearch && matchesStatus && matchesInterest && matchesAssignee;
  });

  const getStatusBadgeClass = (status: LeadPayload["status"]) => {
    const base =
      "px-2 py-0.5 text-[0.6rem] font-extrabold uppercase tracking-wider ";
    switch (status) {
      case "New":
        return base + "bg-blue-100 text-blue-800";
      case "Contacted":
        return base + "bg-yellow-100 text-yellow-800";
      case "Qualified":
        return base + "bg-purple-100 text-purple-800";
      case "Appointment":
        return base + "bg-orange-100 text-orange-800";
      case "Converted":
        return base + "bg-green-100 text-green-800";
      case "Closed":
        return base + "bg-gray-100 text-gray-800";
      case "Archived":
        return base + "bg-red-100 text-red-800";
      default:
        return base + "bg-gray-100 text-gray-600";
    }
  };

  const getInterestBadgeClass = (interestType: string) => {
    if (interestType === "Building Project") {
      return "inline-block px-2 py-0.5 text-[0.6rem] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300";
    }
    return "inline-block px-2 py-0.5 text-[0.6rem] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700";
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Lead management"
        title="The next conversations."
        description="Review enquiries, schedule inspections, assign staff, and track customer relationships."
      />

      {/* SEARCH AND FILTERS */}
      <div className="grid gap-4 bg-white p-5 shadow-[0_8px_30px_rgba(1,39,112,0.02)] border border-[#012770]/8 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#637085]"
          />
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input pl-9 w-full"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="form-input w-full"
        >
          <option value="All">All Statuses</option>
          <option value="New">New</option>
          <option value="Contacted">Contacted</option>
          <option value="Qualified">Qualified</option>
          <option value="Appointment">Appointment</option>
          <option value="Converted">Converted</option>
          <option value="Closed">Closed</option>
          <option value="Archived">Archived</option>
        </select>

        {/* Interest Type Filter */}
        <select
          value={interestFilter}
          onChange={e => setInterestFilter(e.target.value)}
          className="form-input w-full"
        >
          <option value="All">All Interest Types</option>
          <option value="Building Project">Building Project</option>
          <option value="Property Enquiry">Property Enquiry</option>
          <option value="Viewing Request">Viewing Request</option>
          <option value="Renovation Quote">Renovation Quote</option>
          <option value="Site Inspection">Site Inspection</option>
          <option value="Agent Conversation">Agent Conversation</option>
        </select>

        {/* Assignee Filter */}
        <select
          value={assigneeFilter}
          onChange={e => setAssigneeFilter(e.target.value)}
          className="form-input w-full"
        >
          <option value="All">All Assignees</option>
          <option value="Unassigned">Unassigned</option>
          {staff.map(s => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.role})
            </option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden bg-white border border-[#012770]/8 shadow-[0_8px_30px_rgba(1,39,112,0.03)]">
        <div className="overflow-x-auto">
          <table className="admin-table w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Interest</th>
                <th>Property / Service</th>
                <th>Preferred Appointment</th>
                <th>Source</th>
                <th>Date</th>
                <th>Status</th>
                <th>Contact</th>
                {profile?.role === "admin" && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={profile?.role === "admin" ? 9 : 8}
                    className="text-center py-10 text-xs text-[#637085]"
                  >
                    No leads found matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(row => (
                  <tr
                    key={row.id}
                    onClick={() => handleSelectLead(row)}
                    className={`cursor-pointer transition-colors hover:bg-[#f4f1ea]/40 ${!row.isRead ? "bg-blue-50/20 font-semibold" : ""}`}
                  >
                    <td className="font-extrabold text-[#012770]">
                      <div className="flex items-center gap-2">
                        {!row.isRead && (
                          <span
                            className="h-2 w-2 rounded-full bg-[#ED7D01] shrink-0"
                            title="Unread Lead"
                          />
                        )}
                        {row.name}
                      </div>
                    </td>
                    <td>
                      <span className={getInterestBadgeClass(row.interestType)}>
                        {row.interestType}
                      </span>
                    </td>
                    <td>{row.property || row.service || "—"}</td>
                    <td>
                      {row.preferredDate ? (
                        <span className="text-xs">
                          {new Date(row.preferredDate).toLocaleDateString()} at{" "}
                          {row.preferredTime || "Any time"}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{row.source}</td>
                    <td>{new Date(row.date).toLocaleDateString()}</td>
                    <td>
                      <span className={getStatusBadgeClass(row.status)}>
                        {row.status}
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <a
                        href={`https://wa.me/${row.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="admin-link flex items-center gap-1"
                      >
                        {row.phone} <ArrowUpRight size={11} />
                      </a>
                    </td>
                    {profile?.role === "admin" && (
                      <td onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id)}
                          className="text-red-500 hover:text-red-700"
                          title="Delete Lead"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL DRAWER / MODAL */}
      {selectedLead && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div
            className="absolute inset-0 bg-[#012770]/60 backdrop-blur-xs"
            onClick={() => setSelectedLead(null)}
          />
          <div className="relative h-full w-full max-w-xl bg-white shadow-[0_0_80px_rgba(1,39,112,0.25)] flex flex-col z-10 animate-slide-in p-6 sm:p-8 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#012770]/10 pb-5">
              <div>
                <span className={getStatusBadgeClass(selectedLead.status)}>
                  {selectedLead.status}
                </span>
                <h3 className="display-serif text-2xl text-[#012770] mt-3">
                  {selectedLead.name}
                </h3>
                <p className="text-xs text-[#637085] mt-1">
                  <span
                    className={getInterestBadgeClass(selectedLead.interestType)}
                  >
                    {selectedLead.interestType}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="grid h-9 w-9 place-items-center border border-[#012770]/12 hover:bg-[#f4f1ea] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Details */}
            <div className="flex-1 py-6 space-y-6">
              {/* Contact Metadata */}
              <div className="grid grid-cols-2 gap-4 bg-[#f4f1ea]/30 p-4 border border-[#012770]/6">
                <div>
                  <span className="block text-[0.55rem] uppercase tracking-wider text-[#637085]">
                    Email
                  </span>
                  <a
                    href={`mailto:${selectedLead.email}`}
                    className="text-xs font-bold text-[#012770] hover:underline"
                  >
                    {selectedLead.email}
                  </a>
                </div>
                <div>
                  <span className="block text-[0.55rem] uppercase tracking-wider text-[#637085]">
                    Phone / WhatsApp
                  </span>
                  <a
                    href={`https://wa.me/${selectedLead.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-[#012770] hover:underline flex items-center gap-1"
                  >
                    {selectedLead.phone} <ArrowUpRight size={10} />
                  </a>
                </div>
                <div>
                  <span className="block text-[0.55rem] uppercase tracking-wider text-[#637085]">
                    Source Channel
                  </span>
                  <span className="text-xs font-bold text-[#012770]">
                    {selectedLead.source}
                  </span>
                </div>
                <div>
                  <span className="block text-[0.55rem] uppercase tracking-wider text-[#637085]">
                    Submission Date
                  </span>
                  <span className="text-xs font-bold text-[#012770]">
                    {new Date(selectedLead.date).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Related Entity context */}
              {(selectedLead.property || selectedLead.service) && (
                <div>
                  <h4 className="text-[0.62rem] font-extrabold uppercase tracking-wider text-[#637085]">
                    Context
                  </h4>
                  <div className="mt-2 text-xs text-[#012770] font-bold border-l-2 border-[#ED7D01] pl-3 py-1">
                    {selectedLead.property
                      ? `Property: ${selectedLead.property}`
                      : `Service: ${selectedLead.service}`}
                  </div>
                </div>
              )}

              {/* Preferred Appointment Date/Time */}
              {selectedLead.preferredDate && (
                <div className="bg-[#ED7D01]/5 border border-[#ED7D01]/20 p-4">
                  <h4 className="text-[0.62rem] font-extrabold uppercase tracking-wider text-[#ED7D01]">
                    Requested Appointment
                  </h4>
                  <p className="mt-2 text-xs font-bold text-[#012770]">
                    Date:{" "}
                    {new Date(selectedLead.preferredDate).toLocaleDateString()}
                  </p>
                  <p className="text-xs font-bold text-[#012770] mt-1">
                    Time Preferred: {selectedLead.preferredTime || "—"}
                  </p>
                </div>
              )}

              {/* Message */}
              <div>
                <h4 className="text-[0.62rem] font-extrabold uppercase tracking-wider text-[#637085]">
                  Message
                </h4>
                <div className="mt-2 text-xs text-[#17212f] leading-relaxed bg-[#f4f1ea]/15 p-4 border border-dashed border-[#012770]/10 whitespace-pre-wrap">
                  {selectedLead.message || "No message body provided."}
                </div>
              </div>

              {/* Status Update Select */}
              <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t border-[#012770]/10">
                <div>
                  <label className="form-label text-[0.62rem]">
                    Status Stage
                  </label>
                  <select
                    value={selectedLead.status}
                    onChange={e => {
                      const nextStatus = e.target.value.toLowerCase() as any;
                      updateLeadStatus(selectedLead.id, nextStatus);
                      setSelectedLead((prev: LeadPayload | null) =>
                        prev ? { ...prev, status: e.target.value as any } : null
                      );
                    }}
                    className="form-input mt-1 w-full"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Appointment">Appointment</option>
                    <option value="Converted">Converted</option>
                    <option value="Closed">Closed</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="form-label text-[0.62rem]">
                    Assigned Staff
                  </label>
                  <select
                    value={selectedLead.assignedTo || "unassigned"}
                    onChange={e =>
                      handleAssign(selectedLead.id, e.target.value)
                    }
                    className="form-input mt-1 w-full"
                  >
                    <option value="unassigned">Unassigned</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Administrative Private Notes */}
              <div className="space-y-2 pt-4 border-t border-[#012770]/10">
                <div className="flex items-center justify-between">
                  <label className="form-label text-[0.62rem] text-[#637085] uppercase">
                    Internal Private Notes (Admin Only)
                  </label>
                  <button
                    type="button"
                    disabled={isSavingNotes}
                    onClick={handleSaveNotes}
                    className="text-[0.6rem] font-extrabold uppercase tracking-wider text-[#ED7D01] hover:underline"
                  >
                    {isSavingNotes ? "Saving..." : "Save Notes"}
                  </button>
                </div>
                <textarea
                  value={notesText}
                  onChange={e => setNotesText(e.target.value)}
                  placeholder="Enter private administrative follow-up comments..."
                  className="form-input min-h-24 w-full text-xs resize-y"
                />
              </div>
            </div>

            {/* Footer buttons */}
            <div className="border-t border-[#012770]/10 pt-4 flex gap-3 justify-end">
              {profile?.role === "admin" && (
                <button
                  type="button"
                  onClick={() => handleDelete(selectedLead.id)}
                  className="px-4 py-2 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-bold transition-colors"
                >
                  Delete Lead
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="admin-primary"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CONTENT SECTION
// ============================================================================

function ContentSection() {
  const { articles, isLoading, createArticle, updateArticle, deleteArticle } =
    useAdminArticles();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ArticleRecord | null>(null);

  const filtered = articles.filter(item =>
    `${item.title} ${item.category} ${item.excerpt}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  const notify = (message: string) => {
    toast(message);
  };

  const remove = async (id: string) => {
    if (confirm("Are you sure you want to delete this article?")) {
      const { error } = await deleteArticle(id);
      if (error) {
        notify(`Error: ${error.message}`);
      } else {
        notify("Article removed");
      }
    }
  };

  const togglePublish = async (row: ArticleRecord) => {
    const nextPublished = !row.isPublished;
    const { error } = await updateArticle(row.id, {
      is_published: nextPublished,
    } as any);
    if (error) {
      notify(`Error updating publish state: ${error.message}`);
    } else {
      notify(nextPublished ? "Article published" : "Article unpublished");
    }
  };

  const toggleFeatured = async (row: ArticleRecord) => {
    const nextFeatured = !row.isFeatured;
    const { error } = await updateArticle(row.id, {
      is_featured: nextFeatured,
    } as any);
    if (error) {
      notify(`Error updating featured state: ${error.message}`);
    } else {
      notify(
        nextFeatured
          ? "Article marked as featured"
          : "Article unmarked as featured"
      );
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
        eyebrow="Editorial system"
        title="Inspiration articles."
        description="Write and configure editorial articles, categories, and references for properties or projects."
        action={
          <button
            type="button"
            onClick={() => setEditing(blankArticle)}
            className="admin-primary"
          >
            <Plus size={15} /> Add article
          </button>
        }
      />

      <Toolbar
        query={query}
        setQuery={setQuery}
        label={`${filtered.length} articles`}
      />

      <div className="overflow-hidden bg-white shadow-[0_8px_30px_rgba(1,39,112,0.05)]">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Article Title</th>
                <th>Category</th>
                <th>Date</th>
                <th>Featured</th>
                <th>Status</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <img
                        src={row.heroImage || DEFAULT_ARTICLE_IMAGE}
                        alt=""
                        onError={e => {
                          (e.currentTarget as HTMLImageElement).src =
                            DEFAULT_ARTICLE_IMAGE;
                        }}
                        className="h-10 w-12 object-cover border border-[#012770]/10"
                      />
                      <div>
                        <div className="font-extrabold text-[#012770]">
                          {row.title}
                        </div>
                        <div className="mt-1 text-[0.62rem] text-[#637085]">
                          {row.slug}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{row.category}</td>
                  <td>{row.date}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => toggleFeatured(row)}
                      className={`admin-status ${row.isFeatured ? "available" : "muted"}`}
                    >
                      {row.isFeatured ? "Featured" : "Regular"}
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => togglePublish(row)}
                      className={`admin-status ${row.isPublished ? "available" : "muted"}`}
                    >
                      {row.isPublished ? "Published" : "Draft"}
                    </button>
                  </td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <IconButton label="Edit" onClick={() => setEditing(row)}>
                        <Edit3 size={14} />
                      </IconButton>
                      <IconButton label="Delete" onClick={() => remove(row.id)}>
                        <Trash2 size={14} />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <EmptyState label="No articles match this search." />
        )}
      </div>

      {editing && (
        <ArticleEditor
          article={editing}
          onClose={() => setEditing(null)}
          notify={notify}
          createArticle={createArticle}
          updateArticle={updateArticle}
        />
      )}
    </div>
  );
}

const DEFAULT_ARTICLE_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85";

const blankArticle: ArticleRecord = {
  id: "",
  slug: "",
  title: "",
  category: "Home Improvement Tips",
  date: "",
  excerpt: "",
  heroImage: "",
  readTime: "5 min read",
  content: [{ heading: "", body: "" }],
  serviceSlugs: [],
  projectSlugs: [],
  propertyLink: "",
  isPublished: false,
  isFeatured: false,
};

function ArticleEditor({
  article,
  onClose,
  notify,
  createArticle,
  updateArticle,
}: {
  article: ArticleRecord;
  onClose: () => void;
  notify: (msg: string) => void;
  createArticle: (
    art: ArticleRecord
  ) => Promise<{ data: any; error: Error | null }>;
  updateArticle: (id: string, updates: any) => Promise<{ error: Error | null }>;
}) {
  const { services } = useServices(); // to get service list
  const { projects } = useProjects(); // to get project list

  const [form, setForm] = useState(article);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState(article.heroImage || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const update = (key: keyof ArticleRecord, value: any) => {
    setForm(current => ({ ...current, [key]: value }) as ArticleRecord);
  };

  const handleTitleChange = (newTitle: string) => {
    setForm(current => {
      const next = { ...current, title: newTitle } as ArticleRecord;
      if (
        !article.id ||
        !current.slug ||
        current.slug === generateSlug(current.title)
      ) {
        next.slug = generateSlug(newTitle);
      }
      return next;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validation = validateImageFile(file);
      if (!validation.valid) {
        notify(validation.error || "Invalid file");
        return;
      }
      setHeroFile(file);
      const previewUrl = URL.createObjectURL(file);
      setHeroPreview(previewUrl);
    }
  };

  const addContentSection = () => {
    update("content", [...form.content, { heading: "", body: "" }]);
  };

  const removeContentSection = (index: number) => {
    if (form.content.length <= 1) {
      notify("An article must have at least one body section.");
      return;
    }
    update(
      "content",
      form.content.filter((_, i) => i !== index)
    );
  };

  const updateContentSection = (
    index: number,
    key: "heading" | "body",
    value: string
  ) => {
    const updated = form.content.map((sec, i) => {
      if (i === index) {
        return { ...sec, [key]: value };
      }
      return sec;
    });
    update("content", updated);
  };

  const toggleServiceSlug = (slug: string) => {
    const current = form.serviceSlugs || [];
    const next = current.includes(slug)
      ? current.filter(s => s !== slug)
      : [...current, slug];
    update("serviceSlugs", next);
  };

  const toggleProjectSlug = (slug: string) => {
    const current = form.projectSlugs || [];
    const next = current.includes(slug)
      ? current.filter(s => s !== slug)
      : [...current, slug];
    update("projectSlugs", next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!form.title.trim()) {
      setValidationError("Article title is required.");
      return;
    }
    if (!form.slug.trim()) {
      setValidationError("Article slug is required.");
      return;
    }
    if (!form.excerpt.trim()) {
      setValidationError("Article short description (excerpt) is required.");
      return;
    }

    const invalidSection = form.content.findIndex(sec => !sec.body.trim());
    if (invalidSection !== -1) {
      setValidationError(`Section ${invalidSection + 1} body cannot be empty.`);
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      const isNewArticle = !article.id;
      let targetArticleId = article.id;
      let finalHeroImageUrl = heroPreview;

      // 1. Create article record first if it's new to get database UUID
      if (isNewArticle) {
        const { data: created, error: createError } = await createArticle({
          ...form,
          heroImage: heroPreview.startsWith("blob:") ? "" : heroPreview,
        });

        if (createError || !created) {
          throw new Error(
            createError?.message || "Failed to create article in database"
          );
        }
        targetArticleId = created.id;
      }

      // 2. Upload file if a new file is chosen
      if (heroFile) {
        const { url: uploadUrl, error: uploadError } = await uploadArticleImage(
          targetArticleId,
          heroFile
        );
        if (uploadError) {
          notify(`Image Upload warning: ${uploadError.message}`);
        } else if (uploadUrl) {
          finalHeroImageUrl = uploadUrl;
        }
      }

      // 3. Update the database record with the final image URL (and updates if new)
      const finalPayload = {
        ...form,
        id: targetArticleId,
        heroImage: finalHeroImageUrl,
      };

      const { error: saveError } = await updateArticle(
        targetArticleId,
        finalPayload
      );
      if (saveError) {
        throw new Error(saveError.message);
      }

      notify(
        isNewArticle
          ? "Article created successfully"
          : "Article updated successfully"
      );
      onClose();
    } catch (err) {
      setValidationError(
        err instanceof Error ? err.message : "Failed to save article"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (heroPreview.startsWith("blob:")) {
        URL.revokeObjectURL(heroPreview);
      }
    };
  }, [heroPreview]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#f4f1ea] p-8 shadow-2xl overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#012770]/10 pb-4">
          <h2 className="display-serif text-3xl text-[#012770]">
            {article.id ? "Edit Article" : "New Article"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#637085] hover:text-[#012770] font-extrabold uppercase tracking-wider text-xs"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {validationError && (
            <div className="border border-red-200 bg-red-50 p-4 text-xs text-red-600 font-extrabold uppercase tracking-wider">
              {validationError}
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[0.62rem] font-extrabold uppercase tracking-wider text-[#012770]">
                Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e => handleTitleChange(e.target.value)}
                className="w-full border border-[#012770]/20 bg-white p-3 text-sm focus:border-[#ED7D01] focus:outline-none"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[0.62rem] font-extrabold uppercase tracking-wider text-[#012770]">
                Slug *
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={e => update("slug", generateSlug(e.target.value))}
                className="w-full border border-[#012770]/20 bg-white p-3 text-sm focus:border-[#ED7D01] focus:outline-none"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-[0.62rem] font-extrabold uppercase tracking-wider text-[#012770]">
                Category
              </label>
              <select
                value={form.category}
                onChange={e => update("category", e.target.value)}
                className="w-full border border-[#012770]/20 bg-white p-3 text-sm focus:border-[#ED7D01] focus:outline-none"
                disabled={isSubmitting}
              >
                {inspirationCategories
                  .filter((c: string) => c !== "All Inspiration")
                  .map((cat: string) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[0.62rem] font-extrabold uppercase tracking-wider text-[#012770]">
                Read Time
              </label>
              <input
                type="text"
                value={form.readTime}
                onChange={e => update("readTime", e.target.value)}
                className="w-full border border-[#012770]/20 bg-white p-3 text-sm focus:border-[#ED7D01] focus:outline-none"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[0.62rem] font-extrabold uppercase tracking-wider text-[#012770]">
                Date
              </label>
              <input
                type="text"
                value={form.date}
                onChange={e => update("date", e.target.value)}
                placeholder="e.g. 14 August 2026"
                className="w-full border border-[#012770]/20 bg-white p-3 text-sm focus:border-[#ED7D01] focus:outline-none"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[0.62rem] font-extrabold uppercase tracking-wider text-[#012770]">
              Short Description (Excerpt) *
            </label>
            <textarea
              value={form.excerpt}
              onChange={e => update("excerpt", e.target.value)}
              rows={3}
              className="w-full border border-[#012770]/20 bg-white p-3 text-sm focus:border-[#ED7D01] focus:outline-none"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-4">
            <label className="text-[0.62rem] font-extrabold uppercase tracking-wider text-[#012770] block">
              Featured Image
            </label>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="relative h-32 w-48 overflow-hidden border border-[#012770]/10 bg-white flex items-center justify-center">
                <img
                  src={heroPreview || DEFAULT_ARTICLE_IMAGE}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).src =
                      DEFAULT_ARTICLE_IMAGE;
                  }}
                />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="admin-secondary text-xs"
                    disabled={isSubmitting}
                  >
                    Select Image File
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                  />
                  <p className="mt-1 text-[0.62rem] text-[#637085]">
                    JPG, PNG, or WebP up to 5 MB.
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-[0.58rem] font-extrabold uppercase tracking-wider text-[#637085]">
                    Or Enter Image URL
                  </label>
                  <input
                    type="text"
                    value={heroPreview.startsWith("blob:") ? "" : heroPreview}
                    onChange={e => {
                      setHeroFile(null);
                      setHeroPreview(e.target.value);
                    }}
                    className="w-full border border-[#012770]/20 bg-white p-2 text-xs focus:border-[#ED7D01] focus:outline-none"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#012770]/10 pb-2">
              <label className="text-[0.62rem] font-extrabold uppercase tracking-wider text-[#012770]">
                Article Body Content Sections *
              </label>
              <button
                type="button"
                onClick={addContentSection}
                className="text-[0.62rem] font-extrabold uppercase tracking-wider text-[#ED7D01] hover:underline"
                disabled={isSubmitting}
              >
                + Add Section
              </button>
            </div>

            <div className="space-y-4">
              {form.content.map((sec, index) => (
                <div
                  key={index}
                  className="bg-white border border-[#012770]/10 p-4 space-y-4 relative"
                >
                  <div className="flex items-center justify-between border-b border-[#012770]/5 pb-2">
                    <span className="text-[0.62rem] font-extrabold uppercase tracking-wider text-[#ED7D01]">
                      Section {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeContentSection(index)}
                      className="text-xs text-red-500 hover:text-red-700"
                      disabled={isSubmitting}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[0.58rem] font-extrabold uppercase tracking-wider text-[#637085]">
                      Heading (Optional)
                    </label>
                    <input
                      type="text"
                      value={sec.heading || ""}
                      onChange={e =>
                        updateContentSection(index, "heading", e.target.value)
                      }
                      className="w-full border border-[#012770]/20 bg-white p-2 text-xs focus:border-[#ED7D01] focus:outline-none"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[0.58rem] font-extrabold uppercase tracking-wider text-[#637085]">
                      Body Paragraph *
                    </label>
                    <textarea
                      value={sec.body}
                      onChange={e =>
                        updateContentSection(index, "body", e.target.value)
                      }
                      rows={4}
                      className="w-full border border-[#012770]/20 bg-white p-2 text-xs focus:border-[#ED7D01] focus:outline-none"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2 bg-white border border-[#012770]/10 p-4">
              <label className="text-[0.62rem] font-extrabold uppercase tracking-wider text-[#012770] block border-b border-[#012770]/5 pb-2">
                Related Services
              </label>
              <div className="max-h-40 overflow-y-auto space-y-2 pt-2">
                {services.map(s => (
                  <label
                    key={s.slug}
                    className="flex items-center gap-2 text-xs text-[#17212f] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={(form.serviceSlugs || []).includes(s.slug)}
                      onChange={() => toggleServiceSlug(s.slug)}
                      className="rounded border-[#012770]/20 text-[#ED7D01] focus:ring-[#ED7D01]"
                    />
                    <span>{s.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2 bg-white border border-[#012770]/10 p-4">
              <label className="text-[0.62rem] font-extrabold uppercase tracking-wider text-[#012770] block border-b border-[#012770]/5 pb-2">
                Related Projects
              </label>
              <div className="max-h-40 overflow-y-auto space-y-2 pt-2">
                {projects.map(p => (
                  <label
                    key={p.slug}
                    className="flex items-center gap-2 text-xs text-[#17212f] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={(form.projectSlugs || []).includes(p.slug)}
                      onChange={() => toggleProjectSlug(p.slug)}
                      className="rounded border-[#012770]/20 text-[#ED7D01] focus:ring-[#ED7D01]"
                    />
                    <span>{p.title}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[0.62rem] font-extrabold uppercase tracking-wider text-[#012770]">
              Link to Property (Optional Page Route)
            </label>
            <input
              type="text"
              value={form.propertyLink || ""}
              onChange={e => update("propertyLink", e.target.value)}
              placeholder="e.g. /properties"
              className="w-full border border-[#012770]/20 bg-white p-3 text-sm focus:border-[#ED7D01] focus:outline-none"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center gap-6 pt-4 border-t border-[#012770]/10">
            <label className="flex items-center gap-2 text-xs text-[#012770] font-extrabold uppercase tracking-wider cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={e => update("isPublished", e.target.checked)}
                className="rounded border-[#012770]/20 text-[#ED7D01] focus:ring-[#ED7D01]"
              />
              <span>Published</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-[#012770] font-extrabold uppercase tracking-wider cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={e => update("isFeatured", e.target.checked)}
                className="rounded border-[#012770]/20 text-[#ED7D01] focus:ring-[#ED7D01]"
              />
              <span>Featured Article</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-[#012770]/10">
            <button
              type="button"
              onClick={onClose}
              className="admin-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-primary flex items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {article.id ? "Save Changes" : "Create Article"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// MEDIA SECTION
// ============================================================================

function MediaSection() {
  const { assets, isLoading, deleteAsset, refetch } = useMedia();
  const [query, setQuery] = useState("");
  const [bucketFilter, setBucketFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast("Asset URL copied to clipboard");
  };

  const handleDelete = async (
    bucket: "properties" | "projects" | "articles",
    path: string
  ) => {
    if (
      confirm(
        "Are you sure you want to permanently delete this file from storage? This cannot be undone."
      )
    ) {
      const { error } = await deleteAsset(bucket, path);
      if (error) {
        toast(`Error deleting asset: ${error.message}`);
      } else {
        toast("Asset deleted successfully");
      }
    }
  };

  const filtered = assets.filter(asset => {
    const matchesQuery =
      asset.name.toLowerCase().includes(query.toLowerCase()) ||
      asset.path.toLowerCase().includes(query.toLowerCase()) ||
      (asset.referencedBy?.title || "")
        .toLowerCase()
        .includes(query.toLowerCase());

    const matchesBucket =
      bucketFilter === "all" || asset.bucket === bucketFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && asset.referencedBy !== null) ||
      (statusFilter === "orphaned" && asset.referencedBy === null);

    return matchesQuery && matchesBucket && matchesStatus;
  });

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
        eyebrow="Media library"
        title="The visual archive."
        description="A live database-free library for reviewing and cleaning up the assets uploaded across properties, projects, and articles buckets."
        action={
          <button
            type="button"
            onClick={() => refetch()}
            className="admin-primary"
          >
            <RefreshCw size={14} /> Refresh library
          </button>
        }
      />

      <div className="flex flex-col gap-4 bg-white p-4 shadow-[0_8px_30px_rgba(1,39,112,0.05)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 max-w-md border border-[#012770]/10 px-3 py-2 bg-white">
          <Search size={16} className="text-[#637085]" />
          <input
            type="text"
            placeholder="Search by file name or referenced title..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full text-xs outline-none bg-transparent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[0.62rem] font-extrabold uppercase tracking-wider text-[#637085]">
              Bucket
            </span>
            <select
              value={bucketFilter}
              onChange={e => setBucketFilter(e.target.value)}
              className="border border-[#012770]/10 p-2 text-xs focus:border-[#ED7D01] focus:outline-none bg-white font-extrabold text-[#012770]"
            >
              <option value="all">All Buckets</option>
              <option value="properties">Properties</option>
              <option value="projects">Projects</option>
              <option value="articles">Articles</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[0.62rem] font-extrabold uppercase tracking-wider text-[#637085]">
              Usage
            </span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-[#012770]/10 p-2 text-xs focus:border-[#ED7D01] focus:outline-none bg-white font-extrabold text-[#012770]"
            >
              <option value="all">All Status</option>
              <option value="active">Active (Referenced)</option>
              <option value="orphaned">Orphaned (Unreferenced)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[0.7rem] font-bold text-[#637085]">
        <div className="flex items-center gap-1.5">
          <ImageIcon size={15} className="text-[#ED7D01]" />
          <span>
            Showing {filtered.length} of {assets.length} assets
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map(asset => (
          <div
            key={asset.path}
            className="group flex flex-col justify-between bg-white border border-[#012770]/5 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div>
              <div
                onClick={() => setZoomImage(asset.url)}
                className="aspect-[4/3] overflow-hidden bg-gray-50 flex items-center justify-center border-b border-[#012770]/5 relative cursor-pointer"
              >
                <img
                  src={asset.url}
                  alt={asset.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-102"
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80";
                  }}
                />
                <div className="absolute inset-0 bg-[#012770]/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                  <span className="text-[0.62rem] font-extrabold uppercase tracking-wider text-white bg-[#012770] px-3 py-1.5 rounded-full">
                    Zoom Image
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="truncate text-xs font-extrabold text-[#012770]"
                    title={asset.name}
                  >
                    {asset.name}
                  </p>
                  <span className="text-[0.62rem] font-extrabold text-[#ED7D01] bg-[#ED7D01]/5 px-2 py-0.5 uppercase">
                    {asset.bucket}
                  </span>
                </div>
                <p className="text-[0.62rem] text-[#637085] truncate font-mono">
                  {asset.path}
                </p>

                <div className="pt-2 border-t border-[#012770]/5 space-y-1.5">
                  <div className="flex justify-between items-center text-[0.62rem]">
                    <span className="text-[#637085]">File Size</span>
                    <span className="font-extrabold text-[#012770]">
                      {formatSize(asset.size)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[0.62rem]">
                    <span className="text-[#637085]">Upload Date</span>
                    <span className="font-extrabold text-[#012770]">
                      {new Date(asset.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 pt-0 border-t border-[#012770]/5 mt-2 space-y-3">
              <div className="flex items-center gap-1.5 text-[0.62rem]">
                {asset.referencedBy ? (
                  <div className="flex flex-col gap-0.5">
                    <span className="font-extrabold text-emerald-600 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                      ACTIVE REFERENCE
                    </span>
                    <span
                      className="text-[#637085] truncate max-w-[200px]"
                      title={asset.referencedBy.title}
                    >
                      Used in {asset.referencedBy.type}:{" "}
                      <span className="font-bold text-[#012770]">
                        {asset.referencedBy.title}
                      </span>
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    <span className="font-extrabold text-amber-500 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block"></span>
                      ORPHANED ASSET
                    </span>
                    <span className="text-[#637085]">
                      Unreferenced (Safe to delete)
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => copyUrl(asset.url)}
                  className="flex-1 admin-secondary text-[0.62rem] py-1.5 flex items-center justify-center gap-1 font-extrabold uppercase tracking-wider"
                >
                  <Copy size={12} /> Copy URL
                </button>
                {!asset.referencedBy && (
                  <button
                    type="button"
                    onClick={() => handleDelete(asset.bucket, asset.path)}
                    className="admin-secondary text-red-500 hover:text-white hover:bg-red-500 hover:border-red-500 text-[0.62rem] py-1.5 flex items-center justify-center gap-1 font-extrabold uppercase tracking-wider"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <EmptyState label="No assets matched your search filters." />
      )}

      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-black">
            <img
              src={zoomImage}
              alt=""
              className="max-w-full max-h-[85vh] object-contain"
            />
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-4 right-4 bg-black/60 text-white rounded-full p-2 hover:bg-black/90 font-extrabold text-xs"
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// STAFF SECTION
// ============================================================================

function StaffSection() {
  const { profile: currentUserProfile } = useAuth();
  const isAdminUser = currentUserProfile?.role === "admin";

  const { staff, isLoading, updateRole, toggleActive, refetch } = useStaff();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showInviteModal, setShowInviteModal] = useState(false);

  const handleRoleChange = async (userId: string, newRole: any) => {
    if (
      confirm(`Are you sure you want to change this user's role to ${newRole}?`)
    ) {
      const { error } = await updateRole(userId, newRole);
      if (error) {
        toast.error(`Failed to change role: ${error.message}`);
      } else {
        toast.success("Role updated successfully.");
      }
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    const action = nextStatus ? "activate" : "deactivate";
    if (confirm(`Are you sure you want to ${action} this user's account?`)) {
      const { error } = await toggleActive(userId, nextStatus);
      if (error) {
        toast.error(`Failed to update status: ${error.message}`);
      } else {
        toast.success(`Account ${nextStatus ? "activated" : "deactivated"}.`);
      }
    }
  };

  const handleRemoveStaff = async (userId: string, name: string) => {
    if (
      confirm(
        `Remove ${name} from staff?\n\n${name} will lose staff/admin dashboard privileges, but their account and historical records will be preserved.`
      )
    ) {
      const { error } = await updateRole(userId, "user");
      if (error) {
        toast.error(`Failed to remove user from staff: ${error.message}`);
      } else {
        toast.success(`${name} has been removed from staff.`);
      }
    }
  };

  const filtered = staff.filter(member => {
    const matchesQuery =
      (member.fullName || "").toLowerCase().includes(query.toLowerCase()) ||
      member.email.toLowerCase().includes(query.toLowerCase());

    const matchesRole = roleFilter === "all" || member.role === roleFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && member.isActive) ||
      (statusFilter === "inactive" && !member.isActive);

    return matchesQuery && matchesRole && matchesStatus;
  });

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
        eyebrow="Staff access"
        title="The people behind the work."
        description="Manage workspace user directories, access rights, roles, and status levels. Only Administrators can modify roles and toggle status levels."
        action={
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="admin-primary"
          >
            <Plus size={15} /> Invite staff
          </button>
        }
      />

      <div className="flex flex-col gap-4 bg-white p-4 shadow-[0_8px_30px_rgba(1,39,112,0.05)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 max-w-md border border-[#012770]/10 px-3 py-2 bg-white">
          <Search size={16} className="text-[#637085]" />
          <input
            type="text"
            placeholder="Search staff by name or email..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full text-xs outline-none bg-transparent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[0.62rem] font-extrabold uppercase tracking-wider text-[#637085]">
              Role
            </span>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="border border-[#012770]/10 p-2 text-xs focus:border-[#ED7D01] focus:outline-none bg-white font-extrabold text-[#012770]"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="staff">Staff</option>
              <option value="user">User</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[0.62rem] font-extrabold uppercase tracking-wider text-[#637085]">
              Status
            </span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-[#012770]/10 p-2 text-xs focus:border-[#ED7D01] focus:outline-none bg-white font-extrabold text-[#012770]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {filtered.map(member => (
          <div
            key={member.id}
            className={`bg-white p-5 border shadow-sm transition-all duration-200 flex flex-col justify-between min-h-[220px] ${
              member.isActive
                ? "border-[#012770]/5"
                : "border-red-200 bg-red-50/10"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center bg-[#012770] text-[0.65rem] font-extrabold text-white">
                  {(member.fullName || member.email)
                    .split(" ")
                    .slice(0, 2)
                    .map(part => part[0])
                    .join("")
                    .toUpperCase()}
                </span>

                {isAdminUser && member.id !== currentUserProfile?.id ? (
                  <button
                    type="button"
                    onClick={() =>
                      handleStatusToggle(member.id, member.isActive)
                    }
                    className={`admin-status cursor-pointer ${
                      member.isActive
                        ? "available hover:bg-emerald-600 hover:text-white"
                        : "muted hover:bg-red-600 hover:text-white"
                    }`}
                  >
                    {member.isActive ? "Active" : "Inactive"}
                  </button>
                ) : (
                  <span
                    className={`admin-status ${member.isActive ? "available" : "muted"}`}
                  >
                    {member.isActive ? "Active" : "Inactive"}
                  </span>
                )}
              </div>
              <h3
                className="mt-5 text-[0.9rem] font-extrabold text-[#012770] truncate"
                title={member.fullName || "Unnamed User"}
              >
                {member.fullName || "Unnamed User"}
              </h3>
              <p
                className="mt-1 text-[0.67rem] text-[#637085] truncate"
                title={member.email}
              >
                {member.email}
              </p>
            </div>

            <div className="mt-5 border-t border-[#012770]/10 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-[0.58rem] font-extrabold uppercase tracking-wider text-[#637085]">
                  Role
                </span>

                {isAdminUser && member.id !== currentUserProfile?.id ? (
                  <select
                    value={member.role}
                    onChange={e => handleRoleChange(member.id, e.target.value)}
                    className="border border-[#012770]/10 p-1.5 text-[0.68rem] focus:border-[#ED7D01] focus:outline-none bg-white font-extrabold text-[#ED7D01] uppercase tracking-wider"
                  >
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="staff">Staff</option>
                    <option value="user">User</option>
                  </select>
                ) : (
                  <span className="text-[0.61rem] font-extrabold uppercase tracking-[0.12em] text-[#ED7D01]">
                    {member.role}
                  </span>
                )}
              </div>

              {isAdminUser &&
                member.role !== "user" &&
                member.id !== currentUserProfile?.id && (
                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveStaff(
                        member.id,
                        member.fullName || member.email
                      )
                    }
                    className="mt-3 w-full border border-red-200 bg-red-50 py-2 text-[0.62rem] font-extrabold uppercase tracking-wider text-red-700 hover:bg-red-700 hover:text-white hover:border-red-700 transition-colors font-bold"
                  >
                    Remove from Staff
                  </button>
                )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <EmptyState label="No staff directory profiles match these filters." />
      )}

      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#f4f1ea] p-8 shadow-2xl border border-[#012770]/10">
            <h3 className="display-serif text-2xl text-[#012770] border-b border-[#012770]/10 pb-3">
              Invite Staff Member
            </h3>
            <div className="mt-4 text-xs text-[#637085] space-y-4 leading-relaxed">
              <p>
                To maintain database integrity and authentication security, user
                registration uses self-registration.
              </p>
              <div className="bg-white border border-[#012770]/5 p-4 space-y-2">
                <p className="font-extrabold text-[#012770]">Instructions:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>
                    Send the user the registration link:
                    <code className="mt-1 block bg-[#012770]/5 p-1.5 font-mono text-[0.62rem] text-[#012770] break-all select-all font-extrabold">
                      {typeof window !== "undefined"
                        ? window.location.origin
                        : ""}
                      /admin/register
                    </code>
                  </li>
                  <li>
                    Once signed up, their account profile will automatically
                    appear in this list under the{" "}
                    <span className="font-extrabold text-[#ED7D01]">User</span>{" "}
                    role.
                  </li>
                  <li>
                    Find their card and promote them to{" "}
                    <span className="font-extrabold text-[#ED7D01]">Staff</span>
                    ,{" "}
                    <span className="font-extrabold text-[#ED7D01]">
                      Editor
                    </span>
                    , or{" "}
                    <span className="font-extrabold text-[#ED7D01]">Admin</span>
                    .
                  </li>
                </ol>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="admin-primary text-xs"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SHARED COMPONENTS
// ============================================================================

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
      setError(
        "Supabase is not configured. Please set up VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file."
      );
      return;
    }

    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
      if (
        error.message.toLowerCase().includes("email not confirmed") ||
        error.message.toLowerCase().includes("confirm your email")
      ) {
        setError(
          "Your email address has not been confirmed yet. Please verify your email inbox or contact your administrator."
        );
      } else {
        setError(error.message);
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#012770] px-5 py-12">
      <div className="w-full max-w-md bg-white p-7 shadow-[0_25px_70px_rgba(0,0,0,0.22)] sm:p-10">
        <div className="flex items-center justify-between">
          <div className="text-xl font-extrabold text-[#012770]">
            ConcordVest
          </div>
          <span className="border border-[#ED7D01] px-2 py-1 text-[0.54rem] font-extrabold uppercase tracking-[0.14em] text-[#ED7D01]">
            Staff only
          </span>
        </div>

        <div className="mt-12">
          <p className="eyebrow">Concordvest admin</p>
          <h1 className="display-serif mt-5 text-[3.5rem] leading-[0.9] text-[#012770]">
            Sign in to the workspace.
          </h1>
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
            {isLoading ? (
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            ) : (
              "Enter workspace ↗"
            )}
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

function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-6 border-b border-[#012770]/12 pb-7 sm:flex-row sm:items-end">
      <div>
        <p className="admin-eyebrow">{eyebrow}</p>
        <h1 className="mt-3 text-[2.5rem] font-extrabold tracking-[-0.06em] text-[#012770] sm:text-[3.6rem]">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-[0.78rem] leading-[1.7] text-[#637085]">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  action,
  light = false,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
  light?: boolean;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className={`admin-eyebrow ${light ? "text-[#ED7D01]" : ""}`}>
          {eyebrow}
        </p>
        <h2
          className={`mt-2 text-[1.5rem] font-extrabold tracking-[-0.04em] ${light ? "text-white" : "text-[#012770]"}`}
        >
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

function Toolbar({
  query,
  setQuery,
  label,
}: {
  query: string;
  setQuery: (value: string) => void;
  label: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <label className="flex max-w-sm items-center gap-3 border border-[#012770]/12 bg-white px-4 py-3">
        <Search size={15} className="text-[#637085]" />
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search the workspace"
          className="w-full bg-transparent text-[0.72rem] outline-none placeholder:text-[#637085]/60"
        />
      </label>
      <span className="text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-[#637085]">
        {label}
      </span>
    </div>
  );
}

function LeadRow({
  lead,
}: {
  lead: {
    id: string;
    name: string;
    interestType: string;
    property?: string;
    service?: string;
    status: string;
    date: string;
  };
}) {
  return (
    <div className="flex flex-col justify-between gap-3 border-b border-[#012770]/10 py-4 last:border-0 sm:flex-row sm:items-center">
      <div>
        <p className="text-[0.76rem] font-extrabold text-[#012770]">
          {lead.name}
        </p>
        <p className="mt-1 text-[0.66rem] text-[#637085]">
          {lead.interestType} ·{" "}
          {lead.property || lead.service || "General enquiry"}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[0.61rem] text-[#637085]">
          {new Date(lead.date).toLocaleDateString()}
        </span>
        <span
          className={`admin-status ${lead.status === "New" ? "new" : lead.status === "Converted" ? "available" : "muted"}`}
        >
          {lead.status}
        </span>
      </div>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center border border-[#012770]/12 text-[#637085] hover:border-[#ED7D01] hover:text-[#012770]"
    >
      {children}
    </button>
  );
}

function AdminField({
  label,
  value,
  onChange,
  type = "text",
  required,
  as = "input",
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  as?: "input" | "textarea";
  disabled?: boolean;
}) {
  return (
    <label className="form-label">
      {label}
      {as === "textarea" ? (
        <textarea
          required={required}
          value={value}
          onChange={event => onChange(event.target.value)}
          disabled={disabled}
          className="form-input min-h-24 resize-y"
        />
      ) : (
        <input
          required={required}
          type={type}
          value={value}
          onChange={event => onChange(event.target.value)}
          disabled={disabled}
          className="form-input"
        />
      )}
    </label>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#012770]/60 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto bg-white p-6 shadow-[0_25px_80px_rgba(1,39,112,0.25)] sm:p-9">
        <div className="flex items-center justify-between border-b border-[#012770]/12 pb-5">
          <div>
            <p className="admin-eyebrow">Property editor</p>
            <h2 className="mt-2 text-[1.6rem] font-extrabold tracking-[-0.04em] text-[#012770]">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center border border-[#012770]/12 text-[#012770]"
          >
            <X size={16} />
          </button>
        </div>
        <div className="mt-7">{children}</div>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="p-12 text-center text-[0.75rem] text-[#637085]">
      {label}
    </div>
  );
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
