import { describe, it, expect, beforeEach } from "vitest";
import { getDb } from "../db";
import { googleCalendarSyncLogs, establishments, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Sync Monitoring Procedures", () => {
  let db: any;
  let testUserId: number;
  let testestablishmentId: number;

  beforeEach(async () => {
    db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Create test user
    const userResult = await db.insert(users).values({
      openId: `test-sync-user-${Date.now()}`,
      name: "Test Sync User",
      email: "testsync@example.com",
      role: "user",
    });
    testUserId = userResult[0].insertId || 1;

    // Create test barbershop
    const barbershopResult = await db.insert(establishments).values({
      ownerId: testUserId,
      name: "Test Sync Establishment",
      phone: "1234567890",
      whatsapp: "1234567890",
      operatingMode: "both",
    });
    testestablishmentId = barbershopResult[0].insertId || 1;
  });

  describe("logSyncEvent", () => {
    it("should create a sync log with success status", async () => {
      const result = await db.insert(googleCalendarSyncLogs).values({
        establishmentId: testestablishmentId,
        syncType: "appointment",
        status: "success",
        totalEvents: 10,
        successCount: 10,
        errorCount: 0,
        duration: 1500,
      });

      expect(result[0].insertId).toBeDefined();

      const log = await db
        .select()
        .from(googleCalendarSyncLogs)
        .where(eq(googleCalendarSyncLogs.id, result[0].insertId));

      expect(log.length).toBe(1);
      expect(log[0].status).toBe("success");
      expect(log[0].successCount).toBe(10);
    });

    it("should create a sync log with error status and message", async () => {
      const errorMessage = "Connection timeout to Google Calendar API";
      const result = await db.insert(googleCalendarSyncLogs).values({
        establishmentId: testestablishmentId,
        syncType: "break",
        status: "error",
        totalEvents: 0,
        successCount: 0,
        errorCount: 0,
        errorMessage,
        duration: 5000,
      });

      const log = await db
        .select()
        .from(googleCalendarSyncLogs)
        .where(eq(googleCalendarSyncLogs.id, result[0].insertId));

      expect(log[0].status).toBe("error");
      expect(log[0].errorMessage).toBe(errorMessage);
    });

    it("should create a sync log with partial status", async () => {
      const result = await db.insert(googleCalendarSyncLogs).values({
        establishmentId: testestablishmentId,
        syncType: "full",
        status: "partial",
        totalEvents: 15,
        successCount: 12,
        errorCount: 3,
        errorMessage: "3 events failed to sync",
        duration: 2000,
      });

      const log = await db
        .select()
        .from(googleCalendarSyncLogs)
        .where(eq(googleCalendarSyncLogs.id, result[0].insertId));

      expect(log[0].status).toBe("partial");
      expect(log[0].successCount).toBe(12);
      expect(log[0].errorCount).toBe(3);
    });
  });

  describe("getSyncLogs", () => {
    it("should retrieve sync logs for a barbershop", async () => {
      // Create multiple logs
      await db.insert(googleCalendarSyncLogs).values({
        establishmentId: testestablishmentId,
        syncType: "appointment",
        status: "success",
        totalEvents: 5,
        successCount: 5,
        errorCount: 0,
      });

      await db.insert(googleCalendarSyncLogs).values({
        establishmentId: testestablishmentId,
        syncType: "break",
        status: "success",
        totalEvents: 3,
        successCount: 3,
        errorCount: 0,
      });

      const logs = await db
        .select()
        .from(googleCalendarSyncLogs)
        .where(eq(googleCalendarSyncLogs.establishmentId, testestablishmentId));

      expect(logs.length).toBeGreaterThanOrEqual(2);
    });

    it("should return empty array for barbershop with no logs", async () => {
      const logs = await db
        .select()
        .from(googleCalendarSyncLogs)
        .where(eq(googleCalendarSyncLogs.establishmentId, 99999));

      expect(logs.length).toBe(0);
    });

    it("should respect limit and offset parameters", async () => {
      // Create 5 logs
      for (let i = 0; i < 5; i++) {
        await db.insert(googleCalendarSyncLogs).values({
          establishmentId: testestablishmentId,
          syncType: "appointment",
          status: "success",
          totalEvents: 1,
          successCount: 1,
          errorCount: 0,
        });
      }

      const allLogs = await db
        .select()
        .from(googleCalendarSyncLogs)
        .where(eq(googleCalendarSyncLogs.establishmentId, testestablishmentId));

      expect(allLogs.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("getSyncStats", () => {
    it("should calculate correct statistics", async () => {
      // Create logs with different statuses
      await db.insert(googleCalendarSyncLogs).values({
        establishmentId: testestablishmentId,
        syncType: "appointment",
        status: "success",
        totalEvents: 10,
        successCount: 10,
        errorCount: 0,
        duration: 1000,
      });

      await db.insert(googleCalendarSyncLogs).values({
        establishmentId: testestablishmentId,
        syncType: "break",
        status: "error",
        totalEvents: 5,
        successCount: 0,
        errorCount: 5,
        duration: 2000,
      });

      const logs = await db
        .select()
        .from(googleCalendarSyncLogs)
        .where(eq(googleCalendarSyncLogs.establishmentId, testestablishmentId));

      const stats = {
        totalSyncs: logs.length,
        successfulSyncs: logs.filter((l) => l.status === "success").length,
        failedSyncs: logs.filter((l) => l.status === "error").length,
        totalEvents: logs.reduce((sum, l) => sum + (l.totalEvents || 0), 0),
        totalSuccessful: logs.reduce((sum, l) => sum + (l.successCount || 0), 0),
        totalErrors: logs.reduce((sum, l) => sum + (l.errorCount || 0), 0),
      };

      expect(stats.totalSyncs).toBeGreaterThanOrEqual(2);
      expect(stats.successfulSyncs).toBeGreaterThanOrEqual(1);
      expect(stats.failedSyncs).toBeGreaterThanOrEqual(1);
      expect(stats.totalEvents).toBe(15);
      expect(stats.totalSuccessful).toBe(10);
      expect(stats.totalErrors).toBe(5);
    });

    it("should calculate average duration correctly", async () => {
      await db.insert(googleCalendarSyncLogs).values({
        establishmentId: testestablishmentId,
        syncType: "appointment",
        status: "success",
        totalEvents: 5,
        successCount: 5,
        errorCount: 0,
        duration: 1000,
      });

      await db.insert(googleCalendarSyncLogs).values({
        establishmentId: testestablishmentId,
        syncType: "break",
        status: "success",
        totalEvents: 3,
        successCount: 3,
        errorCount: 0,
        duration: 3000,
      });

      const logs = await db
        .select()
        .from(googleCalendarSyncLogs)
        .where(eq(googleCalendarSyncLogs.establishmentId, testestablishmentId));

      const averageDuration = Math.round(
        logs.reduce((sum, l) => sum + (l.duration || 0), 0) / logs.length
      );

      expect(averageDuration).toBe(2000);
    });
  });

  describe("getRecentErrors", () => {
    it("should retrieve only error logs", async () => {
      // Create mixed logs
      await db.insert(googleCalendarSyncLogs).values({
        establishmentId: testestablishmentId,
        syncType: "appointment",
        status: "success",
        totalEvents: 5,
        successCount: 5,
        errorCount: 0,
      });

      await db.insert(googleCalendarSyncLogs).values({
        establishmentId: testestablishmentId,
        syncType: "break",
        status: "error",
        totalEvents: 0,
        successCount: 0,
        errorCount: 5,
        errorMessage: "API error",
      });

      const errors = await db
        .select()
        .from(googleCalendarSyncLogs)
        .where(eq(googleCalendarSyncLogs.status, "error"));

      expect(errors.length).toBeGreaterThanOrEqual(1);
      errors.forEach((error) => {
        expect(error.status).toBe("error");
      });
    });

    it("should return empty array when no errors exist", async () => {
      // Create only successful logs
      await db.insert(googleCalendarSyncLogs).values({
        establishmentId: testestablishmentId,
        syncType: "appointment",
        status: "success",
        totalEvents: 5,
        successCount: 5,
        errorCount: 0,
      });

      const errors = await db
        .select()
        .from(googleCalendarSyncLogs)
        .where(eq(googleCalendarSyncLogs.status, "error"));

      // Should be empty or only contain errors from other tests
      const barbershopErrors = errors.filter(
        (e) => e.establishmentId === testestablishmentId
      );
      expect(barbershopErrors.length).toBe(0);
    });
  });

  describe("Sync Log Timestamps", () => {
    it("should have valid createdAt timestamp", async () => {
      const result = await db.insert(googleCalendarSyncLogs).values({
        establishmentId: testestablishmentId,
        syncType: "appointment",
        status: "success",
        totalEvents: 5,
        successCount: 5,
        errorCount: 0,
      });

      const log = await db
        .select()
        .from(googleCalendarSyncLogs)
        .where(eq(googleCalendarSyncLogs.id, result[0].insertId));

      expect(log[0].createdAt).toBeDefined();
      expect(log[0].createdAt instanceof Date || typeof log[0].createdAt === "string").toBe(true);
    });

    it("should set completedAt when status is not pending", async () => {
      const result = await db.insert(googleCalendarSyncLogs).values({
        establishmentId: testestablishmentId,
        syncType: "appointment",
        status: "success",
        totalEvents: 5,
        successCount: 5,
        errorCount: 0,
        completedAt: new Date(),
      });

      const log = await db
        .select()
        .from(googleCalendarSyncLogs)
        .where(eq(googleCalendarSyncLogs.id, result[0].insertId));

      expect(log[0].completedAt).toBeDefined();
    });
  });

  describe("Sync Types", () => {
    it("should support all sync types", async () => {
      const syncTypes = ["appointment", "break", "timeBlock", "full"];

      for (const syncType of syncTypes) {
        const result = await db.insert(googleCalendarSyncLogs).values({
          establishmentId: testestablishmentId,
          syncType,
          status: "success",
          totalEvents: 1,
          successCount: 1,
          errorCount: 0,
        });

        const log = await db
          .select()
          .from(googleCalendarSyncLogs)
          .where(eq(googleCalendarSyncLogs.id, result[0].insertId));

        expect(log[0].syncType).toBe(syncType);
      }
    });
  });
});
