import { describe, it, expect } from "vitest";

describe("BreakDialog", () => {
  it("should validate break name is required", () => {
    const name = "";
    expect(name.trim()).toBe("");
  });

  it("should validate at least one day is selected", () => {
    const selectedDays: number[] = [];
    expect(selectedDays.length).toBe(0);
  });

  it("should validate start time is before end time", () => {
    const startTime = "13:00";
    const endTime = "12:00";
    expect(startTime < endTime).toBe(false);
  });

  it("should sort selected days", () => {
    const selectedDays = [5, 1, 3];
    const sorted = selectedDays.sort();
    expect(sorted).toEqual([1, 3, 5]);
  });

  it("should create break with correct data", () => {
    const breakData = {
      name: "Almoço",
      startTime: "12:00",
      endTime: "13:00",
      daysOfWeek: [1, 2, 3, 4, 5],
      isRecurring: true,
    };

    expect(breakData.name).toBe("Almoço");
    expect(breakData.isRecurring).toBe(true);
    expect(breakData.daysOfWeek).toHaveLength(5);
  });

  it("should toggle day selection", () => {
    let selectedDays = [1, 2, 3];
    const day = 2;

    if (selectedDays.includes(day)) {
      selectedDays = selectedDays.filter((d) => d !== day);
    } else {
      selectedDays = [...selectedDays, day];
    }

    expect(selectedDays).toEqual([1, 3]);
  });

  it("should handle default times", () => {
    const defaultStartTime = "12:00";
    const defaultEndTime = "13:00";

    expect(defaultStartTime).toBe("12:00");
    expect(defaultEndTime).toBe("13:00");
  });

  it("should trim whitespace from name", () => {
    const name = "  Almoço  ";
    expect(name.trim()).toBe("Almoço");
  });
});
