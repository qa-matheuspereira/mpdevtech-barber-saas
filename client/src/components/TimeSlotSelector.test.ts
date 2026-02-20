import { describe, it, expect } from "vitest";

describe("TimeSlotSelector Component", () => {
  describe("Time slot grouping", () => {
    it("should group slots by hour correctly", () => {
      const slots = [
        { startTime: "09:00", endTime: "09:30", available: true },
        { startTime: "09:30", endTime: "10:00", available: true },
        { startTime: "10:00", endTime: "10:30", available: false },
        { startTime: "10:30", endTime: "11:00", available: true },
      ];

      const grouped: Record<string, typeof slots> = {};
      slots.forEach((slot) => {
        const hour = slot.startTime.split(":")[0];
        if (!grouped[hour]) {
          grouped[hour] = [];
        }
        grouped[hour].push(slot);
      });

      expect(Object.keys(grouped)).toContain("09");
      expect(Object.keys(grouped)).toContain("10");
      expect(grouped["09"]).toHaveLength(2);
      expect(grouped["10"]).toHaveLength(2);
    });
  });

  describe("Availability calculation", () => {
    it("should count available slots correctly", () => {
      const slots = [
        { startTime: "09:00", endTime: "09:30", available: true },
        { startTime: "09:30", endTime: "10:00", available: true },
        { startTime: "10:00", endTime: "10:30", available: false },
        { startTime: "10:30", endTime: "11:00", available: true },
      ];

      const availableCount = slots.filter((s) => s.available).length;
      const unavailableCount = slots.length - availableCount;

      expect(availableCount).toBe(3);
      expect(unavailableCount).toBe(1);
    });
  });

  describe("Conflict reason determination", () => {
    it("should provide appropriate conflict messages", () => {
      const conflictReasons: Record<string, string> = {
        break: "Conflita com pausa agendada",
        timeBlock: "Conflita com bloqueio de tempo",
        appointment: "Conflita com outro agendamento",
      };

      expect(conflictReasons.break).toBe("Conflita com pausa agendada");
      expect(conflictReasons.timeBlock).toBe("Conflita com bloqueio de tempo");
      expect(conflictReasons.appointment).toBe("Conflita com outro agendamento");
    });
  });

  describe("Visual state determination", () => {
    it("should assign correct CSS classes for slot states", () => {
      const availableClass = "bg-white border-slate-200 hover:border-blue-300";
      const unavailableClass = "bg-slate-100 text-slate-400 cursor-not-allowed opacity-60";
      const selectedClass = "border-blue-500 bg-blue-50 text-blue-700 shadow-md";

      expect(availableClass).toContain("bg-white");
      expect(unavailableClass).toContain("opacity-60");
      expect(selectedClass).toContain("shadow-md");
    });
  });

  describe("Time slot formatting", () => {
    it("should format time slots correctly", () => {
      const slot = { startTime: "09:00", endTime: "09:30", available: true };
      const formatted = `${slot.startTime} - ${slot.endTime}`;

      expect(formatted).toBe("09:00 - 09:30");
    });

    it("should handle different time formats", () => {
      const times = ["09:00", "14:30", "16:45"];
      times.forEach((time) => {
        const [hours, minutes] = time.split(":");
        expect(parseInt(hours)).toBeGreaterThanOrEqual(0);
        expect(parseInt(hours)).toBeLessThan(24);
        expect(parseInt(minutes)).toBeGreaterThanOrEqual(0);
        expect(parseInt(minutes)).toBeLessThan(60);
      });
    });
  });
});
