/**
 * Tests for Phase 10 Dynamic Greetings & Relative Time Utility
 */

import { describe, it, expect } from "vitest";
import { formatRelativeTime } from "./utils";

// Helper matching getGreeting logic in Admin.tsx
function getGreetingForHour(hour: number): string {
  if (hour < 12) return "Good morning.";
  if (hour < 17) return "Good afternoon.";
  return "Good evening.";
}

describe("Dashboard Greeting Logic", () => {
  it('returns "Good morning." for times between 00:00 and 11:59', () => {
    expect(getGreetingForHour(0)).toBe("Good morning.");
    expect(getGreetingForHour(5)).toBe("Good morning.");
    expect(getGreetingForHour(11)).toBe("Good morning.");
  });

  it('returns "Good afternoon." for times between 12:00 and 16:59', () => {
    expect(getGreetingForHour(12)).toBe("Good afternoon.");
    expect(getGreetingForHour(15)).toBe("Good afternoon.");
    expect(getGreetingForHour(16)).toBe("Good afternoon.");
  });

  it('returns "Good evening." for times between 17:00 and 23:59', () => {
    expect(getGreetingForHour(17)).toBe("Good evening.");
    expect(getGreetingForHour(20)).toBe("Good evening.");
    expect(getGreetingForHour(23)).toBe("Good evening.");
  });
});

describe("Relative Time Formatting Utility", () => {
  it("formats past timestamps into relative text", () => {
    const baseTime = new Date("2026-08-28T12:00:00Z");

    // 30 seconds ago -> "Just now"
    const justNowTime = new Date("2026-08-28T11:59:30Z");
    expect(formatRelativeTime(justNowTime, baseTime)).toBe("Just now");

    // 1 minute ago -> "1 minute ago"
    const oneMinTime = new Date("2026-08-28T11:59:00Z");
    expect(formatRelativeTime(oneMinTime, baseTime)).toBe("1 minute ago");

    // 15 minutes ago -> "15 minutes ago"
    const minsTime = new Date("2026-08-28T11:45:00Z");
    expect(formatRelativeTime(minsTime, baseTime)).toBe("15 minutes ago");

    // 1 hour ago -> "1 hour ago"
    const oneHourTime = new Date("2026-08-28T11:00:00Z");
    expect(formatRelativeTime(oneHourTime, baseTime)).toBe("1 hour ago");

    // 4 hours ago -> "4 hours ago"
    const hoursTime = new Date("2026-08-28T08:00:00Z");
    expect(formatRelativeTime(hoursTime, baseTime)).toBe("4 hours ago");

    // Yesterday
    const yesterdayTime = new Date("2026-08-27T12:00:00Z");
    expect(formatRelativeTime(yesterdayTime, baseTime)).toBe("Yesterday");

    // 3 days ago
    const daysTime = new Date("2026-08-25T12:00:00Z");
    expect(formatRelativeTime(daysTime, baseTime)).toBe("3 days ago");

    // More than 7 days -> formats localized date
    const olderTime = new Date("2026-08-10T12:00:00Z");
    expect(formatRelativeTime(olderTime, baseTime)).toBe("Aug 10, 2026");
  });

  it("handles clock skews/future dates gracefully", () => {
    const baseTime = new Date("2026-08-28T12:00:00Z");
    const futureTime = new Date("2026-08-28T12:05:00Z");

    expect(formatRelativeTime(futureTime, baseTime)).toBe("Just now");
  });

  it("handles invalid dates gracefully", () => {
    expect(formatRelativeTime("invalid-date-string")).toBe("Invalid date");
  });
});

describe("Activity Sorting Logic", () => {
  it("sorts multiple activities in descending chronological order", () => {
    const mockActivities = [
      { id: "1", title: "A", timestamp: "2026-08-28T10:00:00Z" },
      { id: "2", title: "B", timestamp: "2026-08-28T12:00:00Z" },
      { id: "3", title: "C", timestamp: "2026-08-28T09:00:00Z" },
    ];

    const sorted = [...mockActivities].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    expect(sorted[0].id).toBe("2"); // Latest (12:00)
    expect(sorted[1].id).toBe("1"); // Middle (10:00)
    expect(sorted[2].id).toBe("3"); // Oldest (09:00)
  });
});
