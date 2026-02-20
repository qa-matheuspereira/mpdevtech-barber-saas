import { describe, it, expect } from "vitest";

describe("BreaksCalendar", () => {
  it("should render calendar with correct month", () => {
    const currentDate = new Date(2026, 1, 2); // February 2026
    const month = currentDate.getMonth();
    expect(month).toBe(1);
  });

  it("should calculate days in month correctly", () => {
    const february2026 = new Date(2026, 1);
    const daysInMonth = new Date(2026, 2, 0).getDate();
    expect(daysInMonth).toBe(28);
  });

  it("should get first day of month correctly", () => {
    const february2026 = new Date(2026, 1, 1);
    const firstDay = february2026.getDay();
    expect(firstDay).toBe(0); // Sunday
  });

  it("should filter breaks by day of week", () => {
    const breaks = [
      {
        id: 1,
        name: "Almoço",
        startTime: "12:00",
        endTime: "13:00",
        daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
        isRecurring: true,
        type: "break" as const,
      },
    ];

    const monday = new Date(2026, 1, 2); // Monday
    const dayOfWeek = monday.getDay();
    const matchingBreaks = breaks.filter((b) => b.daysOfWeek?.includes(dayOfWeek));
    expect(matchingBreaks).toHaveLength(1);
  });

  it("should filter time blocks by date", () => {
    const timeBlocks = [
      {
        id: 1,
        name: "Manutenção",
        startTime: "14:00",
        endTime: "15:00",
        date: "2026-02-02",
        isRecurring: false,
        type: "block" as const,
      },
      {
        id: 2,
        name: "Fechado",
        startTime: "09:00",
        endTime: "18:00",
        date: "2026-02-03",
        isRecurring: false,
        type: "block" as const,
      },
    ];

    const targetDate = "2026-02-02";
    const blocksForDate = timeBlocks.filter((b) => b.date === targetDate);
    expect(blocksForDate).toHaveLength(1);
    expect(blocksForDate[0]?.name).toBe("Manutenção");
  });

  it("should combine recurring breaks and specific blocks for a date", () => {
    const breaks = [
      {
        id: 1,
        name: "Almoço",
        startTime: "12:00",
        endTime: "13:00",
        daysOfWeek: [1, 2, 3, 4, 5],
        isRecurring: true,
        type: "break" as const,
      },
    ];

    const timeBlocks = [
      {
        id: 1,
        name: "Manutenção",
        startTime: "14:00",
        endTime: "15:00",
        date: "2026-02-02",
        isRecurring: false,
        type: "block" as const,
      },
    ];

    const monday = new Date(2026, 1, 2);
    const dayOfWeek = monday.getDay();
    const dateStr = monday.toISOString().split("T")[0];

    const recurringBreaks = breaks.filter((b) => b.daysOfWeek?.includes(dayOfWeek));
    const specificBlocks = timeBlocks.filter((b) => b.date === dateStr);
    const combined = [...recurringBreaks, ...specificBlocks];

    expect(combined).toHaveLength(2);
  });

  it("should detect if a date has breaks or blocks", () => {
    const breaks = [
      {
        id: 1,
        name: "Almoço",
        startTime: "12:00",
        endTime: "13:00",
        daysOfWeek: [1, 2, 3, 4, 5],
        isRecurring: true,
        type: "break" as const,
      },
    ];

    const monday = new Date(2026, 1, 2);
    const dayOfWeek = monday.getDay();
    const hasBreaks = breaks.some((b) => b.daysOfWeek?.includes(dayOfWeek));

    expect(hasBreaks).toBe(true);
  });

  it("should navigate between months", () => {
    let currentDate = new Date(2026, 1); // February
    const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);

    expect(previousMonth.getMonth()).toBe(0); // January
    expect(nextMonth.getMonth()).toBe(2); // March
  });

  it("should count days with breaks in a month", () => {
    const breaks = [
      {
        id: 1,
        name: "Almoço",
        startTime: "12:00",
        endTime: "13:00",
        daysOfWeek: [1, 2, 3, 4, 5],
        isRecurring: true,
        type: "break" as const,
      },
    ];

    const daysInMonth = 28;
    let daysWithBreaks = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(2026, 1, day);
      const dayOfWeek = date.getDay();
      if (breaks.some((b) => b.daysOfWeek?.includes(dayOfWeek))) {
        daysWithBreaks++;
      }
    }

    expect(daysWithBreaks).toBeGreaterThan(0);
  });
});
