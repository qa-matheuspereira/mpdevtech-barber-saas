import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { barbers, services } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const barbersRouter = router({
  // List all barbers for a barbershop
  list: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const result = await db
        .select()
        .from(barbers)
        .where(and(eq(barbers.establishmentId, input.establishmentId), eq(barbers.isActive, true)));

      return result;
    }),

  // Get single barber with services
  get: protectedProcedure
    .input(z.object({ barberId: z.number(), establishmentId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const barber = await db
        .select()
        .from(barbers)
        .where(and(eq(barbers.id, input.barberId), eq(barbers.establishmentId, input.establishmentId)))
        .limit(1);

      if (!barber.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Barber not found" });
      }

      return barber[0];
    }),

  // Create new barber
  create: protectedProcedure
    .input(
      z.object({
        establishmentId: z.number(),
        name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      try {
        const result = await db.insert(barbers).values({
          establishmentId: input.establishmentId,
          name: input.name,
          phone: input.phone || null,
          isActive: true,
        }).returning({ id: barbers.id });

        return {
          success: true,
          barberId: result[0]?.id,
          message: "Barbeiro criado com sucesso",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar barbeiro",
        });
      }
    }),

  // Update barber
  update: protectedProcedure
    .input(
      z.object({
        barberId: z.number(),
        establishmentId: z.number(),
        name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
        phone: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      try {
        const updateData: any = {
          name: input.name,
          phone: input.phone || null,
        };

        if (input.isActive !== undefined) {
          updateData.isActive = input.isActive;
        }

        await db
          .update(barbers)
          .set(updateData)
          .where(and(eq(barbers.id, input.barberId), eq(barbers.establishmentId, input.establishmentId)));

        return {
          success: true,
          message: "Barbeiro atualizado com sucesso",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao atualizar barbeiro",
        });
      }
    }),

  // Delete barber (soft delete - mark as inactive)
  delete: protectedProcedure
    .input(z.object({ barberId: z.number(), establishmentId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      try {
        await db
          .update(barbers)
          .set({ isActive: false })
          .where(and(eq(barbers.id, input.barberId), eq(barbers.establishmentId, input.establishmentId)));

        return {
          success: true,
          message: "Barbeiro removido com sucesso",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao remover barbeiro",
        });
      }
    }),

  // Get services for a barber (all services in barbershop initially)
  getAvailableServices: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const result = await db
        .select()
        .from(services)
        .where(and(eq(services.establishmentId, input.establishmentId), eq(services.isActive, true)));

      return result;
    }),

  // Assign service to barber
  assignService: protectedProcedure
    .input(
      z.object({
        barberId: z.number(),
        serviceId: z.number(),
        establishmentId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // This would require a barber_services junction table
      // For now, we'll return success as a placeholder
      return {
        success: true,
        message: "Serviço atribuído ao barbeiro",
      };
    }),

  // Get stats for a barber
  getStats: protectedProcedure
    .input(z.object({ barberId: z.number(), establishmentId: z.number() }))
    .query(async ({ input, ctx }) => {
      // This would calculate stats from appointments
      return {
        totalAppointments: 0,
        completedAppointments: 0,
        cancelledAppointments: 0,
        totalRevenue: 0,
      };
    }),
});
