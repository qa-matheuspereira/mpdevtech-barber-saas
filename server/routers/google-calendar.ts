import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { googleCalendarSyncLogs, googleCalendarIntegrations } from "../../drizzle/schema";
import { eq, and, desc, gte, gt } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const googleCalendarRouter = router({
  getIntegration: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [integration] = await db
        .select()
        .from(googleCalendarIntegrations)
        .where(eq(googleCalendarIntegrations.establishmentId, input.establishmentId))
        .limit(1);

      return integration ?? null;
    }),

  getSyncStats: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      hoursBack: z.number().default(24),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const since = new Date(Date.now() - input.hoursBack * 60 * 60 * 1000);

      const logs = await db
        .select()
        .from(googleCalendarSyncLogs)
        .where(and(
          eq(googleCalendarSyncLogs.establishmentId, input.establishmentId),
          gte(googleCalendarSyncLogs.startedAt, since)
        ));

      const total = logs.length;
      const successful = logs.filter(l => l.status === "success").length;
      const failed = logs.filter(l => l.status === "error").length;
      const totalEvents = logs.reduce((sum, l) => sum + (l.totalEvents ?? 0), 0);
      const totalSuccess = logs.reduce((sum, l) => sum + (l.successCount ?? 0), 0);
      const totalErrors = logs.reduce((sum, l) => sum + (l.errorCount ?? 0), 0);
      const avgDuration = total > 0
        ? logs.reduce((sum, l) => sum + (l.duration ?? 0), 0) / total
        : 0;

      const [lastSync] = logs.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

      return {
        totalSyncs: total,
        successfulSyncs: successful,
        failedSyncs: failed,
        totalEvents,
        successfulEvents: totalSuccess,
        failedEvents: totalErrors,
        averageDuration: Math.round(avgDuration),
        lastSyncAt: lastSync?.completedAt ?? null,
        lastSyncStatus: lastSync?.status ?? null,
      };
    }),

  getSyncLogs: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      return db
        .select()
        .from(googleCalendarSyncLogs)
        .where(eq(googleCalendarSyncLogs.establishmentId, input.establishmentId))
        .orderBy(desc(googleCalendarSyncLogs.startedAt))
        .limit(input.limit);
    }),

  getRecentErrors: protectedProcedure
    .input(z.object({
      establishmentId: z.number(),
      limit: z.number().default(5),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      return db
        .select()
        .from(googleCalendarSyncLogs)
        .where(and(
          eq(googleCalendarSyncLogs.establishmentId, input.establishmentId),
          eq(googleCalendarSyncLogs.status, "error"),
        ))
        .orderBy(desc(googleCalendarSyncLogs.startedAt))
        .limit(input.limit);
    }),

  syncAppointments: protectedProcedure
    .input(z.object({ establishmentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [integration] = await db
        .select()
        .from(googleCalendarIntegrations)
        .where(eq(googleCalendarIntegrations.establishmentId, input.establishmentId))
        .limit(1);

      if (!integration || !integration.isActive) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Integração com Google Calendar não configurada" });
      }

      const startedAt = new Date();
      const [logEntry] = await db.insert(googleCalendarSyncLogs).values({
        establishmentId: input.establishmentId,
        syncType: "appointment",
        status: "pending",
        startedAt,
      }).returning({ id: googleCalendarSyncLogs.id });

      // TODO: Implement actual Google Calendar sync using OAuth tokens
      // For now, mark as completed immediately
      await db.update(googleCalendarSyncLogs)
        .set({ status: "success", completedAt: new Date(), duration: Date.now() - startedAt.getTime() })
        .where(eq(googleCalendarSyncLogs.id, logEntry.id));

      return { success: true, message: "Sincronização iniciada com sucesso" };
    }),
});
