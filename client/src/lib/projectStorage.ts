/**
 * ConcordVest Supabase Storage Helper Module for Projects
 *
 * Provides validated file uploading, deletion, and URL resolution
 * for project images using Supabase Storage ('projects' bucket).
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const PROJECT_STORAGE_BUCKET = "projects";
export const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const DEFAULT_PROJECT_IMAGE =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1800&q=85";

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
 * Check if a given URL is a Supabase Storage URL for the projects bucket.
 */
export function isSupabaseStorageUrl(url: string): boolean {
  return (
    typeof url === "string" &&
    url.includes(`/storage/v1/object/public/${PROJECT_STORAGE_BUCKET}/`)
  );
}

/**
 * Extract the object path within the bucket from a full public Supabase URL.
 */
export function extractStoragePath(url: string): string | null {
  const marker = `/storage/v1/object/public/${PROJECT_STORAGE_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.substring(index + marker.length));
}

/**
 * Upload a single project image file to Supabase Storage.
 * Object path structure: {projectId}/{unique-file-name}
 */
export async function uploadProjectImage(
  projectId: string,
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
      path: `demo/${file.name}`,
      error: null,
    };
  }

  try {
    const cleanFileName = sanitizeFileName(file.name);
    const storagePath = `${projectId}/${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from(PROJECT_STORAGE_BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      return { url: null, path: null, error: new Error(uploadError.message) };
    }

    const { data: publicUrlData } = supabase.storage
      .from(PROJECT_STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    return {
      url: publicUrlData.publicUrl,
      path: storagePath,
      error: null,
    };
  } catch (err) {
    return {
      url: null,
      path: null,
      error:
        err instanceof Error
          ? err
          : new Error("Unexpected error during image upload"),
    };
  }
}

/**
 * Upload multiple project image files to Supabase Storage.
 */
export async function uploadProjectImages(
  projectId: string,
  files: File[],
  onProgress?: (completed: number, total: number) => void
): Promise<{ urls: string[]; paths: string[]; errors: string[] }> {
  const urls: string[] = [];
  const paths: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const { url, path, error } = await uploadProjectImage(projectId, file);

    if (error) {
      errors.push(`Failed to upload ${file.name}: ${error.message}`);
    } else if (url && path) {
      urls.push(url);
      paths.push(path);
    }

    if (onProgress) {
      onProgress(i + 1, files.length);
    }
  }

  return { urls, paths, errors };
}

/**
 * Delete a project image from Supabase Storage.
 */
export async function deleteProjectImage(
  urlOrPath: string
): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return { error: null };
  }

  try {
    const storagePath = isSupabaseStorageUrl(urlOrPath)
      ? extractStoragePath(urlOrPath)
      : urlOrPath;

    if (!storagePath) {
      // Not a Supabase storage object (e.g. external Unsplash URL), skip deletion safely
      return { error: null };
    }

    const { error } = await supabase.storage
      .from(PROJECT_STORAGE_BUCKET)
      .remove([storagePath]);

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err : new Error("Failed to delete storage file"),
    };
  }
}
