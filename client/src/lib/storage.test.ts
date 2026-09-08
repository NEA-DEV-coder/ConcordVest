/**
 * Tests for Supabase Storage utilities
 */

import { describe, it, expect } from "vitest";
import {
  validateImageFile,
  validateVideoFile,
  sanitizeFileName,
  sanitizeVideoFileName,
  isSupabaseStorageUrl,
  extractStoragePath,
  uploadPropertyImage,
  uploadPropertyVideo,
  deletePropertyImage,
  deletePropertyVideo,
  MAX_IMAGE_FILE_SIZE,
  MAX_VIDEO_FILE_SIZE,
  ALLOWED_VIDEO_MIME_TYPES,
} from "./storage";

describe("validateImageFile", () => {
  it("accepts valid JPEG image", () => {
    const file = new File(["dummy content"], "photo.jpg", {
      type: "image/jpeg",
    });
    const result = validateImageFile(file);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("accepts valid PNG image", () => {
    const file = new File(["dummy content"], "photo.png", {
      type: "image/png",
    });
    const result = validateImageFile(file);
    expect(result.valid).toBe(true);
  });

  it("accepts valid WebP image", () => {
    const file = new File(["dummy content"], "photo.webp", {
      type: "image/webp",
    });
    const result = validateImageFile(file);
    expect(result.valid).toBe(true);
  });

  it("rejects unsupported file type (e.g. pdf)", () => {
    const file = new File(["dummy content"], "document.pdf", {
      type: "application/pdf",
    });
    const result = validateImageFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid file format");
  });

  it("rejects unsupported file type (e.g. txt)", () => {
    const file = new File(["dummy content"], "notes.txt", {
      type: "text/plain",
    });
    const result = validateImageFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid file format");
  });

  it("rejects files exceeding 5MB max size limit", () => {
    const largeFile = new File(["a".repeat(100)], "huge-photo.jpg", {
      type: "image/jpeg",
    });
    Object.defineProperty(largeFile, "size", {
      value: MAX_IMAGE_FILE_SIZE + 1024,
    });

    const result = validateImageFile(largeFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("too large");
  });
});

describe("validateVideoFile", () => {
  it("accepts valid MP4 video", () => {
    const file = new File(["dummy video"], "walkthrough.mp4", {
      type: "video/mp4",
    });
    const result = validateVideoFile(file);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("accepts valid WebM video", () => {
    const file = new File(["dummy video"], "walkthrough.webm", {
      type: "video/webm",
    });
    const result = validateVideoFile(file);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("accepts valid QuickTime (MOV) video", () => {
    const file = new File(["dummy video"], "walkthrough.mov", {
      type: "video/quicktime",
    });
    const result = validateVideoFile(file);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("rejects invalid MIME type (e.g. video/avi)", () => {
    const file = new File(["dummy video"], "walkthrough.avi", {
      type: "video/x-msvideo",
    });
    const result = validateVideoFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid video format");
  });

  it("rejects image files passed to video validator", () => {
    const file = new File(["dummy image"], "photo.jpg", {
      type: "image/jpeg",
    });
    const result = validateVideoFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid video format");
  });

  it("rejects video files exceeding 50MB max size limit", () => {
    const largeFile = new File(["a".repeat(100)], "huge-tour.mp4", {
      type: "video/mp4",
    });
    Object.defineProperty(largeFile, "size", {
      value: MAX_VIDEO_FILE_SIZE + 1024,
    });

    const result = validateVideoFile(largeFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("too large");
    expect(result.error).toContain("50 MB");
  });
});

describe("sanitizeFileName and sanitizeVideoFileName", () => {
  it("cleans up special characters and preserves image extension", () => {
    const sanitized = sanitizeFileName("My Living Room (1) #final.JPG");
    expect(sanitized).toMatch(/^[0-9]+-my-living-room-1-final-[a-z0-9]+\.jpg$/);
  });

  it("handles image filenames without extension gracefully", () => {
    const sanitized = sanitizeFileName("exterior");
    expect(sanitized).toMatch(/^[0-9]+-exterior-[a-z0-9]+\.jpg$/);
  });

  it("creates video path conforming to video-{timestamp}-{filename} format", () => {
    const sanitized = sanitizeVideoFileName(
      "Full Property Walkthrough (2026).mp4"
    );
    expect(sanitized).toMatch(
      /^video-[0-9]+-full-property-walkthrough-2026-[a-z0-9]+\.mp4$/
    );
  });

  it("handles MOV and WebM extensions correctly", () => {
    const movSanitized = sanitizeVideoFileName("Tour Final.MOV");
    expect(movSanitized).toMatch(/^video-[0-9]+-tour-final-[a-z0-9]+\.mov$/);

    const webmSanitized = sanitizeVideoFileName("WebmTour.webm");
    expect(webmSanitized).toMatch(/^video-[0-9]+-webmtour-[a-z0-9]+\.webm$/);
  });
});

describe("isSupabaseStorageUrl & extractStoragePath", () => {
  it("identifies valid Supabase Storage image URLs", () => {
    const url =
      "https://tgeowfcmqfioazzdddcg.supabase.co/storage/v1/object/public/properties/8c3e6c2f-7f9a-4b3e-9d4a-111122223333/exterior.webp";
    expect(isSupabaseStorageUrl(url)).toBe(true);
  });

  it("identifies valid Supabase Storage video URLs", () => {
    const url =
      "https://tgeowfcmqfioazzdddcg.supabase.co/storage/v1/object/public/properties/8c3e6c2f-7f9a-4b3e-9d4a-111122223333/video-1725800000000-tour-abc123.mp4";
    expect(isSupabaseStorageUrl(url)).toBe(true);
  });

  it("rejects non-Supabase URLs", () => {
    const url = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c";
    expect(isSupabaseStorageUrl(url)).toBe(false);

    const youtubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    expect(isSupabaseStorageUrl(youtubeUrl)).toBe(false);
  });

  it("extracts storage object path correctly for videos", () => {
    const url =
      "https://tgeowfcmqfioazzdddcg.supabase.co/storage/v1/object/public/properties/8c3e6c2f-7f9a-4b3e-9d4a-111122223333/video-1725800000000-tour-abc123.mp4";
    const path = extractStoragePath(url);
    expect(path).toBe(
      "8c3e6c2f-7f9a-4b3e-9d4a-111122223333/video-1725800000000-tour-abc123.mp4"
    );
  });

  it("returns null when extracting path from non-storage URL", () => {
    const url = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c";
    expect(extractStoragePath(url)).toBeNull();
  });
});

describe("uploadPropertyVideo & uploadPropertyImage validations", () => {
  it("rejects invalid video before invoking storage API", async () => {
    const invalidFile = new File(["fake"], "bad.txt", { type: "text/plain" });
    const result = await uploadPropertyVideo("prop-1", invalidFile);
    expect(result.url).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain("Invalid video format");
  });

  it("rejects oversized video before invoking storage API", async () => {
    const hugeFile = new File(["fake"], "huge.mp4", { type: "video/mp4" });
    Object.defineProperty(hugeFile, "size", { value: MAX_VIDEO_FILE_SIZE + 1 });
    const result = await uploadPropertyVideo("prop-1", hugeFile);
    expect(result.url).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain("too large");
  });

  it("safely ignores non-storage URLs on delete", async () => {
    const externalUrl = "https://vimeo.com/123456789";
    const deleteResult = await deletePropertyVideo(externalUrl);
    expect(deleteResult.error).toBeNull();
  });
});

describe("rollback & cleanup safety", () => {
  it("safely handles empty or null URLs on video delete", async () => {
    const res = await deletePropertyVideo("");
    expect(res.error).toBeNull();
  });

  it("safely handles empty or null URLs on image delete", async () => {
    const res = await deletePropertyImage("");
    expect(res.error).toBeNull();
  });

  it("distinguishes newly uploaded storage URLs from external URLs for rollback", () => {
    const storageUrl =
      "https://tgeowfcmqfioazzdddcg.supabase.co/storage/v1/object/public/properties/prop-1/video-123.mp4";
    const externalUrl = "https://images.unsplash.com/photo-1600585154340";

    expect(isSupabaseStorageUrl(storageUrl)).toBe(true);
    expect(isSupabaseStorageUrl(externalUrl)).toBe(false);
  });
});
