import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { breaks as breaksTable } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const barberBreaksRouter = router({
  // List breaks for a specific barber
  listForBarber: protectedProcedure
    .input(z.object({ barberId: z.number(), establishmentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      return await db
        .select()
        .from(breaksTable)
        .where(
          and(
            eq(breaksTable.barberId, input.barberId),
            eq(breaksTable.establishmentId, input.establishmentId)
          )
        );
    }),

  // Create break for barber
  create: protectedProcedure
    .input(
      z.object({
        barberId: z.number(),
        establishmentId: z.number(),
        name: z.string().min(1, "Nome é obrigatório"),
        startTime: z.string(), // HH:mm format
        endTime: z.string(), // HH:mm format
        daysOfWeek: z.array(z.number().min(0).max(6)), // 0 = Sunday, 6 = Saturday
        isRecurring: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Validate times
      const [startHour, startMin] = input.startTime.split(":").map(Number);
      const [endHour, endMin] = input.endTime.split(":").map(Number);
      const startTotalMin = startHour * 60 + startMin;
      const endTotalMin = endHour * 60 + endMin;

      if (startTotalMin >= endTotalMin) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Hora de início deve ser anterior à hora de término",
        });
      }

      try {
        const result = await db.insert(breaksTable).values({
          barberId: input.barberId || null,
          establishmentId: input.establishmentId,
          name: input.name,
          startTime: input.startTime,
          endTime: input.endTime,
          daysOfWeek: input.daysOfWeek,
          isRecurring: input.isRecurring,
          isActive: true,
        });

        return {
          success: true,
          breakId: (result as any).insertId,
          message: "Pausa criada com sucesso",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar pausa",
        });
      }
    }),

  // Update break
  update: protectedProcedure
    .input(
      z.object({
        breakId: z.number(),
        barberId: z.number(),
        establishmentId: z.number(),
        name: z.string().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        daysOfWeek: z.array(z.number()).optional(),
        isRecurring: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        const updateData: any = {};

        if (input.name) updateData.name = input.name;
        if (input.startTime) updateData.startTime = input.startTime;
        if (input.endTime) updateData.endTime = input.endTime;
        if (input.daysOfWeek) updateData.daysOfWeek = input.daysOfWeek;
        if (input.isRecurring !== undefined) updateData.isRecurring = input.isRecurring;

        await db
          .update(breaksTable)
          .set(updateData)
          .where(
            and(
              eq(breaksTable.id, input.breakId),
              eq(breaksTable.barberId, input.barberId),
              eq(breaksTable.establishmentId, input.establishmentId)
            )
          );

        return {
          success: true,
          message: "Pausa atualizada com sucesso",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao atualizar pausa",
        });
      }
    }),

  // Delete break
  delete: protectedProcedure
    .input(z.object({ breakId: z.number(), barberId: z.number(), establishmentId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        await db
          .delete(breaksTable)
          .where(
            and(
              eq(breaksTable.id, input.breakId),
              eq(breaksTable.barberId, input.barberId),
              eq(breaksTable.establishmentId, input.establishmentId)
            )
          );

        return {
          success: true,
          message: "Pausa removida com sucesso",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao remover pausa",
        });
      }
    }),

  // Get breaks for multiple barbers
  listForMultipleBarbers: protectedProcedure
    .input(z.object({ barberIds: z.array(z.number()), establishmentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const breaks = await db
        .select()
        .from(breaksTable)
        .where(eq(breaksTable.establishmentId, input.establishmentId));

      return breaks.filter((b) => input.barberIds.includes(b.barberId || 0));
    }),
});
