import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { breaks, timeBlocks } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const breaksRouter = router({
  // Get all breaks for a barbershop
  getBreaks: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      barberId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const conditions = [eq(breaks.establishmentId, input.establishmentId)];
      if (input.barberId) {
        conditions.push(eq(breaks.barberId, input.barberId));
      }

      const result = await db.select().from(breaks).where(and(...conditions));
      return result.map((b) => ({
        ...b,
        daysOfWeek: b.daysOfWeek || [],
      }));
    }),

  // Create break
  createBreak: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      barberId: z.number().optional(),
      name: z.string().min(1, "Nome da pausa é obrigatório"),
      startTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm"),
      endTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm"),
      daysOfWeek: z.array(z.number().min(0).max(6)),
      isRecurring: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Validate times
      const [startHour, startMin] = input.startTime.split(":").map(Number);
      const [endHour, endMin] = input.endTime.split(":").map(Number);

      const startTimeMinutes = startHour * 60 + startMin;
      const endTimeMinutes = endHour * 60 + endMin;

      if (startTimeMinutes >= endTimeMinutes) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Horário de início deve ser anterior ao de término",
        });
      }

      const result = await db.insert(breaks).values({
        establishmentId: input.establishmentId,
        barberId: input.barberId,
        name: input.name,
        startTime: input.startTime,
        endTime: input.endTime,
        daysOfWeek: input.daysOfWeek,
        isRecurring: input.isRecurring,
        isActive: true,
      });

      return result;
    }),

  // Update break
  updateBreak: protectedProcedure
    .input(z.object({
      id: z.number(),
      establishmentId: z.number(),
      name: z.string().optional(),
      startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
      isRecurring: z.boolean().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Validate times if provided
      if (input.startTime && input.endTime) {
        const [startHour, startMin] = input.startTime.split(":").map(Number);
        const [endHour, endMin] = input.endTime.split(":").map(Number);

        const startTimeMinutes = startHour * 60 + startMin;
        const endTimeMinutes = endHour * 60 + endMin;

        if (startTimeMinutes >= endTimeMinutes) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Horário de início deve ser anterior ao de término",
          });
        }
      }

      const { id, establishmentId, ...updateData } = input;

      const result = await db.update(breaks)
        .set(updateData)
        .where(eq(breaks.id, id));

      return result;
    }),

  // Delete break
  deleteBreak: protectedProcedure
    .input(z.object({
      id: z.number(),
      establishmentId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const result = await db.delete(breaks)
        .where(eq(breaks.id, input.id));

      return result;
    }),

  // Get time blocks
  getTimeBlocks: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      barberId: z.number().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const conditions = [eq(timeBlocks.establishmentId, input.establishmentId)];
      if (input.barberId) {
        conditions.push(eq(timeBlocks.barberId, input.barberId));
      }

      const result = await db.select().from(timeBlocks).where(and(...conditions));
      return result;
    }),

  // Create time block
  createTimeBlock: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      barberId: z.number().optional(),
      title: z.string().min(1, "Título é obrigatório"),
      description: z.string().optional(),
      startTime: z.date(),
      endTime: z.date(),
      blockType: z.enum(["maintenance", "absence", "closed", "custom"]),
      isRecurring: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      if (input.startTime >= input.endTime) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Data/hora de início deve ser anterior à de término",
        });
      }

      const result = await db.insert(timeBlocks).values({
        establishmentId: input.establishmentId,
        barberId: input.barberId,
        title: input.title,
        description: input.description,
        startTime: input.startTime,
        endTime: input.endTime,
        blockType: input.blockType,
        isRecurring: input.isRecurring,
      });

      return result;
    }),

  // Update time block
  updateTimeBlock: protectedProcedure
    .input(z.object({
      id: z.number(),
      establishmentId: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      startTime: z.date().optional(),
      endTime: z.date().optional(),
      blockType: z.enum(["maintenance", "absence", "closed", "custom"]).optional(),
      isRecurring: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      if (input.startTime && input.endTime && input.startTime >= input.endTime) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Data/hora de início deve ser anterior à de término",
        });
      }

      const { id, establishmentId, ...updateData } = input;

      const result = await db.update(timeBlocks)
        .set(updateData)
        .where(eq(timeBlocks.id, id));

      return result;
    }),

  // Delete time block
  deleteTimeBlock: protectedProcedure
    .input(z.object({
      id: z.number(),
      establishmentId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const result = await db.delete(timeBlocks)
        .where(eq(timeBlocks.id, input.id));

      return result;
    }),
});
