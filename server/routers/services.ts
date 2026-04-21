import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { services, establishments } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

async function verifyEstablishmentOwnership(establishmentId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const [establishment] = await db
    .select({ id: establishments.id })
    .from(establishments)
    .where(and(eq(establishments.id, establishmentId), eq(establishments.ownerId, userId)))
    .limit(1);

  if (!establishment) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado a este estabelecimento" });
  }
}

export const serviceRouter = router({
  list: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      return db.select().from(services).where(
        and(eq(services.establishmentId, input.establishmentId), eq(services.isActive, true))
      );
    }),

  listPublic: publicProcedure
    .input(z.object({ establishmentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      return db.select().from(services).where(
        and(eq(services.establishmentId, input.establishmentId), eq(services.isActive, true))
      );
    }),

  create: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      name: z.string().min(1),
      description: z.string().optional(),
      durationMinutes: z.number().min(1),
      price: z.string().regex(/^\d+(\.\d{2})?$/),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      await verifyEstablishmentOwnership(input.establishmentId, ctx.user.id);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const result = await db.insert(services).values({
        establishmentId: input.establishmentId,
        name: input.name,
        description: input.description,
        durationMinutes: input.durationMinutes,
        price: input.price,
      }).returning({ id: services.id });

      return result[0];
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      establishmentId: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      durationMinutes: z.number().optional(),
      price: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      await verifyEstablishmentOwnership(input.establishmentId, ctx.user.id);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const { id, establishmentId, ...updateData } = input;
      await db.update(services).set(updateData).where(
        and(eq(services.id, id), eq(services.establishmentId, establishmentId))
      );

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number(), establishmentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      await verifyEstablishmentOwnership(input.establishmentId, ctx.user.id);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db.update(services).set({ isActive: false }).where(
        and(eq(services.id, input.id), eq(services.establishmentId, input.establishmentId))
      );

      return { success: true };
    }),
});
