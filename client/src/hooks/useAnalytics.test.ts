// @vitest-environment jsdom
/**
 * ConcordVest Analytics Hook & Utility Tests (V2)
 */

import { describe, it, expect } from "vitest";
import {
  computeDateBoundaries,
  calculateRate,
  calculateRateNumeric,
  resolveEntityName,
} from "./useAnalytics";

describe("computeDateBoundaries", () => {
  it("calculates today date boundaries with end date exclusive to tomorrow", () => {
    const { startDate, endDate } = computeDateBoundaries("today");
    const start = new Date(startDate);
    const end = new Date(endDate);

    expect(start.getTime()).toBeLessThan(end.getTime());
    // Difference between start of today and start of tomorrow should be 24 hours (86,400,000 ms)
    expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it("calculates 7-day date boundaries covering 7 calendar days", () => {
    const { startDate, endDate } = computeDateBoundaries("7d");
    const start = new Date(startDate);
    const end = new Date(endDate);

    expect(start.getTime()).toBeLessThan(end.getTime());
    expect(end.getTime() - start.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("calculates 30-day date boundaries covering 30 calendar days", () => {
    const { startDate, endDate } = computeDateBoundaries("30d");
    const start = new Date(startDate);
    const end = new Date(endDate);

    expect(start.getTime()).toBeLessThan(end.getTime());
    expect(end.getTime() - start.getTime()).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it("calculates 90-day date boundaries covering 90 calendar days", () => {
    const { startDate, endDate } = computeDateBoundaries("90d");
    const start = new Date(startDate);
    const end = new Date(endDate);

    expect(start.getTime()).toBeLessThan(end.getTime());
    expect(end.getTime() - start.getTime()).toBe(90 * 24 * 60 * 60 * 1000);
  });

  it("properly handles custom ranges and ensures the custom end date is fully included", () => {
    const { startDate, endDate } = computeDateBoundaries("custom", "2026-10-01", "2026-10-05");
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Start must be October 1st 00:00:00 local
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(9); // 0-indexed October
    expect(start.getDate()).toBe(1);

    // End must be October 6th 00:00:00 local so October 5th 23:59:59 is inside [start, end)
    expect(end.getFullYear()).toBe(2026);
    expect(end.getMonth()).toBe(9);
    expect(end.getDate()).toBe(6);

    // Exactly 5 full days (Oct 1, 2, 3, 4, 5)
    expect(end.getTime() - start.getTime()).toBe(5 * 24 * 60 * 60 * 1000);
  });

  it("falls back to 30 days if custom dates are missing", () => {
    const { startDate, endDate } = computeDateBoundaries("custom");
    const start = new Date(startDate);
    const end = new Date(endDate);

    expect(start.getTime()).toBeLessThan(end.getTime());
    expect(end.getTime() - start.getTime()).toBe(30 * 24 * 60 * 60 * 1000);
  });
});

describe("calculateRate (V2 attribution & conversion rates)", () => {
  it("computes rate accurately for valid numbers", () => {
    expect(calculateRate(25, 100)).toBe("25.0%");
    expect(calculateRate(1, 3)).toBe("33.3%");
    expect(calculateRate(5, 50)).toBe("10.0%");
  });

  it("safely guards against division by zero", () => {
    expect(calculateRate(10, 0)).toBe("0.0%");
    expect(calculateRate(0, 0)).toBe("0.0%");
  });

  it("safely guards against null, undefined, NaN, and negative values", () => {
    expect(calculateRate(null as any, 100)).toBe("0.0%");
    expect(calculateRate(10, null as any)).toBe("0.0%");
    expect(calculateRate(undefined as any, undefined as any)).toBe("0.0%");
    expect(calculateRate(-5, 100)).toBe("0.0%");
    expect(calculateRate(10, -50)).toBe("0.0%");
  });
});

describe("calculateRateNumeric", () => {
  it("computes numeric rate accurately", () => {
    expect(calculateRateNumeric(25, 100)).toBe(25.0);
    expect(calculateRateNumeric(1, 3)).toBe(33.3);
  });

  it("safely returns 0 when denominator is zero or invalid", () => {
    expect(calculateRateNumeric(10, 0)).toBe(0);
    expect(calculateRateNumeric(null as any, 100)).toBe(0);
  });
});

describe("resolveEntityName", () => {
  const map: Record<string, string> = {
    "prop-1": "Luxury Duplex in Maitama",
    "prop-2": "Commercial Plaza in Wuse",
  };

  it("resolves name when key is found in map", () => {
    expect(resolveEntityName("prop-1", map, "Unknown Listing")).toBe("Luxury Duplex in Maitama");
  });

  it("returns fallback when key is not found", () => {
    expect(resolveEntityName("prop-999", map, "Unknown Listing")).toBe("Unknown Listing");
  });

  it("returns fallback when id is null or undefined without throwing", () => {
    expect(resolveEntityName(null, map, "Unknown Listing")).toBe("Unknown Listing");
    expect(resolveEntityName(undefined, map, "Unknown Listing")).toBe("Unknown Listing");
  });
});
