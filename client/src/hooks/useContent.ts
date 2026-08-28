/**
 * ConcordVest Content Data Hooks
 *
 * Provides hooks for fetching and managing projects, services, and articles from Supabase.
 * Falls back to demo data when Supabase is not configured.
 */

import { useState, useEffect, useCallback } from "react";
import {
  supabase,
  isSupabaseConfigured,
  type Project,
  type Service,
  type Article,
  type ProjectInsert,
  type ServiceInsert,
  type ArticleInsert,
  type ProjectUpdate,
  type ServiceUpdate,
  type ArticleUpdate,
} from "@/lib/supabase";
import {
  projects,
  articles,
  type ProjectRecord,
  type ArticleRecord,
} from "@/lib/content";
import {
  servicePackages,
  customService,
  type ServicePackage,
  calculateNextServiceNumber,
  calculateNextSortOrder,
  renumberServices,
} from "@/lib/services";
import { deleteProjectImage } from "@/lib/projectStorage";
import { deleteArticleImage } from "@/lib/articleStorage";

// ============================================================================
// PROJECTS
// ============================================================================

// Convert ProjectRecord (demo) to Project (database format)
// For new projects, omit the id field to let PostgreSQL generate a UUID
export function projectRecordToDb(
  record: Partial<ProjectRecord>,
  isNew: boolean = false
): ProjectInsert {
  const dbRecord: ProjectInsert = {
    title: record.title || "",
    slug: record.slug || "",
    location: record.location || "",
    type: record.type || "",
    category: record.category || [],
    description: record.description || "",
    hero_image: record.heroImage || "",
    before_images: record.beforeImages || [],
    during_images: record.duringImages || [],
    after_images: record.afterImages || [],
    services: record.services || [],
    service_slugs: record.serviceSlugs || [],
    materials: record.materials || [],
    challenges: record.challenges || [],
    outcome: record.outcome || "",
    related_project_slugs: record.relatedProjectSlugs || [],
    is_featured: record.isFeatured ?? false,
    is_published: record.isPublished ?? true,
  };

  // Only include id if it's a valid UUID (for updates), not for new records
  if (
    !isNew &&
    record.id &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      record.id
    )
  ) {
    dbRecord.id = record.id;
  }

  return dbRecord;
}

// Convert Project (database) to ProjectRecord (app format)
export function projectDbToRecord(project: Project): ProjectRecord {
  return {
    id: project.id,
    slug: project.slug,
    title: project.title,
    location: project.location,
    type: project.type,
    category: project.category as ProjectRecord["category"],
    description: project.description,
    heroImage: project.hero_image,
    beforeImages: project.before_images,
    duringImages: project.during_images,
    afterImages: project.after_images,
    services: project.services,
    serviceSlugs: project.service_slugs,
    materials: project.materials,
    challenges: project.challenges,
    outcome: project.outcome,
    relatedProjectSlugs: project.related_project_slugs,
    isFeatured: project.is_featured,
    isPublished: project.is_published,
  };
}

// Fetch all published projects
export function useProjects(filters?: { category?: string }): {
  projects: ProjectRecord[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<ProjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      let filtered = [...projects];
      if (filters?.category && filters.category !== "All Projects") {
        filtered = filtered.filter(p =>
          p.category.includes(
            filters.category as ProjectRecord["category"][number]
          )
        );
      }
      setData(filtered);
      setIsLoading(false);
      return;
    }

    try {
      let query = supabase
        .from("projects")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (filters?.category && filters.category !== "All Projects") {
        query = query.contains("category", [filters.category]);
      }

      const { data: result, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setData((result || []).map(projectDbToRecord));
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch projects")
      );
      if (process.env.NODE_ENV !== "production") {
        setData(projects);
      }
    } finally {
      setIsLoading(false);
    }
  }, [filters?.category]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { projects: data, isLoading, error, refetch: fetchData };
}

// Fetch a single project by slug
export function useProject(slug: string | undefined): {
  project: ProjectRecord | null;
  isLoading: boolean;
  error: Error | null;
} {
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!slug) {
      setProject(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    if (!isSupabaseConfigured()) {
      setProject(projects.find(p => p.slug === slug) || null);
      setIsLoading(false);
      return;
    }

    supabase
      .from("projects")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .single()
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setProject(projects.find(p => p.slug === slug) || null);
        } else if (data) {
          setProject(projectDbToRecord(data));
        } else {
          setProject(null);
        }
        setIsLoading(false);
      });
  }, [slug]);

  return { project, isLoading, error };
}

// Admin: Fetch all projects (including unpublished)
export function useAdminProjects(): {
  projects: ProjectRecord[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createProject: (
    project: ProjectInsert | ProjectRecord
  ) => Promise<{ data: Project | null; error: Error | null }>;
  updateProject: (
    id: string,
    updates: ProjectUpdate | ProjectRecord
  ) => Promise<{ error: Error | null }>;
  deleteProject: (id: string) => Promise<{ error: Error | null }>;
} {
  const [data, setData] = useState<ProjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      setData(projects);
      setIsLoading(false);
      return;
    }

    try {
      const { data: result, error: fetchError } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setData((result || []).map(projectDbToRecord));
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch admin projects")
      );
      setData(projects);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = useCallback(
    async (
      project: ProjectInsert | ProjectRecord
    ): Promise<{ data: Project | null; error: Error | null }> => {
      if (!isSupabaseConfigured()) {
        const newProj = {
          ...projectRecordToDb(project as unknown as ProjectRecord, true),
          id: `cv-${Date.now()}`,
        } as unknown as Project;
        setData(prev => [projectDbToRecord(newProj), ...prev]);
        return { data: newProj, error: null };
      }

      try {
        const dbProject =
          "heroImage" in project
            ? projectRecordToDb(project as ProjectRecord, true)
            : (project as ProjectInsert);

        const { data: created, error: createError } = await supabase
          .from("projects")
          .insert(dbProject as never)
          .select()
          .single();

        if (createError) {
          return { data: null, error: new Error(createError.message) };
        }

        await fetchProjects();
        return { data: created, error: null };
      } catch (err) {
        return {
          data: null,
          error:
            err instanceof Error ? err : new Error("Failed to create project"),
        };
      }
    },
    [fetchProjects]
  );

  const updateProject = useCallback(
    async (
      id: string,
      updates: ProjectUpdate | ProjectRecord
    ): Promise<{ error: Error | null }> => {
      if (!isSupabaseConfigured()) {
        setData(prev =>
          prev.map(p =>
            p.id === id ? ({ ...p, ...updates } as ProjectRecord) : p
          )
        );
        return { error: null };
      }

      try {
        let dbUpdates: ProjectUpdate;

        if ("heroImage" in updates) {
          const record = updates as ProjectRecord;
          dbUpdates = {
            title: record.title,
            slug: record.slug,
            location: record.location,
            type: record.type,
            category: record.category,
            description: record.description,
            hero_image: record.heroImage,
            before_images: record.beforeImages,
            during_images: record.duringImages,
            after_images: record.afterImages,
            services: record.services,
            service_slugs: record.serviceSlugs,
            materials: record.materials,
            challenges: record.challenges,
            outcome: record.outcome,
            related_project_slugs: record.relatedProjectSlugs,
            is_featured: record.isFeatured,
            is_published: record.isPublished,
            updated_at: new Date().toISOString(),
          };
        } else {
          dbUpdates = {
            ...updates,
            updated_at: new Date().toISOString(),
          } as ProjectUpdate;
        }

        const { error: updateError } = await supabase
          .from("projects")
          .update(dbUpdates as never)
          .eq("id", id);

        if (updateError) {
          return { error: new Error(updateError.message) };
        }

        await fetchProjects();
        return { error: null };
      } catch (err) {
        return {
          error:
            err instanceof Error ? err : new Error("Failed to update project"),
        };
      }
    },
    [fetchProjects]
  );

  const deleteProject = useCallback(
    async (id: string): Promise<{ error: Error | null }> => {
      if (!isSupabaseConfigured()) {
        setData(prev => prev.filter(p => p.id !== id));
        return { error: null };
      }

      try {
        // Fetch project details first for storage cleanup
        const { data } = await supabase
          .from("projects")
          .select("hero_image, before_images, during_images, after_images")
          .eq("id", id)
          .single();
        const projData = data as any;

        // Delete from database
        const { error: deleteError } = await supabase
          .from("projects")
          .delete()
          .eq("id", id);

        if (deleteError) {
          return { error: new Error(deleteError.message) };
        }

        // Clean up storage images in the background if deletion succeeded
        if (projData) {
          const imageUrls = [
            projData.hero_image,
            ...(projData.before_images || []),
            ...(projData.during_images || []),
            ...(projData.after_images || []),
          ].filter(Boolean);

          for (const url of imageUrls) {
            await deleteProjectImage(url).catch(err => {
              console.error(
                `Failed to clean up storage image on project delete:`,
                err
              );
            });
          }
        }

        await fetchProjects();
        return { error: null };
      } catch (err) {
        return {
          error:
            err instanceof Error ? err : new Error("Failed to delete project"),
        };
      }
    },
    [fetchProjects]
  );

  return {
    projects: data,
    isLoading,
    error,
    refetch: fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
}

// ============================================================================
// SERVICES
// ============================================================================

// Convert ServicePackage (demo) to Service (database format)
// For new services, omit the id field to let PostgreSQL generate a UUID
export function servicePackageToDb(
  pkg: ServicePackage,
  isNew: boolean = false
): ServiceInsert {
  const dbRecord: ServiceInsert = {
    number: pkg.number,
    slug: pkg.slug,
    name: pkg.name,
    short_description: pkg.shortDescription,
    overview: pkg.overview,
    problems_solved: pkg.problemsSolved,
    includes: pkg.includes,
    process: pkg.process,
    timeline: pkg.timeline,
    image: pkg.image,
    related_project_image: pkg.relatedProjectImage,
    tags: pkg.tags,
    is_published: pkg.isPublished ?? true,
    sort_order: pkg.sortOrder ?? 0,
  };

  // Only include id if it's a valid UUID (for updates), not for new records
  if (
    !isNew &&
    pkg.id &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      pkg.id
    )
  ) {
    dbRecord.id = pkg.id;
  }

  return dbRecord;
}

// Convert Service (database) to ServicePackage (app format)
export function serviceDbToPackage(service: Service): ServicePackage {
  return {
    id: service.id,
    number: service.number,
    slug: service.slug,
    name: service.name,
    shortDescription: service.short_description,
    overview: service.overview,
    problemsSolved: service.problems_solved,
    includes: service.includes,
    process: service.process,
    timeline: service.timeline,
    image: service.image,
    relatedProjectImage: service.related_project_image,
    tags: service.tags,
    isPublished: service.is_published,
    sortOrder: service.sort_order,
  };
}

// Fetch all services
export function useServices(): {
  services: ServicePackage[];
  customService: ServicePackage;
  isLoading: boolean;
  error: Error | null;
} {
  const [data, setData] = useState<ServicePackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setData(servicePackages);
      setIsLoading(false);
      return;
    }

    supabase
      .from("services")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .then(({ data: result, error: fetchError }) => {
        if (fetchError) {
          setError(new Error(fetchError.message));
          setData(servicePackages);
        } else {
          setData((result || []).map(serviceDbToPackage));
        }
        setIsLoading(false);
      });
  }, []);

  return { services: data, customService, isLoading, error };
}

// Admin: Fetch all services (including unpublished)
export function useAdminServices(): {
  services: ServicePackage[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createService: (
    service: ServiceInsert | ServicePackage
  ) => Promise<{ data: Service | null; error: Error | null }>;
  updateService: (
    id: string,
    updates: ServiceUpdate | ServicePackage
  ) => Promise<{ error: Error | null }>;
  deleteService: (id: string) => Promise<{ error: Error | null }>;
} {
  const [data, setData] = useState<ServicePackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      setData(servicePackages);
      setIsLoading(false);
      return;
    }

    try {
      const { data: result, error: fetchError } = await supabase
        .from("services")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setData((result || []).map(serviceDbToPackage));
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch admin services")
      );
      setData(servicePackages);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const createService = useCallback(
    async (
      service: ServiceInsert | ServicePackage
    ): Promise<{ data: Service | null; error: Error | null }> => {
      if (!isSupabaseConfigured()) {
        const latestNumbers = data.map(s => s.number);
        const latestOrders = data.map(s => s.sortOrder ?? 0);
        const finalNumber = calculateNextServiceNumber(latestNumbers);
        const finalSortOrder = calculateNextSortOrder(latestOrders);

        const pkg = service as ServicePackage;
        const newPkg = {
          ...servicePackageToDb(
            {
              ...pkg,
              number: finalNumber,
              sortOrder: finalSortOrder,
            },
            true
          ),
          id: `cv-${Date.now()}`,
        } as unknown as Service;
        setData(prev => [...prev, serviceDbToPackage(newPkg)]);
        return { data: newPkg, error: null };
      }

      try {
        const { data: latestResult, error: fetchError } = await supabase
          .from("services")
          .select("*");

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        const latestNumbers = ((latestResult || []) as Service[]).map(
          r => r.number
        );
        const latestOrders = ((latestResult || []) as Service[]).map(
          r => r.sort_order
        );
        const finalNumber = calculateNextServiceNumber(latestNumbers);
        const finalSortOrder = calculateNextSortOrder(latestOrders);

        const dbService =
          "shortDescription" in service
            ? servicePackageToDb(
                {
                  ...(service as ServicePackage),
                  number: finalNumber,
                  sortOrder: finalSortOrder,
                },
                true
              )
            : ({
                ...(service as any),
                number: finalNumber,
                sort_order: finalSortOrder,
              } as ServiceInsert);

        const { data: created, error: createError } = await supabase
          .from("services")
          .insert(dbService as never)
          .select()
          .single();

        if (createError) {
          return { data: null, error: new Error(createError.message) };
        }

        await fetchServices();
        return { data: created, error: null };
      } catch (err) {
        return {
          data: null,
          error:
            err instanceof Error ? err : new Error("Failed to create service"),
        };
      }
    },
    [data, fetchServices]
  );

  const updateService = useCallback(
    async (
      id: string,
      updates: ServiceUpdate | ServicePackage
    ): Promise<{ error: Error | null }> => {
      if (!isSupabaseConfigured()) {
        setData(prev =>
          prev.map(p => {
            if (p.id === id) {
              const updated = { ...p, ...updates } as any;
              if ("is_published" in updates) {
                updated.isPublished = updates.is_published;
                delete updated.is_published;
              }
              if ("sort_order" in updates) {
                updated.sortOrder = updates.sort_order;
                delete updated.sort_order;
              }
              return updated as ServicePackage;
            }
            return p;
          })
        );
        return { error: null };
      }

      try {
        let dbUpdates: ServiceUpdate;

        if ("shortDescription" in updates) {
          const pkg = updates as ServicePackage;
          dbUpdates = {
            number: pkg.number,
            slug: pkg.slug,
            name: pkg.name,
            short_description: pkg.shortDescription,
            overview: pkg.overview,
            problems_solved: pkg.problemsSolved,
            includes: pkg.includes,
            process: pkg.process,
            timeline: pkg.timeline,
            image: pkg.image,
            related_project_image: pkg.relatedProjectImage,
            tags: pkg.tags,
            is_published: pkg.isPublished,
            sort_order: pkg.sortOrder,
            updated_at: new Date().toISOString(),
          };
        } else {
          dbUpdates = {
            ...updates,
            updated_at: new Date().toISOString(),
          } as ServiceUpdate;
        }

        const { error: updateError } = await supabase
          .from("services")
          .update(dbUpdates as never)
          .eq("id", id);

        if (updateError) {
          return { error: new Error(updateError.message) };
        }

        await fetchServices();
        return { error: null };
      } catch (err) {
        return {
          error:
            err instanceof Error ? err : new Error("Failed to update service"),
        };
      }
    },
    [fetchServices]
  );

  const deleteService = useCallback(
    async (id: string): Promise<{ error: Error | null }> => {
      if (!isSupabaseConfigured()) {
        const remaining = data.filter(p => p.id !== id);
        const renumbered = renumberServices(remaining);
        setData(renumbered);
        return { error: null };
      }

      try {
        const { error: deleteError } = await supabase
          .from("services")
          .delete()
          .eq("id", id);

        if (deleteError) {
          return { error: new Error(deleteError.message) };
        }

        const { data: latestResult, error: fetchError } = await supabase
          .from("services")
          .select("*")
          .order("sort_order", { ascending: true });

        if (fetchError) {
          await fetchServices();
          return {
            error: new Error(
              `Deletion succeeded, but fetching remaining services failed: ${fetchError.message}`
            ),
          };
        }

        const remainingPackages = ((latestResult || []) as Service[]).map(
          serviceDbToPackage
        );
        const renumberedPackages = renumberServices(remainingPackages);

        const updatePromises = renumberedPackages.map(srv => {
          const original = remainingPackages.find(p => p.id === srv.id);
          if (
            original &&
            (original.number !== srv.number ||
              original.sortOrder !== srv.sortOrder)
          ) {
            return supabase
              .from("services")
              .update({
                number: srv.number,
                sort_order: srv.sortOrder,
                updated_at: new Date().toISOString(),
              } as never)
              .eq("id", srv.id);
          }
          return Promise.resolve({ error: null });
        });

        const updateResults = await Promise.all(updatePromises);
        const firstUpdateError = updateResults.find(r => r.error);

        if (firstUpdateError && firstUpdateError.error) {
          await fetchServices();
          return {
            error: new Error(
              `Deletion succeeded but renumbering remaining services failed. Please refresh. Error: ${firstUpdateError.error.message}`
            ),
          };
        }

        await fetchServices();
        return { error: null };
      } catch (err) {
        await fetchServices();
        return {
          error:
            err instanceof Error ? err : new Error("Failed to delete service"),
        };
      }
    },
    [data, fetchServices]
  );

  return {
    services: data,
    isLoading,
    error,
    refetch: fetchServices,
    createService,
    updateService,
    deleteService,
  };
}

// Fetch a single service by slug
export function useService(slug: string | undefined): {
  service: ServicePackage | null;
  isLoading: boolean;
  error: Error | null;
} {
  const [service, setService] = useState<ServicePackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!slug) {
      setService(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Check for custom service
    if (slug === customService.slug) {
      setService(customService);
      setIsLoading(false);
      return;
    }

    if (!isSupabaseConfigured()) {
      setService(servicePackages.find(s => s.slug === slug) || null);
      setIsLoading(false);
      return;
    }

    supabase
      .from("services")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .single()
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setService(servicePackages.find(s => s.slug === slug) || null);
        } else if (data) {
          setService(serviceDbToPackage(data));
        } else {
          setService(null);
        }
        setIsLoading(false);
      });
  }, [slug]);

  return { service, isLoading, error };
}

// ============================================================================
// ARTICLES
// ============================================================================

// Convert ArticleRecord (demo) to Article (database format)
// For new articles, omit the id field to let PostgreSQL generate a UUID
export function articleRecordToDb(
  record: ArticleRecord,
  isNew: boolean = false
): ArticleInsert {
  const dbRecord: ArticleInsert = {
    title: record.title,
    slug: record.slug,
    category: record.category,
    excerpt: record.excerpt,
    content: record.content,
    hero_image: record.heroImage,
    read_time: record.readTime,
    date: record.date,
    service_slugs: record.serviceSlugs,
    project_slugs: record.projectSlugs,
    property_link: record.propertyLink || null,
    is_published: record.isPublished ?? false,
    is_featured: record.isFeatured ?? false,
  };

  // Only include id if it's a valid UUID (for updates), not for new records
  if (
    !isNew &&
    record.id &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      record.id
    )
  ) {
    dbRecord.id = record.id;
  }

  return dbRecord;
}

// Convert Article (database) to ArticleRecord (app format)
export function articleDbToRecord(article: Article): ArticleRecord {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    category: article.category,
    date: article.date,
    excerpt: article.excerpt,
    heroImage: article.hero_image,
    readTime: article.read_time,
    content: (article.content as any) || [],
    serviceSlugs: article.service_slugs || [],
    projectSlugs: article.project_slugs || [],
    propertyLink: article.property_link || undefined,
    isPublished: article.is_published,
    isFeatured: article.is_featured,
  };
}

// Fetch all published articles
export function useArticles(filters?: { category?: string }): {
  articles: ArticleRecord[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<ArticleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      let filtered = [...articles];
      if (filters?.category && filters.category !== "All Inspiration") {
        filtered = filtered.filter(a => a.category === filters.category);
      }
      setData(filtered);
      setIsLoading(false);
      return;
    }

    try {
      let query = supabase
        .from("articles")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });

      if (filters?.category && filters.category !== "All Inspiration") {
        query = query.eq("category", filters.category);
      }

      const { data: result, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setData((result || []).map(articleDbToRecord));
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch articles")
      );
      setData(articles);
    } finally {
      setIsLoading(false);
    }
  }, [filters?.category]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { articles: data, isLoading, error, refetch: fetchData };
}

// Fetch all articles (published and drafts) for admin dashboard
export function useAdminArticles(): {
  articles: ArticleRecord[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createArticle: (
    article: ArticleInsert | ArticleRecord
  ) => Promise<{ data: Article | null; error: Error | null }>;
  updateArticle: (
    id: string,
    updates: ArticleUpdate | ArticleRecord
  ) => Promise<{ error: Error | null }>;
  deleteArticle: (id: string) => Promise<{ error: Error | null }>;
} {
  const [data, setData] = useState<ArticleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchArticles = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      setData(articles);
      setIsLoading(false);
      return;
    }

    try {
      const { data: result, error: fetchError } = await supabase
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setData((result || []).map(articleDbToRecord));
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch admin articles")
      );
      setData(articles);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const createArticle = useCallback(
    async (
      article: ArticleInsert | ArticleRecord
    ): Promise<{ data: Article | null; error: Error | null }> => {
      if (!isSupabaseConfigured()) {
        const pkg = article as ArticleRecord;
        const newPkg = {
          ...articleRecordToDb(pkg, true),
          id: `cv-art-${Date.now()}`,
          date: new Date().toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
        } as unknown as Article;
        setData(prev => [articleDbToRecord(newPkg), ...prev]);
        return { data: newPkg, error: null };
      }

      try {
        const dbArticle =
          "excerpt" in article
            ? articleRecordToDb(article as ArticleRecord, true)
            : (article as ArticleInsert);

        // Omit id from insert and let Supabase handle it
        delete dbArticle.id;

        // Automatically set today's date if not set
        if (!dbArticle.date) {
          dbArticle.date = new Date().toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          });
        }

        const { data: created, error: createError } = await supabase
          .from("articles")
          .insert(dbArticle as never)
          .select()
          .single();

        if (createError) {
          return { data: null, error: new Error(createError.message) };
        }

        await fetchArticles();
        return { data: created, error: null };
      } catch (err) {
        return {
          data: null,
          error:
            err instanceof Error ? err : new Error("Failed to create article"),
        };
      }
    },
    [fetchArticles]
  );

  const updateArticle = useCallback(
    async (
      id: string,
      updates: ArticleUpdate | ArticleRecord
    ): Promise<{ error: Error | null }> => {
      if (!isSupabaseConfigured()) {
        setData(prev =>
          prev.map(p => {
            if (p.id === id) {
              const updated = { ...p, ...updates } as any;
              if ("is_published" in updates) {
                updated.isPublished = updates.is_published;
                delete updated.is_published;
              }
              if ("is_featured" in updates) {
                updated.isFeatured = updates.is_featured;
                delete updated.is_featured;
              }
              return updated as ArticleRecord;
            }
            return p;
          })
        );
        return { error: null };
      }

      try {
        let dbUpdates: ArticleUpdate;

        if ("excerpt" in updates) {
          const record = updates as ArticleRecord;
          dbUpdates = {
            title: record.title,
            slug: record.slug,
            category: record.category,
            excerpt: record.excerpt,
            content: record.content as any,
            hero_image: record.heroImage,
            read_time: record.readTime,
            date: record.date,
            service_slugs: record.serviceSlugs,
            project_slugs: record.projectSlugs,
            property_link: record.propertyLink || null,
            is_published: record.isPublished,
            is_featured: record.isFeatured,
            updated_at: new Date().toISOString(),
          };

          if (record.isPublished) {
            dbUpdates.published_at = new Date().toISOString();
          }
        } else {
          dbUpdates = {
            ...updates,
            updated_at: new Date().toISOString(),
          } as ArticleUpdate;

          if (updates.is_published) {
            dbUpdates.published_at = new Date().toISOString();
          }
        }

        const { error: updateError } = await supabase
          .from("articles")
          .update(dbUpdates as never)
          .eq("id", id);

        if (updateError) {
          return { error: new Error(updateError.message) };
        }

        await fetchArticles();
        return { error: null };
      } catch (err) {
        return {
          error:
            err instanceof Error ? err : new Error("Failed to update article"),
        };
      }
    },
    [fetchArticles]
  );

  const deleteArticle = useCallback(
    async (id: string): Promise<{ error: Error | null }> => {
      if (!isSupabaseConfigured()) {
        setData(prev => prev.filter(p => p.id !== id));
        return { error: null };
      }

      try {
        // Fetch article details first for storage cleanup
        const { data } = await supabase
          .from("articles")
          .select("hero_image")
          .eq("id", id)
          .single();
        const artData = data as any;

        // Delete from database
        const { error: deleteError } = await supabase
          .from("articles")
          .delete()
          .eq("id", id);

        if (deleteError) {
          return { error: new Error(deleteError.message) };
        }

        // Clean up storage image in the background if deletion succeeded
        if (artData?.hero_image) {
          await deleteArticleImage(artData.hero_image).catch(err => {
            console.error(
              `Failed to clean up storage image on article delete:`,
              err
            );
          });
        }

        await fetchArticles();
        return { error: null };
      } catch (err) {
        return {
          error:
            err instanceof Error ? err : new Error("Failed to delete article"),
        };
      }
    },
    [fetchArticles]
  );

  return {
    articles: data,
    isLoading,
    error,
    refetch: fetchArticles,
    createArticle,
    updateArticle,
    deleteArticle,
  };
}

// Fetch a single article by slug
export function useArticle(slug: string | undefined): {
  article: ArticleRecord | null;
  isLoading: boolean;
  error: Error | null;
} {
  const [article, setArticle] = useState<ArticleRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!slug) {
      setArticle(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    if (!isSupabaseConfigured()) {
      setArticle(articles.find(a => a.slug === slug) || null);
      setIsLoading(false);
      return;
    }

    supabase
      .from("articles")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .single()
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setArticle(articles.find(a => a.slug === slug) || null);
        } else if (data) {
          setArticle(articleDbToRecord(data));
        } else {
          setArticle(null);
        }
        setIsLoading(false);
      });
  }, [slug]);

  return { article, isLoading, error };
}
