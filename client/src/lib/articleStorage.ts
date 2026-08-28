/**
 * ConcordVest Supabase Storage Helper Module for Articles
 *
 * Provides validated file uploading, deletion, and URL resolution
 * for article images using Supabase Storage ('articles' bucket).
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const ARTICLE_STORAGE_BUCKET = "articles";
export const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const DEFAULT_ARTICLE_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85";

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate image file type and size.
 */
export function validateImageFile(file: File): ImageValidationResult {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Invalid file format (${file.type || "unknown"}). Only JPG, PNG, and WebP images are allowed.`,
    };
  }

  if (file.size > MAX_IMAGE_FILE_SIZE) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File "${file.name}" is too large (${sizeInMb} MB). Maximum allowed size is 5 MB.`,
    };
  }

  return { valid: true };
}

/**
 * Sanitize a filename to prevent invalid storage paths or collisions.
 */
export function sanitizeFileName(name: string): string {
  const extension = name.includes(".") ? name.split(".").pop() || "jpg" : "jpg";
  const baseName = name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);

  const uniqueSuffix = Math.random().toString(36).substring(2, 8);
  return `${Date.now()}-${baseName || "image"}-${uniqueSuffix}.${extension.toLowerCase()}`;
}

/**
 * Check if a given URL is a Supabase Storage URL for the articles bucket.
 */
export function isSupabaseStorageUrl(url: string): boolean {
  return (
    typeof url === "string" &&
    url.includes(`/storage/v1/object/public/${ARTICLE_STORAGE_BUCKET}/`)
  );
}

/**
 * Extract the object path within the bucket from a full public Supabase URL.
 */
export function extractStoragePath(url: string): string | null {
  const marker = `/storage/v1/object/public/${ARTICLE_STORAGE_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.substring(index + marker.length));
}

/**
 * Upload a single article image file to Supabase Storage.
 * Object path structure: {articleId}/{unique-file-name}
 */
export async function uploadArticleImage(
  articleId: string,
  file: File
): Promise<{ url: string | null; path: string | null; error: Error | null }> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    return { url: null, path: null, error: new Error(validation.error) };
  }

  if (!isSupabaseConfigured()) {
    // In unconfigured / demo mode, generate an object URL for previewing
    return {
      url: URL.createObjectURL(file),
      path: `demo/${articleId}/${file.name}`,
      error: null,
    };
  }

  try {
    const fileName = sanitizeFileName(file.name);
    const filePath = `${articleId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(ARTICLE_STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return { url: null, path: null, error: new Error(uploadError.message) };
    }

    const { data } = supabase.storage
      .from(ARTICLE_STORAGE_BUCKET)
      .getPublicUrl(filePath);

    return { url: data.publicUrl, path: filePath, error: null };
  } catch (err) {
    return {
      url: null,
      path: null,
      error:
        err instanceof Error
          ? err
          : new Error("An unexpected error occurred during image upload"),
    };
  }
}

/**
 * Delete a single article image from Supabase Storage by its full public URL or path.
 */
export async function deleteArticleImage(
  urlOrPath: string
): Promise<{ success: boolean; error: Error | null }> {
  if (!urlOrPath) {
    return { success: true, error: null };
  }

  if (!isSupabaseConfigured()) {
    return { success: true, error: null };
  }

  try {
    let filePath = urlOrPath;
    if (urlOrPath.startsWith("http")) {
      const extracted = extractStoragePath(urlOrPath);
      if (!extracted) {
        // Not a Supabase URL, skip deletion
        return { success: true, error: null };
      }
      filePath = extracted;
    }

    const { error: deleteError } = await supabase.storage
      .from(ARTICLE_STORAGE_BUCKET)
      .remove([filePath]);

    if (deleteError) {
      return { success: false, error: new Error(deleteError.message) };
    }

    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err
          : new Error("An unexpected error occurred during image deletion"),
    };
  }
}
