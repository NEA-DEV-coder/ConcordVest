import { describe, it, expect } from "vitest";
import { resolveNavigation } from "./navigation";

describe("resolveNavigation", () => {
  it("resolves the new 05 Start a Building Project category routes", () => {
    expect(resolveNavigation("Start a building project")).toBe(
      "/start-building-project"
    );
    expect(resolveNavigation("Start a Building Project")).toBe(
      "/start-building-project"
    );
    expect(resolveNavigation("05 — START A BUILDING PROJECT")).toBe(
      "/start-building-project"
    );
  });

  it("preserves all existing 01–04 Start Here category routes exactly intact", () => {
    expect(resolveNavigation("Buy land")).toBe("/properties");
    expect(resolveNavigation("Buy an apartment")).toBe("/properties");
    expect(resolveNavigation("Renovate my property")).toBe(
      "/services/custom-renovation"
    );
    expect(resolveNavigation("Finish my property")).toBe(
      "/services/complete-building-finishing"
    );
  });

  it("preserves core platform routes", () => {
    expect(resolveNavigation("Home")).toBe("/");
    expect(resolveNavigation("All Properties")).toBe("/properties");
    expect(resolveNavigation("All Services")).toBe("/services");
    expect(resolveNavigation("All Projects")).toBe("/projects");
    expect(resolveNavigation("All Inspiration")).toBe("/inspiration");
  });

  it("returns null for unknown destinations", () => {
    expect(resolveNavigation("Non-existent Destination")).toBeNull();
  });
});
