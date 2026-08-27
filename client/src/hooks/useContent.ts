/**
 * ConcordVest Content Data Hooks
 * 
 * Provides hooks for fetching and managing projects, services, and articles from Supabase.
 * Falls back to demo data when Supabase is not configured.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConfigured, type Project, type Service, type Article, type ProjectInsert, type ServiceInsert, type ArticleInsert } from "@/lib/supabase";
import { projects, articles, type ProjectRecord, type ArticleRecord } from "@/lib/content";
import { servicePackages, customService, type ServicePackage } from "@/lib/services";

// ============================================================================
// PROJECTS
// ============================================================================

// Convert ProjectRecord (demo) to Project (database format)
export function projectRecordToDb(record: ProjectRecord): ProjectInsert {
  return {
    id: record.id,
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
    is_featured: false,
    is_published: true,
  };
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
        filtered = filtered.filter(p => p.category.includes(filters.category as ProjectRecord["category"][number]));
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
      setError(err instanceof Error ? err : new Error("Failed to fetch projects"));
      setData(projects);
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

// ============================================================================
// SERVICES
// ============================================================================

// Convert ServicePackage (demo) to Service (database format)
export function servicePackageToDb(pkg: ServicePackage): ServiceInsert {
  return {
    id: pkg.id,
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
    is_published: true,
  };
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
export function articleRecordToDb(record: ArticleRecord): ArticleInsert {
  return {
    id: record.id,
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
    is_published: true,
    is_featured: false,
  };
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
    content: article.content,
    serviceSlugs: article.service_slugs,
    projectSlugs: article.project_slugs,
    propertyLink: article.property_link || undefined,
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
      setError(err instanceof Error ? err : new Error("Failed to fetch articles"));
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
