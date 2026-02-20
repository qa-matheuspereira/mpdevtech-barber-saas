import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { appointments, services, clients } from "../../drizzle/schema";
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

            if (input.startDate) {
                conditions.push(gte(appointments.scheduledTime, input.startDate));
            }
            if (input.endDate) {
                conditions.push(lte(appointments.scheduledTime, input.endDate));
            }

            const allAppointments = await db
                .select({
                    id: appointments.id,
                    status: appointments.status,
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

            // Revenue over time (mocked for now as we need complex aggregation)
            // In a real implementation we would group by date

            return {
                totalAppointments,
                completedAppointments,
                cancelledAppointments,
                totalRevenue,
                averageTicket,
            };
        }),
});
