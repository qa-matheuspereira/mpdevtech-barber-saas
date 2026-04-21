import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { clients, establishments } from "../../drizzle/schema";
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

export const clientRouter = router({
  list: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      await verifyEstablishmentOwnership(input.establishmentId, ctx.user.id);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      return db.select().from(clients).where(eq(clients.establishmentId, input.establishmentId));
    }),

  getOrCreate: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      name: z.string().min(1),
      phone: z.string().min(1),
      whatsapp: z.string().optional(),
      email: z.string().email().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      await verifyEstablishmentOwnership(input.establishmentId, ctx.user.id);

      return getOrCreateClientPublic(input);
    }),

  getOrCreatePublic: publicProcedure
    .input(z.object({
      establishmentId: z.number(),
      name: z.string().min(1),
      phone: z.string().min(8),
      whatsapp: z.string().optional(),
      email: z.string().email().optional(),
    }))
    .mutation(async ({ input }) => {
      return getOrCreateClientPublic(input);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      establishmentId: z.number(),
      name: z.string().optional(),
      phone: z.string().optional(),
      whatsapp: z.string().optional(),
      email: z.string().email().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      await verifyEstablishmentOwnership(input.establishmentId, ctx.user.id);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const { id, establishmentId, ...updateData } = input;
      await db.update(clients).set(updateData).where(
        and(eq(clients.id, id), eq(clients.establishmentId, establishmentId))
      );

      return { success: true };
    }),
});

async function getOrCreateClientPublic(input: {
  establishmentId: number;
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
}) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const existing = await db.select().from(clients).where(
    and(eq(clients.phone, input.phone), eq(clients.establishmentId, input.establishmentId))
  ).limit(1);

  if (existing.length > 0) return existing[0];

  const inserted = await db.insert(clients).values({
    establishmentId: input.establishmentId,
    name: input.name,
    phone: input.phone,
    whatsapp: input.whatsapp,
    email: input.email,
  }).returning();

  return inserted[0];
}
