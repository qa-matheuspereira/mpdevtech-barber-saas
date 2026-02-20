import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { appointments, queues, clients } from "../../drizzle/schema";
import { eq, and, gte, lte, isNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { checkAllConflicts, getAvailableTimeSlots } from "../helpers/conflictChecker";
import {
  sendConfirmationNotification,
  sendReminderNotification,
  sendStartedNotification,
  sendCompletedNotification,
  sendQueuePositionNotification,
} from "../services/notifications";

export const appointmentRouter = router({
  // List appointments for a barbershop
  list: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      status: z.enum(["pending", "confirmed", "in_progress", "completed", "cancelled", "no_show"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const query = db.select().from(appointments).where(
        eq(appointments.establishmentId, input.establishmentId)
      );

      return query;
    }),

  // Create scheduled appointment with conflict checking
  createScheduled: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      clientId: z.number(),
      barberId: z.number().optional(),
      serviceId: z.number(),
      scheduledTime: z.date(),
      durationMinutes: z.number().default(60),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Check for conflicts with breaks, time blocks, and other appointments
      const conflicts = await checkAllConflicts(
        input.establishmentId,
        input.scheduledTime,
        input.durationMinutes,
        input.barberId
      );

      if (conflicts.hasAnyConflict) {
        throw new TRPCError({
          code: "CONFLICT",
          message: conflicts.message || "Horário indisponível",
        });
      }

      const result = await db.insert(appointments).values({
        establishmentId: input.establishmentId,
        clientId: input.clientId,
        barberId: input.barberId,
        serviceId: input.serviceId,
        appointmentType: "scheduled",
        scheduledTime: input.scheduledTime,
        status: "confirmed",
        notes: input.notes,
      });

      return result;
    }),

  // Add client to queue
  addToQueue: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      clientId: z.number(),
      serviceId: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get next queue position
      const lastQueueItem = await db.select().from(queues)
        .where(eq(queues.establishmentId, input.establishmentId));

      const nextPosition = (lastQueueItem.length || 0) + 1;

      // Create appointment
      const appointmentResult = await db.insert(appointments).values({
        establishmentId: input.establishmentId,
        clientId: input.clientId,
        serviceId: input.serviceId,
        appointmentType: "queue",
        status: "pending",
        notes: input.notes,
      });

      // Add to queue
      const appointmentId = (appointmentResult as any).insertId || 0;
      const queueResult = await db.insert(queues).values({
        establishmentId: input.establishmentId,
        appointmentId: appointmentId as number,
        position: nextPosition,
      });

      return queueResult;
    }),

  // Get available time slots for a specific date
  getAvailableSlots: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      date: z.date(),
      barberId: z.number().optional(),
      slotDurationMinutes: z.number().default(30),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const slots = await getAvailableTimeSlots(
        input.establishmentId,
        input.date,
        input.slotDurationMinutes,
        input.barberId
      );
      return slots;
    }),

  // Check if a specific time slot is available
  checkAvailability: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      scheduledTime: z.date(),
      durationMinutes: z.number().default(60),
      barberId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const conflicts = await checkAllConflicts(
        input.establishmentId,
        input.scheduledTime,
        input.durationMinutes,
        input.barberId
      );
      return {
        available: !conflicts.hasAnyConflict,
        conflicts,
      };
    }),

  // Update appointment status
  updateStatus: protectedProcedure
    .input(z.object({
      appointmentId: z.number(),
      status: z.enum(["pending", "confirmed", "in_progress", "completed", "cancelled", "no_show"]),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const result = await db.update(appointments)
        .set({ status: input.status })
        .where(eq(appointments.id, input.appointmentId));

      return result;
    }),

  // Cancel appointment
  cancel: protectedProcedure
    .input(z.object({
      appointmentId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const result = await db.update(appointments)
        .set({ status: "cancelled" })
        .where(eq(appointments.id, input.appointmentId));

      return result;
    }),

  // Update appointment details (client, service, time)
  updateAppointment: protectedProcedure
    .input(z.object({
      appointmentId: z.number(),
      clientId: z.number().optional(),
      serviceId: z.number().optional(),
      scheduledTime: z.date().optional(),
      durationMinutes: z.number().optional(),
      barberId: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get the appointment to check barbershop and current details
      const appointmentData = await db.select().from(appointments)
        .where(eq(appointments.id, input.appointmentId));

      if (!appointmentData || appointmentData.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Agendamento não encontrado" });
      }

      const appointment = appointmentData[0];

      // If updating scheduled time, check for conflicts
      if (input.scheduledTime) {
        const conflicts = await checkAllConflicts(
          appointment.establishmentId,
          input.scheduledTime,
          input.durationMinutes || 60,
          input.barberId || appointment.barberId || undefined,
          input.appointmentId
        );

        if (conflicts.hasAnyConflict) {
          throw new TRPCError({
            code: "CONFLICT",
            message: conflicts.message || "Horário indisponível",
          });
        }
      }

      const updateData: any = {};
      if (input.clientId !== undefined) updateData.clientId = input.clientId;
      if (input.serviceId !== undefined) updateData.serviceId = input.serviceId;
      if (input.scheduledTime !== undefined) updateData.scheduledTime = input.scheduledTime;
      if (input.durationMinutes !== undefined) updateData.durationMinutes = input.durationMinutes;
      if (input.barberId !== undefined) updateData.barberId = input.barberId;
      if (input.notes !== undefined) updateData.notes = input.notes;

      const result = await db.update(appointments)
        .set(updateData)
        .where(eq(appointments.id, input.appointmentId));

      return result;
    }),
});
