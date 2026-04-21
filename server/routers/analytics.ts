import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { appointments, services, clients, barbers } from "../../drizzle/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const analyticsRouter = router({
  getDashboardStats: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const conditions = [eq(appointments.establishmentId, input.establishmentId)];

      if (input.startDate) conditions.push(gte(appointments.scheduledTime, input.startDate));
      if (input.endDate) conditions.push(lte(appointments.scheduledTime, input.endDate));

      const allAppointments = await db
        .select({
          id: appointments.id,
          status: appointments.status,
          scheduledTime: appointments.scheduledTime,
          createdAt: appointments.createdAt,
          price: services.price,
          duration: services.durationMinutes,
        })
        .from(appointments)
        .leftJoin(services, eq(appointments.serviceId, services.id))
        .where(and(...conditions));

      const totalAppointments = allAppointments.length;
      const completedAppointments = allAppointments.filter(a => a.status === "completed").length;
      const cancelledAppointments = allAppointments.filter(a => a.status === "cancelled").length;

      const totalRevenue = allAppointments
        .filter(a => a.status === "completed")
        .reduce((sum, a) => sum + Number(a.price || 0), 0);

      const averageTicket = completedAppointments > 0 ? totalRevenue / completedAppointments : 0;

      // Daily breakdown
      const dailyMap = new Map<string, { total: number; completed: number; revenue: number }>();

      for (const apt of allAppointments) {
        const date = (apt.scheduledTime ?? apt.createdAt).toISOString().split("T")[0];
        const existing = dailyMap.get(date) ?? { total: 0, completed: 0, revenue: 0 };
        existing.total++;
        if (apt.status === "completed") {
          existing.completed++;
          existing.revenue += Number(apt.price || 0);
        }
        dailyMap.set(date, existing);
      }

      const dailyStats = Array.from(dailyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, stats]) => ({ date, ...stats }));

      return {
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        totalRevenue,
        averageTicket,
        dailyStats,
      };
    }),

  getReport: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      reportType: z.enum(["appointments", "revenue", "services", "professionals", "cancellations", "clients"]),
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const start = new Date(input.startDate);
      const end = new Date(input.endDate);
      end.setHours(23, 59, 59, 999);

      const rows = await db
        .select({
          id: appointments.id,
          status: appointments.status,
          appointmentType: appointments.appointmentType,
          scheduledTime: appointments.scheduledTime,
          createdAt: appointments.createdAt,
          notes: appointments.notes,
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
        .where(and(
          eq(appointments.establishmentId, input.establishmentId),
          gte(appointments.createdAt, start),
          lte(appointments.createdAt, end),
        ));

      return rows;
    }),
});
