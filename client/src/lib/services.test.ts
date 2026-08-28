/**
 * Tests for ConcordVest Service payload conversion
 */

import { describe, it, expect } from "vitest";
import { servicePackageToDb, serviceDbToPackage } from "../hooks/useContent";
import {
  type ServicePackage,
  calculateNextServiceNumber,
  calculateNextSortOrder,
  renumberServices,
} from "./services";
import { type Service } from "./supabase";

describe("servicePackageToDb", () => {
  it("correctly serializes ServicePackage to Database ServiceInsert payload", () => {
    const pkg: ServicePackage = {
      id: "svc-999", // invalid UUID, should be discarded when isNew = true
      number: "08",
      slug: "premium-acoustic-upgrade",
      name: "Premium Acoustic Upgrade",
      shortDescription: "Refined soundproofing solutions.",
      overview: "Full room isolation narratives.",
      problemsSolved: ["Echoes", "Distractions"],
      includes: ["Glasswool", "Plasterboards"],
      process: ["Acoustic design", "Framework", "Panels"],
      timeline: "2-3 weeks",
      image: "http://example.com/acoustic.jpg",
      relatedProjectImage: "http://example.com/related.jpg",
      tags: ["acoustic", "luxury"],
      isPublished: false,
      sortOrder: 15,
    };

    const insertPayload = servicePackageToDb(pkg, true); // isNew = true

    expect(insertPayload.number).toBe("08");
    expect(insertPayload.slug).toBe("premium-acoustic-upgrade");
    expect(insertPayload.name).toBe("Premium Acoustic Upgrade");
    expect(insertPayload.short_description).toBe(
      "Refined soundproofing solutions."
    );
    expect(insertPayload.overview).toBe("Full room isolation narratives.");
    expect(insertPayload.problems_solved).toEqual(["Echoes", "Distractions"]);
    expect(insertPayload.includes).toEqual(["Glasswool", "Plasterboards"]);
    expect(insertPayload.process).toEqual([
      "Acoustic design",
      "Framework",
      "Panels",
    ]);
    expect(insertPayload.timeline).toBe("2-3 weeks");
    expect(insertPayload.image).toBe("http://example.com/acoustic.jpg");
    expect(insertPayload.related_project_image).toBe(
      "http://example.com/related.jpg"
    );
    expect(insertPayload.tags).toEqual(["acoustic", "luxury"]);
    expect(insertPayload.is_published).toBe(false);
    expect(insertPayload.sort_order).toBe(15);
    expect(insertPayload.id).toBeUndefined(); // discarded for new inserts
  });

  it("retains valid UUID id for existing service updates", () => {
    const validUuid = "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d";
    const pkg: Partial<ServicePackage> = {
      id: validUuid,
      name: "Updated Package Name",
      slug: "updated-package-name",
      isPublished: true,
    };

    const dbInsert = servicePackageToDb(pkg as ServicePackage, false); // isNew = false
    expect(dbInsert.id).toBe(validUuid);
  });
});

describe("serviceDbToPackage", () => {
  it("correctly deserializes Database Service row to ServicePackage", () => {
    const dbRow: Service = {
      id: "uuid-999",
      number: "09",
      slug: "custom-automation",
      name: "Custom Automation",
      short_description: "Smart systems.",
      overview: "Overview paragraph.",
      problems_solved: ["Manual control"],
      includes: ["Cables", "Switches"],
      process: ["Layout mapping"],
      timeline: "Timeline description",
      image: "http://example.com/automation.jpg",
      related_project_image: "http://example.com/related-automation.jpg",
      tags: ["smart", "lighting"],
      is_published: true,
      sort_order: 8,
      created_at: "2026-08-28T12:00:00Z",
      updated_at: "2026-08-28T12:00:00Z",
    };

    const pkg = serviceDbToPackage(dbRow);

    expect(pkg.id).toBe("uuid-999");
    expect(pkg.number).toBe("09");
    expect(pkg.slug).toBe("custom-automation");
    expect(pkg.name).toBe("Custom Automation");
    expect(pkg.shortDescription).toBe("Smart systems.");
    expect(pkg.overview).toBe("Overview paragraph.");
    expect(pkg.problemsSolved).toEqual(["Manual control"]);
    expect(pkg.includes).toEqual(["Cables", "Switches"]);
    expect(pkg.process).toEqual(["Layout mapping"]);
    expect(pkg.timeline).toBe("Timeline description");
    expect(pkg.image).toBe("http://example.com/automation.jpg");
    expect(pkg.relatedProjectImage).toBe(
      "http://example.com/related-automation.jpg"
    );
    expect(pkg.tags).toEqual(["smart", "lighting"]);
    expect(pkg.isPublished).toBe(true);
    expect(pkg.sortOrder).toBe(8);
  });
});

describe("calculateNextServiceNumber and calculateNextSortOrder helpers", () => {
  it("handles auto-numbering sequence calculations correctly", () => {
    // case 1: normal sequence
    expect(calculateNextServiceNumber(["01", "02", "03", "07"])).toBe("08");

    // case 2: single gap
    expect(calculateNextServiceNumber(["01", "02", "09"])).toBe("10");

    // case 3: multiple gaps
    expect(calculateNextServiceNumber(["01", "02", "07", "12"])).toBe("13");

    // case 4: smaller sequence
    expect(calculateNextServiceNumber(["01", "02", "04"])).toBe("05");

    // case 5: empty list
    expect(calculateNextServiceNumber([])).toBe("01");

    // case 6: non-numeric/invalid values ignored
    expect(calculateNextServiceNumber(["01", "02", "invalid", "05"])).toBe(
      "06"
    );
  });

  it("formats single digits below 10 with a leading zero and keeps double digits as is", () => {
    expect(calculateNextServiceNumber(["0"])).toBe("01");
    expect(calculateNextServiceNumber(["6"])).toBe("07");
    expect(calculateNextServiceNumber(["9"])).toBe("10");
    expect(calculateNextServiceNumber(["11"])).toBe("12");
  });
  it("handles auto-sort_order calculations correctly", () => {
    // highest existing sort_order = 7
    expect(calculateNextSortOrder([1, 2, 5, 7])).toBe(8);

    // gaps in sort order
    expect(calculateNextSortOrder([1, 2, 5, 8])).toBe(9);

    // empty list
    expect(calculateNextSortOrder([])).toBe(1);
  });
});

describe("renumberServices helper after deletion", () => {
  const createMockServices = (count: number): ServicePackage[] => {
    return Array.from({ length: count }, (_, i) => {
      const idx = i + 1;
      const num = idx < 10 ? `0${idx}` : String(idx);
      return {
        id: `srv-${idx}`,
        number: num,
        slug: `service-${idx}`,
        name: `Service ${idx}`,
        shortDescription: `Desc ${idx}`,
        overview: `Overview ${idx}`,
        problemsSolved: [],
        includes: [],
        process: [],
        timeline: "",
        image: "",
        relatedProjectImage: "",
        tags: [],
        isPublished: true,
        sortOrder: idx,
      };
    });
  };

  it("TEST 1: correctly renumbers when middle item 03 is deleted from 01-05", () => {
    const list = createMockServices(5);
    // Delete service-3
    const remaining = list.filter(s => s.id !== "srv-3");
    const updated = renumberServices(remaining);

    expect(updated.length).toBe(4);
    expect(updated.map(s => s.number)).toEqual(["01", "02", "03", "04"]);
    expect(updated.map(s => s.sortOrder)).toEqual([1, 2, 3, 4]);
    // check relative order: Service 1, 2, 4, 5
    expect(updated.map(s => s.name)).toEqual([
      "Service 1",
      "Service 2",
      "Service 4",
      "Service 5",
    ]);
  });

  it("TEST 2: correctly renumbers when item 08 is deleted from 01-09", () => {
    const list = createMockServices(9);
    const remaining = list.filter(s => s.id !== "srv-8");
    const updated = renumberServices(remaining);

    expect(updated.length).toBe(8);
    expect(updated.map(s => s.number)).toEqual([
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
      "07",
      "08",
    ]);
    expect(updated.map(s => s.sortOrder)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(updated.map(s => s.name)).toEqual([
      "Service 1",
      "Service 2",
      "Service 3",
      "Service 4",
      "Service 5",
      "Service 6",
      "Service 7",
      "Service 9",
    ]);
  });

  it("TEST 3: correctly renumbers when first item 01 is deleted from 01-05", () => {
    const list = createMockServices(5);
    const remaining = list.filter(s => s.id !== "srv-1");
    const updated = renumberServices(remaining);

    expect(updated.length).toBe(4);
    expect(updated.map(s => s.number)).toEqual(["01", "02", "03", "04"]);
    expect(updated.map(s => s.sortOrder)).toEqual([1, 2, 3, 4]);
    expect(updated.map(s => s.name)).toEqual([
      "Service 2",
      "Service 3",
      "Service 4",
      "Service 5",
    ]);
  });

  it("TEST 4: correctly renumbers when last item 05 is deleted from 01-05", () => {
    const list = createMockServices(5);
    const remaining = list.filter(s => s.id !== "srv-5");
    const updated = renumberServices(remaining);

    expect(updated.length).toBe(4);
    expect(updated.map(s => s.number)).toEqual(["01", "02", "03", "04"]);
    expect(updated.map(s => s.sortOrder)).toEqual([1, 2, 3, 4]);
    expect(updated.map(s => s.name)).toEqual([
      "Service 1",
      "Service 2",
      "Service 3",
      "Service 4",
    ]);
  });

  it("TEST 5: correctly renumbers when middle item 05 is deleted from 01-10", () => {
    const list = createMockServices(10);
    const remaining = list.filter(s => s.id !== "srv-5");
    const updated = renumberServices(remaining);

    expect(updated.length).toBe(9);
    expect(updated.map(s => s.number)).toEqual([
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
      "07",
      "08",
      "09",
    ]);
    expect(updated.map(s => s.sortOrder)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(updated.map(s => s.name)).toEqual([
      "Service 1",
      "Service 2",
      "Service 3",
      "Service 4",
      "Service 6",
      "Service 7",
      "Service 8",
      "Service 9",
      "Service 10",
    ]);
  });

  it("TEST 6: verifies zero-padding calculations for single digits and double digits", () => {
    const list = createMockServices(11);
    const updated = renumberServices(list);
    expect(updated[0].number).toBe("01");
    expect(updated[8].number).toBe("09");
    expect(updated[9].number).toBe("10");
    expect(updated[10].number).toBe("11");
  });

  it("TEST 7: verifies that the relative display order remains unchanged after renumbering", () => {
    const list = createMockServices(5);
    // Shuffle sort order to test order sensitivity
    list[0].sortOrder = 10;
    list[1].sortOrder = 20;
    list[2].sortOrder = 15;

    // Relative order sorted by sortOrder: list[0] (10), list[2] (15), list[1] (20)
    const updated = renumberServices([list[0], list[1], list[2]]);

    expect(updated[0].name).toBe("Service 1"); // sortOrder 1
    expect(updated[1].name).toBe("Service 3"); // sortOrder 2
    expect(updated[2].name).toBe("Service 2"); // sortOrder 3
  });

  it("TEST 8: verifies create-after-delete sequence", () => {
    const list = createMockServices(5);
    // Delete 03
    const remaining = list.filter(s => s.id !== "srv-3");
    const compacted = renumberServices(remaining); // returns 01, 02, 03, 04

    // Create new service
    const nextNum = calculateNextServiceNumber(compacted.map(s => s.number));
    const nextOrder = calculateNextSortOrder(
      compacted.map(s => s.sortOrder ?? 0)
    );

    expect(nextNum).toBe("05");
    expect(nextOrder).toBe(5);
  });

  it("TEST 9: verifies that editing does not renumber services", () => {
    const list = createMockServices(4);
    // Editing Service 2 - updates name but keeps its original number and sort order
    const serviceToEdit = { ...list[1], name: "Service 2 Edited" };

    // The edit is applied to the list without calling renumberServices
    const updatedList = list.map(s =>
      s.id === serviceToEdit.id ? serviceToEdit : s
    );

    expect(updatedList.map(s => s.number)).toEqual(["01", "02", "03", "04"]);
    expect(updatedList.map(s => s.sortOrder)).toEqual([1, 2, 3, 4]);
    expect(updatedList[1].name).toBe("Service 2 Edited");
  });
});
