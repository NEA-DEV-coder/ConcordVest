/**
 * Unit tests for ConcordVest Articles CMS
 */

import { describe, it, expect } from "vitest";
import { articleRecordToDb, articleDbToRecord } from "../hooks/useContent";
import { type ArticleRecord } from "./content";
import { type Article } from "./supabase";

describe("Articles CMS Mappings and Helpers", () => {
  const mockRecord: ArticleRecord = {
    id: "article-uuid-123", // invalid UUID
    slug: "designing-quiet-spaces",
    title: "Designing Quiet Spaces",
    category: "Materials & Finishes",
    date: "14 August 2026",
    excerpt: "A note on sensory design...",
    heroImage: "https://example.com/hero.jpg",
    readTime: "5 min read",
    content: [{ heading: "Quietness", body: "Texture matters." }],
    serviceSlugs: ["home-refresh"],
    projectSlugs: ["the-softened-arrival"],
    propertyLink: "/properties",
    isPublished: true,
    isFeatured: false,
  };

  const mockDbArticle: Article = {
    id: "550e8400-e29b-41d4-a716-446655440000", // valid UUID
    slug: "modern-nigerian-architecture",
    title: "Modern Nigerian Architecture",
    category: "Construction Tips",
    excerpt: "Building with local context.",
    content: [
      { heading: "Material Story", body: "Use stone cladding." },
    ] as any,
    hero_image: "https://example.com/modern.jpg",
    read_time: "7 min read",
    date: "10 July 2026",
    service_slugs: ["complete-building-finishing"],
    project_slugs: ["the-open-house"],
    property_link: null,
    author_id: null,
    is_published: true,
    is_featured: true,
    published_at: "2026-07-10T12:00:00Z",
    created_at: "2026-07-10T12:00:00Z",
    updated_at: "2026-07-10T12:00:00Z",
  };

  it("1. articleDbToRecord maps snake_case database columns to camelCase correctly", () => {
    const record = articleDbToRecord(mockDbArticle);

    expect(record.id).toBe(mockDbArticle.id);
    expect(record.slug).toBe(mockDbArticle.slug);
    expect(record.title).toBe(mockDbArticle.title);
    expect(record.category).toBe(mockDbArticle.category);
    expect(record.excerpt).toBe(mockDbArticle.excerpt);
    expect(record.heroImage).toBe(mockDbArticle.hero_image);
    expect(record.readTime).toBe(mockDbArticle.read_time);
    expect(record.date).toBe(mockDbArticle.date);
    expect(record.serviceSlugs).toEqual(mockDbArticle.service_slugs);
    expect(record.projectSlugs).toEqual(mockDbArticle.project_slugs);
    expect(record.propertyLink).toBeUndefined(); // null mapped to undefined
    expect(record.isPublished).toBe(mockDbArticle.is_published);
    expect(record.isFeatured).toBe(mockDbArticle.is_featured);
  });

  it("2. articleRecordToDb maps camelCase properties to database snake_case correctly", () => {
    const dbPayload = articleRecordToDb(mockRecord, false);

    expect(dbPayload.title).toBe(mockRecord.title);
    expect(dbPayload.slug).toBe(mockRecord.slug);
    expect(dbPayload.category).toBe(mockRecord.category);
    expect(dbPayload.excerpt).toBe(mockRecord.excerpt);
    expect(dbPayload.hero_image).toBe(mockRecord.heroImage);
    expect(dbPayload.read_time).toBe(mockRecord.readTime);
    expect(dbPayload.date).toBe(mockRecord.date);
    expect(dbPayload.service_slugs).toEqual(mockRecord.serviceSlugs);
    expect(dbPayload.project_slugs).toEqual(mockRecord.projectSlugs);
    expect(dbPayload.property_link).toBe(mockRecord.propertyLink);
    expect(dbPayload.is_published).toBe(mockRecord.isPublished);
    expect(dbPayload.is_featured).toBe(mockRecord.isFeatured);
  });

  it("3. CREATE payload (isNew=true) omits the id column to allow PostgreSQL default UUID generation", () => {
    const dbPayload = articleRecordToDb(mockRecord, true);
    expect(dbPayload.id).toBeUndefined();
  });

  it("4. UPDATE payload includes id only if it is a valid UUID format", () => {
    // Case A: invalid UUID should be discarded
    const payloadA = articleRecordToDb(mockRecord, false);
    expect(payloadA.id).toBeUndefined();

    // Case B: valid UUID should be preserved
    const recordWithValidUuid = {
      ...mockRecord,
      id: "550e8400-e29b-41d4-a716-446655440000",
    };
    const payloadB = articleRecordToDb(recordWithValidUuid, false);
    expect(payloadB.id).toBe(recordWithValidUuid.id);
  });

  it("5. validates featured and published toggles are correctly mapped", () => {
    const draftRecord = {
      ...mockRecord,
      isPublished: false,
      isFeatured: true,
    };

    const payload = articleRecordToDb(draftRecord, false);
    expect(payload.is_published).toBe(false);
    expect(payload.is_featured).toBe(true);
  });
});
