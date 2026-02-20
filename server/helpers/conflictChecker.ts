import { getDb } from "../db";
import { breaks, timeBlocks, appointments } from "../../drizzle/schema";
import { eq, and, or, gte, lte, isNull } from "drizzle-orm";

export async function hasBreakConflict(
  establishmentId: number,
  appointmentDate: Date,
  startTime: number,
  durationMinutes: number,
  barberId?: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const dayOfWeek = appointmentDate.getDay();

  const conditions: any[] = [
    eq(breaks.establishmentId, establishmentId),
    eq(breaks.isActive, true)
  ];

  if (barberId) {
    conditions.push(or(eq(breaks.barberId, barberId), isNull(breaks.barberId)));
  }

  const relevantBreaks = await db.select().from(breaks).where(and(...conditions));

  for (const breakItem of relevantBreaks) {
    if (!breakItem.daysOfWeek) continue;

    const daysArray = Array.isArray(breakItem.daysOfWeek) 
      ? breakItem.daysOfWeek 
      : JSON.parse(breakItem.daysOfWeek as any);

    if (!daysArray.includes(dayOfWeek)) continue;

    const [breakStartHour, breakStartMin] = breakItem.startTime.split(":").map(Number);
    const [breakEndHour, breakEndMin] = breakItem.endTime.split(":").map(Number);

    const breakStartMinutes = breakStartHour * 60 + breakStartMin;
    const breakEndMinutes = breakEndHour * 60 + breakEndMin;

    const appointmentEndTime = startTime + durationMinutes;

    if (startTime < breakEndMinutes && appointmentEndTime > breakStartMinutes) {
      return true;
    }
  }

  return false;
}

export async function hasTimeBlockConflict(
  establishmentId: number,
  appointmentDateTime: Date,
  durationMinutes: number,
  barberId?: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const appointmentEndTime = new Date(appointmentDateTime.getTime() + durationMinutes * 60000);

  const conditions: any[] = [
    eq(timeBlocks.establishmentId, establishmentId),
    lte(timeBlocks.startTime, appointmentEndTime),
    gte(timeBlocks.endTime, appointmentDateTime)
  ];

  if (barberId) {
    conditions.push(or(eq(timeBlocks.barberId, barberId), isNull(timeBlocks.barberId)));
  }

  const conflictingBlocks = await db.select().from(timeBlocks).where(and(...conditions));
  return conflictingBlocks.length > 0;
}

export async function hasAppointmentConflict(
  establishmentId: number,
  appointmentDateTime: Date,
  durationMinutes: number,
  barberId?: number,
  excludeAppointmentId?: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const appointmentEndTime = new Date(appointmentDateTime.getTime() + durationMinutes * 60000);

  const conditions: any[] = [
    eq(appointments.establishmentId, establishmentId),
    or(
      eq(appointments.status, "confirmed"),
      eq(appointments.status, "in_progress")
    ),
    lte(appointments.scheduledTime, appointmentEndTime),
    gte(appointments.scheduledTime, appointmentDateTime)
  ];

  if (barberId) {
    conditions.push(eq(appointments.barberId, barberId));
  }

  const allConflicts = await db.select().from(appointments).where(and(...conditions));

  if (excludeAppointmentId) {
    return allConflicts.some(apt => apt.id !== excludeAppointmentId);
  }

  return allConflicts.length > 0;
}

export async function checkAllConflicts(
  establishmentId: number,
  appointmentDateTime: Date,
  durationMinutes: number,
  barberId?: number,
  excludeAppointmentId?: number
): Promise<{
  hasBreakConflict: boolean;
  hasTimeBlockConflict: boolean;
  hasAppointmentConflict: boolean;
  hasAnyConflict: boolean;
  message?: string;
}> {
  const breakConflictResult = await hasBreakConflict(
    establishmentId,
    appointmentDateTime,
    appointmentDateTime.getHours() * 60 + appointmentDateTime.getMinutes(),
    durationMinutes,
    barberId
  );

  const timeBlockConflictResult = await hasTimeBlockConflict(
    establishmentId,
    appointmentDateTime,
    durationMinutes,
    barberId
  );

  const appointmentConflictResult = await hasAppointmentConflict(
    establishmentId,
    appointmentDateTime,
    durationMinutes,
    barberId,
    excludeAppointmentId
  );

  const hasAnyConflict = breakConflictResult || timeBlockConflictResult || appointmentConflictResult;

  let message = "";
  if (breakConflictResult) {
    message = "Este horário conflita com uma pausa agendada";
  } else if (timeBlockConflictResult) {
    message = "Este horário conflita com um bloqueio de tempo";
  } else if (appointmentConflictResult) {
    message = "Este horário conflita com outro agendamento";
  }

  return {
    hasBreakConflict: breakConflictResult,
    hasTimeBlockConflict: timeBlockConflictResult,
    hasAppointmentConflict: appointmentConflictResult,
    hasAnyConflict,
    message,
  };
}

export async function getAvailableTimeSlots(
  establishmentId: number,
  appointmentDate: Date,
  slotDurationMinutes: number = 30,
  barberId?: number
): Promise<{ startTime: string; endTime: string; available: boolean }[]> {
  const db = await getDb();
  if (!db) return [];

  const slots: { startTime: string; endTime: string; available: boolean }[] = [];

  const startHour = 9;
  const endHour = 18;

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += slotDurationMinutes) {
      const slotStartMinutes = hour * 60 + minute;
      const slotEndMinutes = slotStartMinutes + slotDurationMinutes;

      if (slotEndMinutes > endHour * 60) break;

      const slotStartDate = new Date(appointmentDate);
      slotStartDate.setHours(hour, minute, 0, 0);

      const hasConflict = await checkAllConflicts(
        establishmentId,
        slotStartDate,
        slotDurationMinutes,
        barberId
      );

      const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      const endTimeStr = `${String(Math.floor(slotEndMinutes / 60)).padStart(2, "0")}:${String(slotEndMinutes % 60).padStart(2, "0")}`;

      slots.push({
        startTime: timeStr,
        endTime: endTimeStr,
        available: !hasConflict.hasAnyConflict,
      });
    }
  }

  return slots;
}
