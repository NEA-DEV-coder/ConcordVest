/**
 * ConcordVest Admin Media Management Hook
 *
 * Recursively crawls properties, projects, and articles storage buckets,
 * cross-references assets with active database records to scan usage status,
 * and provides deletion capabilities for orphaned files.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { demoProperties } from "@/lib/properties";
import {
  projects as demoProjects,
  articles as demoArticles,
} from "@/lib/content";

export interface MediaAsset {
  name: string;
  path: string; // e.g. "folder/filename.jpg"
  bucket: "properties" | "projects" | "articles";
  url: string;
  size: number; // in bytes
  createdAt: string;
  referencedBy: {
    type: "property" | "project" | "article";
    id: string;
    title: string;
  } | null;
}

export function useMedia(): {
  assets: MediaAsset[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  deleteAsset: (
    bucket: "properties" | "projects" | "articles",
    path: string
  ) => Promise<{ error: Error | null }>;
} {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      // Demo mode fallback: build virtual assets from demo data
      const mockAssets: MediaAsset[] = [];

      // Add property images
      demoProperties.forEach(p => {
        (p.images || []).forEach((imgUrl, i) => {
          mockAssets.push({
            name: `${p.slug}-image-${i + 1}.jpg`,
            path: `demo/${p.id}/${p.slug}-${i + 1}.jpg`,
            bucket: "properties",
            url: imgUrl,
            size: 1540200,
            createdAt: new Date().toISOString(),
            referencedBy: { type: "property", id: p.id, title: p.title },
          });
        });
      });

      // Add project images
      demoProjects.forEach(proj => {
        if (proj.heroImage) {
          mockAssets.push({
            name: `${proj.slug}-hero.jpg`,
            path: `demo/${proj.id}/${proj.slug}-hero.jpg`,
            bucket: "projects",
            url: proj.heroImage,
            size: 2100400,
            createdAt: new Date().toISOString(),
            referencedBy: { type: "project", id: proj.id, title: proj.title },
          });
        }
      });

      // Add article images
      demoArticles.forEach(art => {
        if (art.heroImage) {
          mockAssets.push({
            name: `${art.slug}-featured.jpg`,
            path: `demo/${art.id}/${art.slug}-featured.jpg`,
            bucket: "articles",
            url: art.heroImage,
            size: 980400,
            createdAt: new Date().toISOString(),
            referencedBy: { type: "article", id: art.id, title: art.title },
          });
        }
      });

      setAssets(mockAssets);
      setIsLoading(false);
      return;
    }

    try {
      // 1. Fetch current database records to scan references
      const [
        { data: dbProperties },
        { data: dbProjects },
        { data: dbArticles },
      ] = await Promise.all([
        supabase.from("properties").select("id, title, images"),
        supabase
          .from("projects")
          .select(
            "id, title, hero_image, before_images, during_images, after_images"
          ),
        supabase.from("articles").select("id, title, hero_image"),
      ]);

      const properties = (dbProperties as any[]) || [];
      const projects = (dbProjects as any[]) || [];
      const articles = (dbArticles as any[]) || [];

      const aggregatedAssets: MediaAsset[] = [];
      const buckets: ("properties" | "projects" | "articles")[] = [
        "properties",
        "projects",
        "articles",
      ];

      // 2. Loop through buckets and list files
      for (const bucket of buckets) {
        // List root level of the bucket to find folders/IDs
        const { data: rootItems, error: listError } = await supabase.storage
          .from(bucket)
          .list("");

        if (listError) {
          // If a bucket is not initialized or errors, log and continue
          console.warn(`Could not list storage bucket "${bucket}":`, listError);
          continue;
        }

        if (!rootItems) continue;

        for (const item of rootItems) {
          // Check if item is a folder (folders typically have metadata: null or id: null)
          const isFolder = !item.metadata || !item.id;

          if (isFolder) {
            // List files inside the folder
            const { data: folderFiles, error: folderError } =
              await supabase.storage.from(bucket).list(item.name);

            if (folderError || !folderFiles) continue;

            for (const file of folderFiles) {
              const filePath = `${item.name}/${file.name}`;
              const { data } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);
              const url = data.publicUrl;

              // Check reference matching
              let referencedBy: MediaAsset["referencedBy"] = null;

              if (bucket === "properties") {
                const found = properties.find((p: any) =>
                  (p.images || []).some(
                    (img: string) => img && img.includes(filePath)
                  )
                );
                if (found) {
                  referencedBy = {
                    type: "property",
                    id: found.id,
                    title: found.title,
                  };
                }
              } else if (bucket === "projects") {
                const found = projects.find((p: any) => {
                  const images = [
                    p.hero_image,
                    ...(p.before_images || []),
                    ...(p.during_images || []),
                    ...(p.after_images || []),
                  ];
                  return images.some(
                    (img: string) => img && img.includes(filePath)
                  );
                });
                if (found) {
                  referencedBy = {
                    type: "project",
                    id: found.id,
                    title: found.title,
                  };
                }
              } else if (bucket === "articles") {
                const found = articles.find(
                  (a: any) => a.hero_image && a.hero_image.includes(filePath)
                );
                if (found) {
                  referencedBy = {
                    type: "article",
                    id: found.id,
                    title: found.title,
                  };
                }
              }

              aggregatedAssets.push({
                name: file.name,
                path: filePath,
                bucket,
                url,
                size: file.metadata?.size || 0,
                createdAt: file.created_at || new Date().toISOString(),
                referencedBy,
              });
            }
          }
        }
      }

      setAssets(
        aggregatedAssets.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Failed to fetch storage media assets")
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteAsset = useCallback(
    async (
      bucket: "properties" | "projects" | "articles",
      path: string
    ): Promise<{ error: Error | null }> => {
      if (!isSupabaseConfigured()) {
        setAssets(prev =>
          prev.filter(a => !(a.bucket === bucket && a.path === path))
        );
        return { error: null };
      }

      try {
        const { error: deleteError } = await supabase.storage
          .from(bucket)
          .remove([path]);

        if (deleteError) {
          return { error: new Error(deleteError.message) };
        }

        await fetchAssets();
        return { error: null };
      } catch (err) {
        return {
          error:
            err instanceof Error
              ? err
              : new Error("Failed to delete storage asset"),
        };
      }
    },
    [fetchAssets]
  );

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  return { assets, isLoading, error, refetch: fetchAssets, deleteAsset };
}
