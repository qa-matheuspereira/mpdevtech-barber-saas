import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { barbers, services, barberServices, appointments } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const barbersRouter = router({
  list: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      return db.select().from(barbers).where(
        and(eq(barbers.establishmentId, input.establishmentId), eq(barbers.isActive, true))
      );
    }),

  listPublic: publicProcedure
    .input(z.object({ establishmentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      return db.select().from(barbers).where(
        and(eq(barbers.establishmentId, input.establishmentId), eq(barbers.isActive, true))
      );
    }),

  get: protectedProcedure
    .input(z.object({ barberId: z.number(), establishmentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const barber = await db.select().from(barbers).where(
        and(eq(barbers.id, input.barberId), eq(barbers.establishmentId, input.establishmentId))
      ).limit(1);

      if (!barber.length) throw new TRPCError({ code: "NOT_FOUND", message: "Profissional não encontrado" });

      const assignedServices = await db
        .select({ serviceId: barberServices.serviceId })
        .from(barberServices)
        .where(eq(barberServices.barberId, input.barberId));

      return {
        ...barber[0],
        serviceIds: assignedServices.map(s => s.serviceId),
      };
    }),

  create: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
      phone: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const result = await db.insert(barbers).values({
        establishmentId: input.establishmentId,
        name: input.name,
        phone: input.phone || null,
        isActive: true,
      }).returning({ id: barbers.id });

      return { success: true, professionalId: result[0]?.id, message: "Profissional criado com sucesso" };
    }),

  update: protectedProcedure
    .input(z.object({
      barberId: z.number(),
      establishmentId: z.number(),
      name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
      phone: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const updateData: any = { name: input.name, phone: input.phone || null };
      if (input.isActive !== undefined) updateData.isActive = input.isActive;

      await db.update(barbers).set(updateData).where(
        and(eq(barbers.id, input.barberId), eq(barbers.establishmentId, input.establishmentId))
      );

      return { success: true, message: "Profissional atualizado com sucesso" };
    }),

  delete: protectedProcedure
    .input(z.object({ barberId: z.number(), establishmentId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.update(barbers).set({ isActive: false }).where(
        and(eq(barbers.id, input.barberId), eq(barbers.establishmentId, input.establishmentId))
      );

      return { success: true, message: "Profissional removido com sucesso" };
    }),

  getAvailableServices: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      return db.select().from(services).where(
        and(eq(services.establishmentId, input.establishmentId), eq(services.isActive, true))
      );
    }),

  assignService: protectedProcedure
    .input(z.object({
      barberId: z.number(),
      serviceId: z.number(),
      establishmentId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.insert(barberServices).values({
        barberId: input.barberId,
        serviceId: input.serviceId,
        establishmentId: input.establishmentId,
      }).onConflictDoNothing();

      return { success: true, message: "Serviço atribuído ao profissional" };
    }),

  removeService: protectedProcedure
    .input(z.object({
      barberId: z.number(),
      serviceId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.delete(barberServices).where(
        and(eq(barberServices.barberId, input.barberId), eq(barberServices.serviceId, input.serviceId))
      );

      return { success: true };
    }),

  getStats: protectedProcedure
    .input(z.object({ barberId: z.number(), establishmentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const allAppointments = await db
        .select({
          id: appointments.id,
          status: appointments.status,
          price: services.price,
        })
        .from(appointments)
        .leftJoin(services, eq(appointments.serviceId, services.id))
        .where(and(
          eq(appointments.barberId, input.barberId),
          eq(appointments.establishmentId, input.establishmentId)
        ));

      const total = allAppointments.length;
      const completed = allAppointments.filter(a => a.status === "completed").length;
      const cancelled = allAppointments.filter(a => a.status === "cancelled").length;
      const revenue = allAppointments
        .filter(a => a.status === "completed")
        .reduce((sum, a) => sum + Number(a.price || 0), 0);

      return {
        totalAppointments: total,
        completedAppointments: completed,
        cancelledAppointments: cancelled,
        totalRevenue: revenue,
      };
    }),
});
