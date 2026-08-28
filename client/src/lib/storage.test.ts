/**
 * Tests for Supabase Storage utilities
 */

import { describe, it, expect } from "vitest";
import {
  validateImageFile,
  sanitizeFileName,
  isSupabaseStorageUrl,
  extractStoragePath,
  MAX_IMAGE_FILE_SIZE,
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
    // Create a mock large file
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

describe("sanitizeFileName", () => {
  it("cleans up special characters and preserves extension", () => {
    const sanitized = sanitizeFileName("My Living Room (1) #final.JPG");
    expect(sanitized).toMatch(/^[0-9]+-my-living-room-1-final-[a-z0-9]+\.jpg$/);
  });

  it("handles filenames without extension gracefully", () => {
    const sanitized = sanitizeFileName("exterior");
    expect(sanitized).toMatch(/^[0-9]+-exterior-[a-z0-9]+\.jpg$/);
  });
});

describe("isSupabaseStorageUrl & extractStoragePath", () => {
  it("identifies valid Supabase Storage URLs", () => {
    const url =
      "https://tgeowfcmqfioazzdddcg.supabase.co/storage/v1/object/public/properties/8c3e6c2f-7f9a-4b3e-9d4a-111122223333/exterior.webp";
    expect(isSupabaseStorageUrl(url)).toBe(true);
  });

  it("rejects non-Supabase URLs", () => {
    const url = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c";
    expect(isSupabaseStorageUrl(url)).toBe(false);
  });

  it("extracts storage object path correctly", () => {
    const url =
      "https://tgeowfcmqfioazzdddcg.supabase.co/storage/v1/object/public/properties/8c3e6c2f-7f9a-4b3e-9d4a-111122223333/exterior.webp";
    const path = extractStoragePath(url);
    expect(path).toBe("8c3e6c2f-7f9a-4b3e-9d4a-111122223333/exterior.webp");
  });

  it("returns null when extracting path from non-storage URL", () => {
    const url = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c";
    expect(extractStoragePath(url)).toBeNull();
  });
});
