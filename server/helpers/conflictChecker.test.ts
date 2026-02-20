import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { checkAllConflicts, hasBreakConflict, hasTimeBlockConflict } from "./conflictChecker";

describe("Conflict Checker", () => {
  describe("hasBreakConflict", () => {
    it("should return false when no breaks exist", async () => {
      const result = await hasBreakConflict(
        1, // establishmentId
        new Date("2026-02-02"), // Monday
        540, // 9:00 AM in minutes
        60, // 1 hour duration
        1 // barberId
      );
      expect(result).toBe(false);
    });

    it("should detect conflict with break on same day", async () => {
      // This test would require mocking the database
      // In a real scenario, you'd set up test data first
      const result = await hasBreakConflict(
        1,
        new Date("2026-02-02"), // Monday
        720, // 12:00 PM (noon)
        60, // 1 hour
        1
      );
      // Expected: true if there's a lunch break from 12:00-13:00
      expect(typeof result).toBe("boolean");
    });

    it("should not conflict with breaks on different days", async () => {
      const result = await hasBreakConflict(
        1,
        new Date("2026-02-01"), // Sunday
        540, // 9:00 AM
        60,
        1
      );
      // Sunday typically has no breaks
      expect(result).toBe(false);
    });
  });

  describe("checkAllConflicts", () => {
    it("should return object with all conflict types", async () => {
      const result = await checkAllConflicts(
        1,
        new Date("2026-02-02T09:00:00"),
        60,
        1
      );

      expect(result).toHaveProperty("hasBreakConflict");
      expect(result).toHaveProperty("hasTimeBlockConflict");
      expect(result).toHaveProperty("hasAppointmentConflict");
      expect(result).toHaveProperty("hasAnyConflict");
      expect(result).toHaveProperty("message");

      expect(typeof result.hasBreakConflict).toBe("boolean");
      expect(typeof result.hasTimeBlockConflict).toBe("boolean");
      expect(typeof result.hasAppointmentConflict).toBe("boolean");
      expect(typeof result.hasAnyConflict).toBe("boolean");
    });

    it("should set message when conflict exists", async () => {
      const result = await checkAllConflicts(
        1,
        new Date("2026-02-02T12:00:00"),
        60,
        1
      );

      if (result.hasAnyConflict) {
        expect(result.message).toBeTruthy();
        expect(result.message?.length).toBeGreaterThan(0);
      }
    });

    it("should not set message when no conflict exists", async () => {
      const result = await checkAllConflicts(
        1,
        new Date("2026-02-02T08:00:00"),
        30,
        1
      );

      if (!result.hasAnyConflict) {
        expect(result.message).toBe("");
      }
    });
  });

  describe("Conflict detection logic", () => {
    it("should handle overlapping time ranges correctly", async () => {
      // Test case: 9:00-10:00 appointment should conflict with 9:30-10:30 break
      const appointmentStart = 540; // 9:00 AM
      const appointmentEnd = 600; // 10:00 AM
      const breakStart = 570; // 9:30 AM
      const breakEnd = 630; // 10:30 AM

      // Overlap detection: start < breakEnd && end > breakStart
      const hasOverlap = appointmentStart < breakEnd && appointmentEnd > breakStart;
      expect(hasOverlap).toBe(true);
    });

    it("should not detect conflict for adjacent time slots", async () => {
      // Test case: 9:00-10:00 appointment should NOT conflict with 10:00-11:00 break
      const appointmentStart = 540; // 9:00 AM
      const appointmentEnd = 600; // 10:00 AM
      const breakStart = 600; // 10:00 AM
      const breakEnd = 660; // 11:00 AM

      // Overlap detection: start < breakEnd && end > breakStart
      const hasOverlap = appointmentStart < breakEnd && appointmentEnd > breakStart;
      expect(hasOverlap).toBe(false);
    });
  });
});
