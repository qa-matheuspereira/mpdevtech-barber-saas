-- Rename table
ALTER TABLE "barbershops" RENAME TO "establishments";--> statement-breakpoint
-- Add new column
ALTER TABLE "establishments" ADD COLUMN "features" jsonb;--> statement-breakpoint
-- Rename columns in other tables
ALTER TABLE "appointmentHistory" RENAME COLUMN "barbershopId" TO "establishmentId";--> statement-breakpoint
ALTER TABLE "appointments" RENAME COLUMN "barbershopId" TO "establishmentId";--> statement-breakpoint
ALTER TABLE "barbers" RENAME COLUMN "barbershopId" TO "establishmentId";--> statement-breakpoint
ALTER TABLE "breaks" RENAME COLUMN "barbershopId" TO "establishmentId";--> statement-breakpoint
ALTER TABLE "clients" RENAME COLUMN "barbershopId" TO "establishmentId";--> statement-breakpoint
ALTER TABLE "googleCalendarEvents" RENAME COLUMN "barbershopId" TO "establishmentId";--> statement-breakpoint
ALTER TABLE "googleCalendarIntegrations" RENAME COLUMN "barbershopId" TO "establishmentId";--> statement-breakpoint
ALTER TABLE "googleCalendarSyncLogs" RENAME COLUMN "barbershopId" TO "establishmentId";--> statement-breakpoint
ALTER TABLE "queues" RENAME COLUMN "barbershopId" TO "establishmentId";--> statement-breakpoint
ALTER TABLE "services" RENAME COLUMN "barbershopId" TO "establishmentId";--> statement-breakpoint
ALTER TABLE "timeBlocks" RENAME COLUMN "barbershopId" TO "establishmentId";--> statement-breakpoint
ALTER TABLE "webhookLogs" RENAME COLUMN "barbershopId" TO "establishmentId";--> statement-breakpoint
ALTER TABLE "whatsappAutoResponses" RENAME COLUMN "barbershopId" TO "establishmentId";--> statement-breakpoint
ALTER TABLE "whatsappInstances" RENAME COLUMN "barbershopId" TO "establishmentId";--> statement-breakpoint
ALTER TABLE "whatsappMessages" RENAME COLUMN "barbershopId" TO "establishmentId";--> statement-breakpoint
ALTER TABLE "whatsappSessions" RENAME COLUMN "barbershopId" TO "establishmentId";--> statement-breakpoint
-- Handle Constraints and Indexes
ALTER TABLE "googleCalendarIntegrations" DROP CONSTRAINT "googleCalendarIntegrations_barbershopId_unique";--> statement-breakpoint
ALTER TABLE "whatsappInstances" DROP CONSTRAINT "whatsappInstances_barbershopId_unique";--> statement-breakpoint
ALTER TABLE "googleCalendarIntegrations" ADD CONSTRAINT "googleCalendarIntegrations_establishmentId_unique" UNIQUE("establishmentId");--> statement-breakpoint
ALTER TABLE "whatsappInstances" ADD CONSTRAINT "whatsappInstances_establishmentId_unique" UNIQUE("establishmentId");--> statement-breakpoint
-- Recreate indexes with new names (optional but good for consistency)
DROP INDEX "appointmentHistoryBarbershopIdIdx";--> statement-breakpoint
DROP INDEX "appointmentsBarbershopIdIdx";--> statement-breakpoint
DROP INDEX "barbersBarbershopIdIdx";--> statement-breakpoint
DROP INDEX "breaksBarberShopIdIdx";--> statement-breakpoint
DROP INDEX "clientsBarbershopIdIdx";--> statement-breakpoint
DROP INDEX "googleCalEventsBarbershopIdIdx";--> statement-breakpoint
DROP INDEX "googleCalIntegrationBarbershopIdIdx";--> statement-breakpoint
DROP INDEX "googleCalSyncLogsBarbershopIdIdx";--> statement-breakpoint
DROP INDEX "queuesBarbershopIdIdx";--> statement-breakpoint
DROP INDEX "servicesBarbershopIdIdx";--> statement-breakpoint
DROP INDEX "timeBlocksBarberShopIdIdx";--> statement-breakpoint
DROP INDEX "webhookLogsBarbershopIdIdx";--> statement-breakpoint
DROP INDEX "whatsappAutoResponsesBarbershopIdIdx";--> statement-breakpoint
DROP INDEX "whatsappInstancesBarbershopIdIdx";--> statement-breakpoint
DROP INDEX "whatsappMessagesBarbershopIdIdx";--> statement-breakpoint
DROP INDEX "whatsappSessionsBarbershopIdIdx";--> statement-breakpoint
--> statement-breakpoint
CREATE INDEX "appointmentHistoryEstablishmentIdIdx" ON "appointmentHistory" USING btree ("establishmentId");--> statement-breakpoint
CREATE INDEX "appointmentsEstablishmentIdIdx" ON "appointments" USING btree ("establishmentId");--> statement-breakpoint
CREATE INDEX "barbersEstablishmentIdIdx" ON "barbers" USING btree ("establishmentId");--> statement-breakpoint
CREATE INDEX "breaksEstablishmentIdIdx" ON "breaks" USING btree ("establishmentId");--> statement-breakpoint
CREATE INDEX "clientsEstablishmentIdIdx" ON "clients" USING btree ("establishmentId");--> statement-breakpoint
CREATE INDEX "googleCalEventsEstablishmentIdIdx" ON "googleCalendarEvents" USING btree ("establishmentId");--> statement-breakpoint
CREATE INDEX "googleCalIntegrationEstablishmentIdIdx" ON "googleCalendarIntegrations" USING btree ("establishmentId");--> statement-breakpoint
CREATE INDEX "googleCalSyncLogsEstablishmentIdIdx" ON "googleCalendarSyncLogs" USING btree ("establishmentId");--> statement-breakpoint
CREATE INDEX "queuesEstablishmentIdIdx" ON "queues" USING btree ("establishmentId");--> statement-breakpoint
CREATE INDEX "servicesEstablishmentIdIdx" ON "services" USING btree ("establishmentId");--> statement-breakpoint
CREATE INDEX "timeBlocksEstablishmentIdIdx" ON "timeBlocks" USING btree ("establishmentId");--> statement-breakpoint
CREATE INDEX "webhookLogsEstablishmentIdIdx" ON "webhookLogs" USING btree ("establishmentId");--> statement-breakpoint
CREATE INDEX "whatsappAutoResponsesEstablishmentIdIdx" ON "whatsappAutoResponses" USING btree ("establishmentId");--> statement-breakpoint
CREATE INDEX "whatsappInstancesEstablishmentIdIdx" ON "whatsappInstances" USING btree ("establishmentId");--> statement-breakpoint
CREATE INDEX "whatsappMessagesEstablishmentIdIdx" ON "whatsappMessages" USING btree ("establishmentId");--> statement-breakpoint
CREATE INDEX "whatsappSessionsEstablishmentIdIdx" ON "whatsappSessions" USING btree ("establishmentId");