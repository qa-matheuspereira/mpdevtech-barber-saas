import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { appointments, queues, clients, services, barbers, establishments } from "../../drizzle/schema";
import { eq, and, gte, lte, ne } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { checkAllConflicts, getAvailableTimeSlots } from "../helpers/conflictChecker";

export const appointmentRouter = router({
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

      const conditions = [eq(appointments.establishmentId, input.establishmentId)];
      if (input.startDate) conditions.push(gte(appointments.scheduledTime, input.startDate));
      if (input.endDate) conditions.push(lte(appointments.scheduledTime, input.endDate));
      if (input.status) conditions.push(eq(appointments.status, input.status));

      return db
        .select({
          id: appointments.id,
          status: appointments.status,
          appointmentType: appointments.appointmentType,
          scheduledTime: appointments.scheduledTime,
          queuePosition: appointments.queuePosition,
          notes: appointments.notes,
          createdAt: appointments.createdAt,
          clientId: appointments.clientId,
          serviceId: appointments.serviceId,
          barberId: appointments.barberId,
          clientName: clients.name,
          clientPhone: clients.phone,
          serviceName: services.name,
          servicePrice: services.price,
          serviceDuration: services.durationMinutes,
          professionalName: barbers.name,
        })
        .from(appointments)
        .leftJoin(clients, eq(appointments.clientId, clients.id))
        .leftJoin(services, eq(appointments.serviceId, services.id))
        .leftJoin(barbers, eq(appointments.barberId, barbers.id))
        .where(and(...conditions))
        .orderBy(appointments.scheduledTime);
    }),

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

      const conflicts = await checkAllConflicts(
        input.establishmentId, input.scheduledTime, input.durationMinutes, input.barberId
      );

      if (conflicts.hasAnyConflict) {
        throw new TRPCError({ code: "CONFLICT", message: conflicts.message || "Horário indisponível" });
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
      }).returning({ id: appointments.id });

      return result[0];
    }),

  addToQueue: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      clientId: z.number(),
      serviceId: z.number(),
      barberId: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const lastQueueItems = await db.select().from(queues)
        .where(eq(queues.establishmentId, input.establishmentId));

      const nextPosition = (lastQueueItems.length || 0) + 1;

      const appointmentResult = await db.insert(appointments).values({
        establishmentId: input.establishmentId,
        clientId: input.clientId,
        serviceId: input.serviceId,
        barberId: input.barberId,
        appointmentType: "queue",
        status: "pending",
        notes: input.notes,
      }).returning({ id: appointments.id });

      const appointmentId = appointmentResult[0]?.id ?? 0;

      await db.insert(queues).values({
        establishmentId: input.establishmentId,
        appointmentId,
        position: nextPosition,
      });

      return { success: true, queuePosition: nextPosition };
    }),

  getAvailableSlots: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      date: z.date(),
      barberId: z.number().optional(),
      slotDurationMinutes: z.number().default(30),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return getAvailableTimeSlots(input.establishmentId, input.date, input.slotDurationMinutes, input.barberId);
    }),

  getAvailableSlotsPublic: publicProcedure
    .input(z.object({
      establishmentId: z.number(),
      date: z.date(),
      barberId: z.number().optional(),
      slotDurationMinutes: z.number().default(30),
    }))
    .query(async ({ input }) => {
      return getAvailableTimeSlots(input.establishmentId, input.date, input.slotDurationMinutes, input.barberId);
    }),

  bookPublic: publicProcedure
    .input(z.object({
      establishmentId: z.number(),
      serviceId: z.number(),
      barberId: z.number().optional(),
      clientName: z.string().min(2),
      clientPhone: z.string().min(8),
      scheduledTime: z.date().optional(),
      bookingMode: z.enum(["scheduled", "queue"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get or create client
      const existing = await db.select().from(clients).where(
        and(eq(clients.phone, input.clientPhone), eq(clients.establishmentId, input.establishmentId))
      ).limit(1);

      let clientId: number;
      if (existing.length > 0) {
        clientId = existing[0].id;
      } else {
        const inserted = await db.insert(clients).values({
          establishmentId: input.establishmentId,
          name: input.clientName,
          phone: input.clientPhone,
          whatsapp: input.clientPhone,
        }).returning({ id: clients.id });
        clientId = inserted[0].id;
      }

      // Get service duration
      const [service] = await db.select().from(services).where(eq(services.id, input.serviceId)).limit(1);
      const duration = service?.durationMinutes ?? 60;

      if (input.bookingMode === "scheduled") {
        if (!input.scheduledTime) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Horário é obrigatório para agendamento marcado" });
        }

        const conflicts = await checkAllConflicts(
          input.establishmentId, input.scheduledTime, duration, input.barberId
        );

        if (conflicts.hasAnyConflict) {
          throw new TRPCError({ code: "CONFLICT", message: conflicts.message || "Horário indisponível" });
        }

        const result = await db.insert(appointments).values({
          establishmentId: input.establishmentId,
          clientId,
          barberId: input.barberId,
          serviceId: input.serviceId,
          appointmentType: "scheduled",
          scheduledTime: input.scheduledTime,
          status: "confirmed",
          notes: input.notes,
        }).returning({ id: appointments.id });

        return { success: true, appointmentId: result[0].id, mode: "scheduled" };
      } else {
        const queueItems = await db.select().from(queues)
          .where(eq(queues.establishmentId, input.establishmentId));

        const nextPosition = queueItems.length + 1;

        const apptResult = await db.insert(appointments).values({
          establishmentId: input.establishmentId,
          clientId,
          barberId: input.barberId,
          serviceId: input.serviceId,
          appointmentType: "queue",
          status: "pending",
          notes: input.notes,
        }).returning({ id: appointments.id });

        await db.insert(queues).values({
          establishmentId: input.establishmentId,
          appointmentId: apptResult[0].id,
          position: nextPosition,
        });

        return { success: true, appointmentId: apptResult[0].id, queuePosition: nextPosition, mode: "queue" };
      }
    }),

  getByIdPublic: publicProcedure
    .input(z.object({
      appointmentId: z.number(),
      clientPhone: z.string().min(8),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const result = await db
        .select({
          id: appointments.id,
          status: appointments.status,
          appointmentType: appointments.appointmentType,
          scheduledTime: appointments.scheduledTime,
          notes: appointments.notes,
          clientName: clients.name,
          clientPhone: clients.phone,
          serviceName: services.name,
          servicePrice: services.price,
          professionalName: barbers.name,
          establishmentName: establishments.name,
        })
        .from(appointments)
        .leftJoin(clients, eq(appointments.clientId, clients.id))
        .leftJoin(services, eq(appointments.serviceId, services.id))
        .leftJoin(barbers, eq(appointments.barberId, barbers.id))
        .leftJoin(establishments, eq(appointments.establishmentId, establishments.id))
        .where(eq(appointments.id, input.appointmentId))
        .limit(1);

      if (!result.length) throw new TRPCError({ code: "NOT_FOUND", message: "Agendamento não encontrado" });

      const apt = result[0];
      if (apt.clientPhone !== input.clientPhone) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado a este agendamento" });
      }

      return apt;
    }),

  cancelByClient: publicProcedure
    .input(z.object({
      appointmentId: z.number(),
      clientPhone: z.string().min(8),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [apt] = await db
        .select({ id: appointments.id, status: appointments.status, scheduledTime: appointments.scheduledTime, clientPhone: clients.phone })
        .from(appointments)
        .leftJoin(clients, eq(appointments.clientId, clients.id))
        .where(eq(appointments.id, input.appointmentId))
        .limit(1);

      if (!apt) throw new TRPCError({ code: "NOT_FOUND", message: "Agendamento não encontrado" });
      if (apt.clientPhone !== input.clientPhone) throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      if (apt.status === "cancelled") throw new TRPCError({ code: "BAD_REQUEST", message: "Agendamento já cancelado" });
      if (apt.status === "completed") throw new TRPCError({ code: "BAD_REQUEST", message: "Agendamento já concluído" });

      await db.update(appointments).set({ status: "cancelled" }).where(eq(appointments.id, input.appointmentId));

      return { success: true };
    }),

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
        input.establishmentId, input.scheduledTime, input.durationMinutes, input.barberId
      );
      return { available: !conflicts.hasAnyConflict, conflicts };
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      appointmentId: z.number(),
      status: z.enum(["pending", "confirmed", "in_progress", "completed", "cancelled", "no_show"]),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db.update(appointments).set({ status: input.status }).where(eq(appointments.id, input.appointmentId));
      return { success: true };
    }),

  cancel: protectedProcedure
    .input(z.object({ appointmentId: z.number(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db.update(appointments).set({ status: "cancelled" }).where(eq(appointments.id, input.appointmentId));
      return { success: true };
    }),

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

      const [current] = await db.select().from(appointments).where(eq(appointments.id, input.appointmentId)).limit(1);
      if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Agendamento não encontrado" });

      if (input.scheduledTime) {
        const conflicts = await checkAllConflicts(
          current.establishmentId,
          input.scheduledTime,
          input.durationMinutes || 60,
          input.barberId ?? current.barberId ?? undefined,
          input.appointmentId
        );
        if (conflicts.hasAnyConflict) {
          throw new TRPCError({ code: "CONFLICT", message: conflicts.message || "Horário indisponível" });
        }
      }

      const updateData: any = {};
      if (input.clientId !== undefined) updateData.clientId = input.clientId;
      if (input.serviceId !== undefined) updateData.serviceId = input.serviceId;
      if (input.scheduledTime !== undefined) updateData.scheduledTime = input.scheduledTime;
      if (input.barberId !== undefined) updateData.barberId = input.barberId;
      if (input.notes !== undefined) updateData.notes = input.notes;

      await db.update(appointments).set(updateData).where(eq(appointments.id, input.appointmentId));
      return { success: true };
    }),
});
