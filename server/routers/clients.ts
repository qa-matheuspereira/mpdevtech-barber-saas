import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { clients } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const clientRouter = router({
  // List clients for a barbershop
  list: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      return db.select().from(clients).where(eq(clients.establishmentId, input.establishmentId));
    }),

  // Get or create client by phone
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
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // TODO: Verify barbershop ownership

      // Check if client exists
      const existing = await db.select().from(clients).where(
        eq(clients.phone, input.phone)
      ).limit(1);

      if (existing.length > 0) {
        return existing[0];
      }

      // Create new client
      await db.insert(clients).values({
        establishmentId: input.establishmentId,
        name: input.name,
        phone: input.phone,
        whatsapp: input.whatsapp,
        email: input.email,
      });

      // Get the newly created client
      const newClient = await db.select().from(clients).where(
        eq(clients.phone, input.phone)
      ).limit(1);

      return newClient[0];
    }),

  // Update client
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      establishmentId: z.number(),
      name: z.string().optional(),
      phone: z.string().optional(),
      whatsapp: z.string().optional(),
      email: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // TODO: Verify barbershop ownership

      const { id, establishmentId, ...updateData } = input;
      const result = await db.update(clients)
        .set(updateData)
        .where(eq(clients.id, id));

      return result;
    }),
});
