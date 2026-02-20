import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { establishments, services } from "../../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const establishmentRouter = router({
  // List establishments for the owner
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    const { getEstablishmentsByOwnerId } = await import("../db");
    return getEstablishmentsByOwnerId(ctx.user.id);
  }),

  // Get specific establishment
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const { getEstablishmentById } = await import("../db");
      return getEstablishmentById(input.id, ctx.user.id);
    }),

  // Create establishment
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1, "Nome é obrigatório"),
      phone: z.string().min(1, "Telefone é obrigatório"),
      whatsapp: z.string().min(1, "WhatsApp é obrigatório"),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      description: z.string().optional(),
      openTime: z.string().optional(),
      closeTime: z.string().optional(),
      closedDays: z.array(z.number()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Check if user has reached their establishment limit
      const existingEstablishments = await db.select({ count: sql<number>`count(*)` })
        .from(establishments)
        .where(eq(establishments.ownerId, ctx.user.id));

      const currentCount = Number(existingEstablishments[0]?.count ?? 0);
      const maxAllowed = ctx.user.maxEstablishments ?? 1;

      if (currentCount >= maxAllowed) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Limite de estabelecimentos atingido (${currentCount}/${maxAllowed}). Entre em contato com o administrador para aumentar seu limite.`,
        });
      }

      const result = await db.insert(establishments).values({
        ownerId: ctx.user.id,
        name: input.name,
        phone: input.phone,
        whatsapp: input.whatsapp,
        address: input.address,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        description: input.description,
        openTime: input.openTime,
        closeTime: input.closeTime,
        closedDays: input.closedDays,
      }).returning({ id: establishments.id });

      return result[0];
    }),

  // Update establishment settings
  update: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      name: z.string().optional(),
      phone: z.string().optional(),
      whatsapp: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      description: z.string().optional(),
      operatingMode: z.enum(["queue", "scheduled", "both"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const { establishmentId, ...updateData } = input;

      // Verify ownership
      const { getEstablishmentById } = await import("../db");
      const existing = await getEstablishmentById(establishmentId, ctx.user.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Establishment not found" });

      const result = await db.update(establishments)
        .set(updateData)
        .where(eq(establishments.id, establishmentId));

      return result;
    }),

  // Get settings (alias for get or specialized)
  getSettings: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const { getEstablishmentById } = await import("../db");
      const shop = await getEstablishmentById(input.establishmentId, ctx.user.id);

      if (!shop) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Establishment not found" });
      }

      return {
        id: shop.id,
        name: shop.name,
        phone: shop.phone,
        whatsapp: shop.whatsapp,
        address: shop.address,
        operatingMode: shop.operatingMode,
        openTime: shop.openTime,
        closeTime: shop.closeTime,
        closedDays: shop.closedDays || [],
      };
    }),

  // Update operating hours
  updateOperatingHours: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      openTime: z.string().regex(/^\d{2}:\d{2}$/), // HH:mm format
      closeTime: z.string().regex(/^\d{2}:\d{2}$/), // HH:mm format
      closedDays: z.array(z.number().min(0).max(6)), // 0-6 (Sunday-Saturday)
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // TODO: Verify barbershop ownership

      // Validate times
      const [openHour, openMin] = input.openTime.split(":").map(Number);
      const [closeHour, closeMin] = input.closeTime.split(":").map(Number);

      const openTimeMinutes = openHour * 60 + openMin;
      const closeTimeMinutes = closeHour * 60 + closeMin;

      if (openTimeMinutes >= closeTimeMinutes) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Horário de abertura deve ser anterior ao de fechamento",
        });
      }

      const result = await db.update(establishments)
        .set({
          openTime: input.openTime,
          closeTime: input.closeTime,
          closedDays: input.closedDays,
        })
        .where(eq(establishments.id, input.establishmentId));

      return result;
    }),

  // Get all services for a barbershop
  getServices: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // TODO: Verify barbershop ownership

      return db.select().from(services)
        .where(eq(services.establishmentId, input.establishmentId));
    }),

  // Create service
  createService: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      name: z.string().min(1, "Nome do serviço é obrigatório"),
      description: z.string().optional(),
      durationMinutes: z.number().min(5, "Duração mínima é 5 minutos"),
      price: z.string().regex(/^\d+(\.\d{2})?$/, "Preço deve estar no formato correto"),
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
        price: input.price as any,
        isActive: true,
      });

      return result;
    }),

  // Update service
  updateService: protectedProcedure
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

      // Validate price if provided
      if (updateData.price && !updateData.price.match(/^\d+(\.\d{2})?$/)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Preço deve estar no formato correto",
        });
      }

      const result = await db.update(services)
        .set(updateData)
        .where(eq(services.id, id));

      return result;
    }),

  // Delete service (soft delete)
  deleteService: protectedProcedure
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
