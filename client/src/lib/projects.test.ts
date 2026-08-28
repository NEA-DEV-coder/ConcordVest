/**
 * Tests for ConcordVest Project payload conversion and slug generation
 */

import { describe, it, expect } from "vitest";
import { projectRecordToDb, projectDbToRecord } from "../hooks/useContent";
import { type ProjectRecord } from "./content";
import { type Project } from "./supabase";

describe("projectRecordToDb", () => {
  it("correctly serializes camelCase ProjectRecord to snake_case ProjectInsert", () => {
    const record: ProjectRecord = {
      id: "project-123", // invalid UUID, should be ignored for insert
      slug: "softened-arrival",
      title: "Softened Arrival",
      location: "Maitama, Abuja",
      type: "Residential",
      category: ["Renovation", "Interiors"],
      description: "A calmer entry sequence",
      heroImage: "http://example.com/hero.jpg",
      beforeImages: ["http://example.com/before1.jpg"],
      duringImages: ["http://example.com/during1.jpg"],
      afterImages: ["http://example.com/after1.jpg"],
      services: ["Remodeling"],
      serviceSlugs: ["remodeling"],
      materials: ["Plaster"],
      challenges: ["Dark arrival"],
      outcome: "Quieter sequence",
      relatedProjectSlugs: ["kitchen"],
      isFeatured: true,
      isPublished: false,
    };

    const insertPayload = projectRecordToDb(record, true); // isNew = true

    expect(insertPayload.title).toBe("Softened Arrival");
    expect(insertPayload.slug).toBe("softened-arrival");
    expect(insertPayload.location).toBe("Maitama, Abuja");
    expect(insertPayload.type).toBe("Residential");
    expect(insertPayload.category).toEqual(["Renovation", "Interiors"]);
    expect(insertPayload.description).toBe("A calmer entry sequence");
    expect(insertPayload.hero_image).toBe("http://example.com/hero.jpg");
    expect(insertPayload.before_images).toEqual([
      "http://example.com/before1.jpg",
    ]);
    expect(insertPayload.during_images).toEqual([
      "http://example.com/during1.jpg",
    ]);
    expect(insertPayload.after_images).toEqual([
      "http://example.com/after1.jpg",
    ]);
    expect(insertPayload.services).toEqual(["Remodeling"]);
    expect(insertPayload.service_slugs).toEqual(["remodeling"]);
    expect(insertPayload.materials).toEqual(["Plaster"]);
    expect(insertPayload.challenges).toEqual(["Dark arrival"]);
    expect(insertPayload.outcome).toBe("Quieter sequence");
    expect(insertPayload.related_project_slugs).toEqual(["kitchen"]);
    expect(insertPayload.is_featured).toBe(true);
    expect(insertPayload.is_published).toBe(false);
    expect(insertPayload.id).toBeUndefined(); // discarded because it's not a valid UUID & isNew=true
  });

  it("retains valid UUID id for existing project updates", () => {
    const validUuid = "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d";
    const record: Partial<ProjectRecord> = {
      id: validUuid,
      title: "Updated Case",
      slug: "updated-case",
      isPublished: true,
    };

    const insertPayload = projectRecordToDb(record, false); // isNew = false
    expect(insertPayload.id).toBe(validUuid);
    expect(insertPayload.is_published).toBe(true);
  });
});

describe("projectDbToRecord", () => {
  it("correctly deserializes snake_case Database Row to camelCase ProjectRecord", () => {
    const dbRow: Project = {
      id: "uuid-999",
      title: "Tactile Finish",
      slug: "tactile-finish",
      location: "Asokoro",
      type: "Bathroom",
      category: ["Bathrooms"],
      description: "Tactile textures",
      hero_image: "http://example.com/hero.jpg",
      before_images: ["before.jpg"],
      during_images: ["during.jpg"],
      after_images: ["after.jpg"],
      services: ["Bathroom Upgrade"],
      service_slugs: ["bathroom-upgrade"],
      materials: ["Terrazzo"],
      challenges: ["Compact shape"],
      outcome: "Calmer tone",
      related_project_slugs: [],
      is_featured: false,
      is_published: true,
      created_at: "2026-08-28T12:00:00Z",
      updated_at: "2026-08-28T12:00:00Z",
    };

    const record = projectDbToRecord(dbRow);

    expect(record.id).toBe("uuid-999");
    expect(record.title).toBe("Tactile Finish");
    expect(record.slug).toBe("tactile-finish");
    expect(record.location).toBe("Asokoro");
    expect(record.type).toBe("Bathroom");
    expect(record.category).toEqual(["Bathrooms"]);
    expect(record.description).toBe("Tactile textures");
    expect(record.heroImage).toBe("http://example.com/hero.jpg");
    expect(record.beforeImages).toEqual(["before.jpg"]);
    expect(record.duringImages).toEqual(["during.jpg"]);
    expect(record.afterImages).toEqual(["after.jpg"]);
    expect(record.services).toEqual(["Bathroom Upgrade"]);
    expect(record.serviceSlugs).toEqual(["bathroom-upgrade"]);
    expect(record.materials).toEqual(["Terrazzo"]);
    expect(record.challenges).toEqual(["Compact shape"]);
    expect(record.outcome).toBe("Calmer tone");
    expect(record.relatedProjectSlugs).toEqual([]);
    expect(record.isFeatured).toBe(false);
    expect(record.isPublished).toBe(true);
  });
});
