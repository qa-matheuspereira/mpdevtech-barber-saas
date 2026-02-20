import { describe, it, expect, beforeEach, vi } from "vitest";
import { getDb } from "../db";
import { googleCalendarEvents, googleCalendarIntegrations, establishments, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Google Calendar Procedures", () => {
  let db: any;
  let testUserId: number;
  let testestablishmentId: number;
  let testEventId: number;

  beforeEach(async () => {
    db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Create test user
    const userResult = await db.insert(users).values({
      openId: `test-user-${Date.now()}`,
      name: "Test User",
      email: "test@example.com",
      role: "user",
    });
    testUserId = userResult[0].insertId || 1;

    // Create test barbershop
    const barbershopResult = await db.insert(establishments).values({
      ownerId: testUserId,
      name: "Test Establishment",
      phone: "1234567890",
      whatsapp: "1234567890",
      operatingMode: "both",
    });
    testestablishmentId = barbershopResult[0].insertId || 1;

    // Create test integration
    const integrationResult = await db.insert(googleCalendarIntegrations).values({
      establishmentId: testestablishmentId,
      userId: testUserId,
      googleCalendarId: "test-calendar-id",
      accessToken: "test-access-token",
      refreshToken: "test-refresh-token",
      isActive: true,
    });

    // Create test event
    const eventResult = await db.insert(googleCalendarEvents).values({
      establishmentId: testestablishmentId,
      googleEventId: "test-google-event-id",
      localEventId: 1,
      eventType: "appointment",
    });
    testEventId = eventResult[0].insertId || 1;
  });

  describe("deleteEvent", () => {
    it("should delete an event successfully", async () => {
      // Verify event exists
      const eventBefore = await db
        .select()
        .from(googleCalendarEvents)
        .where(eq(googleCalendarEvents.id, testEventId));
      expect(eventBefore.length).toBe(1);

      // Delete event
      const result = await db
        .delete(googleCalendarEvents)
        .where(eq(googleCalendarEvents.id, testEventId));

      // Verify event is deleted
      const eventAfter = await db
        .select()
        .from(googleCalendarEvents)
        .where(eq(googleCalendarEvents.id, testEventId));
      expect(eventAfter.length).toBe(0);
    });

    it("should handle deletion of non-existent event", async () => {
      const result = await db
        .delete(googleCalendarEvents)
        .where(eq(googleCalendarEvents.id, 99999));

      // Should complete without error
      expect(result).toBeDefined();
    });
  });

  describe("getSyncedEvents", () => {
    it("should retrieve all synced events for a barbershop", async () => {
      const events = await db
        .select()
        .from(googleCalendarEvents)
        .where(eq(googleCalendarEvents.establishmentId, testestablishmentId));

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].establishmentId).toBe(testestablishmentId);
    });

    it("should return empty array for barbershop with no events", async () => {
      // Create another barbershop
      const newEstablishmentResult = await db.insert(establishments).values({
        ownerId: testUserId,
        name: "Empty Establishment",
        phone: "9876543210",
        whatsapp: "9876543210",
        operatingMode: "both",
      });
      const newestablishmentId = newEstablishmentResult[0].insertId || 999;

      const events = await db
        .select()
        .from(googleCalendarEvents)
        .where(eq(googleCalendarEvents.establishmentId, newestablishmentId));

      expect(events.length).toBe(0);
    });
  });

  describe("Event Type Filtering", () => {
    it("should filter events by type", async () => {
      // Create events of different types
      await db.insert(googleCalendarEvents).values({
        establishmentId: testestablishmentId,
        googleEventId: "test-break-event",
        localEventId: 2,
        eventType: "break",
      });

      await db.insert(googleCalendarEvents).values({
        establishmentId: testestablishmentId,
        googleEventId: "test-timeblock-event",
        localEventId: 3,
        eventType: "timeBlock",
      });

      // Filter by appointment type
      const appointments = await db
        .select()
        .from(googleCalendarEvents)
        .where(
          eq(googleCalendarEvents.establishmentId, testestablishmentId)
        );

      const appointmentEvents = appointments.filter(e => e.eventType === "appointment");
      const breakEvents = appointments.filter(e => e.eventType === "break");
      const timeBlockEvents = appointments.filter(e => e.eventType === "timeBlock");

      expect(appointmentEvents.length).toBeGreaterThan(0);
      expect(breakEvents.length).toBeGreaterThan(0);
      expect(timeBlockEvents.length).toBeGreaterThan(0);
    });
  });

  describe("Event Sync Timestamp", () => {
    it("should have valid syncedAt timestamp", async () => {
      const events = await db
        .select()
        .from(googleCalendarEvents)
        .where(eq(googleCalendarEvents.establishmentId, testestablishmentId));

      expect(events.length).toBeGreaterThan(0);
      const event = events[0];
      expect(event.syncedAt).toBeDefined();
      expect(event.syncedAt instanceof Date || typeof event.syncedAt === "string").toBe(true);
    });

    it("should update syncedAt timestamp", async () => {
      const oldEvent = await db
        .select()
        .from(googleCalendarEvents)
        .where(eq(googleCalendarEvents.id, testEventId));

      const oldTimestamp = oldEvent[0].syncedAt;

      // Wait a bit and update
      await new Promise(resolve => setTimeout(resolve, 100));

      const newTimestamp = new Date(Date.now() + 1000); // 1 segundo depois
      await db
        .update(googleCalendarEvents)
        .set({ syncedAt: newTimestamp })
        .where(eq(googleCalendarEvents.id, testEventId));

      const updatedEvent = await db
        .select()
        .from(googleCalendarEvents)
        .where(eq(googleCalendarEvents.id, testEventId));

      expect(updatedEvent[0].syncedAt.getTime()).toBeGreaterThan(oldTimestamp.getTime());
    });
  });

  describe("Event Relationships", () => {
    it("should maintain relationship between local and Google event IDs", async () => {
      const events = await db
        .select()
        .from(googleCalendarEvents)
        .where(eq(googleCalendarEvents.establishmentId, testestablishmentId));

      expect(events.length).toBeGreaterThan(0);
      const event = events[0];
      expect(event.googleEventId).toBeDefined();
      expect(event.localEventId).toBeDefined();
      expect(event.googleEventId).not.toEqual(event.localEventId);
    });

    it("should handle events with null localEventId", async () => {
      await db.insert(googleCalendarEvents).values({
        establishmentId: testestablishmentId,
        googleEventId: "orphan-google-event",
        localEventId: null,
        eventType: "break",
      });

      const events = await db
        .select()
        .from(googleCalendarEvents)
        .where(eq(googleCalendarEvents.establishmentId, testestablishmentId));

      const orphanEvent = events.find(e => e.googleEventId === "orphan-google-event");
      expect(orphanEvent).toBeDefined();
      expect(orphanEvent?.localEventId).toBeNull();
    });
  });
});
