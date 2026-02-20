import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { services } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const serviceRouter = router({
  // List services for a barbershop
  list: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      return db.select().from(services).where(eq(services.establishmentId, input.establishmentId));
    }),

  // Create service
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
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // TODO: Verify barbershop ownership

      const result = await db.insert(services).values({
        establishmentId: input.establishmentId,
        name: input.name,
        description: input.description,
        durationMinutes: input.durationMinutes,
        price: input.price,
      });

      return result;
    }),

  // Update service
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
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // TODO: Verify barbershop ownership

      const { id, establishmentId, ...updateData } = input;
      const result = await db.update(services)
        .set(updateData)
        .where(eq(services.id, id));

      return result;
    }),

  // Delete service
  delete: protectedProcedure
    .input(z.object({
      id: z.number(),
      establishmentId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // TODO: Verify barbershop ownership

      const result = await db.update(services)
        .set({ isActive: false })
        .where(eq(services.id, input.id));

      return result;
    }),
});
