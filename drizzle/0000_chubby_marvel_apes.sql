CREATE TYPE "public"."appointmentStatus" AS ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."appointmentType" AS ENUM('scheduled', 'queue');--> statement-breakpoint
CREATE TYPE "public"."blockType" AS ENUM('maintenance', 'absence', 'closed', 'custom');--> statement-breakpoint
CREATE TYPE "public"."googleCalEventType" AS ENUM('appointment', 'break', 'timeBlock');--> statement-breakpoint
CREATE TYPE "public"."messageDirection" AS ENUM('inbound', 'outbound');--> statement-breakpoint
CREATE TYPE "public"."messageStatus" AS ENUM('pending', 'sent', 'delivered', 'read', 'failed');--> statement-breakpoint
CREATE TYPE "public"."messageType" AS ENUM('text', 'image', 'audio', 'video', 'document', 'location');--> statement-breakpoint
CREATE TYPE "public"."operatingMode" AS ENUM('queue', 'scheduled', 'both');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."sentiment" AS ENUM('positive', 'neutral', 'negative');--> statement-breakpoint
CREATE TYPE "public"."syncStatus" AS ENUM('pending', 'success', 'error', 'partial');--> statement-breakpoint
CREATE TYPE "public"."syncType" AS ENUM('appointment', 'break', 'timeBlock', 'full');--> statement-breakpoint
CREATE TYPE "public"."webhookStatus" AS ENUM('success', 'failed', 'pending');--> statement-breakpoint
CREATE TYPE "public"."whatsappSessionStatus" AS ENUM('pending', 'connected', 'disconnected', 'error');--> statement-breakpoint
CREATE TABLE "appointmentHistory" (
	"id" serial PRIMARY KEY NOT NULL,
	"barbershopId" integer NOT NULL,
	"appointmentId" integer NOT NULL,
	"clientId" integer NOT NULL,
	"serviceId" integer NOT NULL,
	"barberId" integer,
	"completedAt" timestamp NOT NULL,
	"durationMinutes" integer,
	"price" numeric(10, 2),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"barbershopId" integer NOT NULL,
	"clientId" integer NOT NULL,
	"barberId" integer,
	"serviceId" integer NOT NULL,
	"appointmentType" "appointmentType" NOT NULL,
	"scheduledTime" timestamp,
	"queuePosition" integer,
	"status" "appointmentStatus" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"reminderSentAt" timestamp,
	"confirmationSentAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "barbers" (
	"id" serial PRIMARY KEY NOT NULL,
	"barbershopId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(20),
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "barbershops" (
	"id" serial PRIMARY KEY NOT NULL,
	"ownerId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"whatsapp" varchar(20) NOT NULL,
	"address" text,
	"city" varchar(100),
	"state" varchar(2),
	"zipCode" varchar(10),
	"description" text,
	"operatingMode" "operatingMode" DEFAULT 'both' NOT NULL,
	"openTime" varchar(5),
	"closeTime" varchar(5),
	"closedDays" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "breaks" (
	"id" serial PRIMARY KEY NOT NULL,
	"barbershopId" integer NOT NULL,
	"barberId" integer,
	"name" varchar(255) NOT NULL,
	"startTime" varchar(5) NOT NULL,
	"endTime" varchar(5) NOT NULL,
	"daysOfWeek" jsonb,
	"isRecurring" boolean DEFAULT true NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"barbershopId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"whatsapp" varchar(20),
	"email" varchar(320),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "googleCalendarEvents" (
	"id" serial PRIMARY KEY NOT NULL,
	"barbershopId" integer NOT NULL,
	"googleEventId" varchar(255) NOT NULL,
	"localEventId" integer,
	"eventType" "googleCalEventType" NOT NULL,
	"syncedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "googleCalendarIntegrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"barbershopId" integer NOT NULL,
	"userId" integer NOT NULL,
	"googleCalendarId" varchar(255) NOT NULL,
	"accessToken" text NOT NULL,
	"refreshToken" text,
	"tokenExpiresAt" timestamp,
	"isActive" boolean DEFAULT true NOT NULL,
	"syncAppointments" boolean DEFAULT true NOT NULL,
	"syncBreaks" boolean DEFAULT true NOT NULL,
	"lastSyncAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "googleCalendarIntegrations_barbershopId_unique" UNIQUE("barbershopId")
);
--> statement-breakpoint
CREATE TABLE "googleCalendarSyncLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"barbershopId" integer NOT NULL,
	"syncType" "syncType" NOT NULL,
	"status" "syncStatus" DEFAULT 'pending' NOT NULL,
	"totalEvents" integer DEFAULT 0 NOT NULL,
	"successCount" integer DEFAULT 0 NOT NULL,
	"errorCount" integer DEFAULT 0 NOT NULL,
	"errorMessage" text,
	"startedAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp,
	"duration" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "queues" (
	"id" serial PRIMARY KEY NOT NULL,
	"barbershopId" integer NOT NULL,
	"appointmentId" integer NOT NULL,
	"position" integer NOT NULL,
	"enteredAt" timestamp DEFAULT now() NOT NULL,
	"calledAt" timestamp,
	"completedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"barbershopId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"durationMinutes" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timeBlocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"barbershopId" integer NOT NULL,
	"barberId" integer,
	"title" varchar(255) NOT NULL,
	"description" text,
	"startTime" timestamp NOT NULL,
	"endTime" timestamp NOT NULL,
	"blockType" "blockType" NOT NULL,
	"isRecurring" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"phone" varchar(20),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "webhookLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"barbershopId" integer NOT NULL,
	"eventType" varchar(100) NOT NULL,
	"payload" jsonb,
	"status" "webhookStatus" DEFAULT 'pending' NOT NULL,
	"errorMessage" text,
	"retryCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsappAutoResponses" (
	"id" serial PRIMARY KEY NOT NULL,
	"barbershopId" integer NOT NULL,
	"trigger" varchar(255) NOT NULL,
	"response" text NOT NULL,
	"category" varchar(100),
	"isActive" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsappInstances" (
	"id" serial PRIMARY KEY NOT NULL,
	"barbershopId" integer NOT NULL,
	"apiKey" varchar(255) NOT NULL,
	"instanceName" varchar(255) NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "whatsappInstances_barbershopId_unique" UNIQUE("barbershopId")
);
--> statement-breakpoint
CREATE TABLE "whatsappMessages" (
	"id" serial PRIMARY KEY NOT NULL,
	"sessionId" integer NOT NULL,
	"barbershopId" integer NOT NULL,
	"clientPhone" varchar(20) NOT NULL,
	"clientName" varchar(255),
	"messageText" text NOT NULL,
	"messageType" "messageType" DEFAULT 'text' NOT NULL,
	"direction" "messageDirection" NOT NULL,
	"externalMessageId" varchar(255),
	"status" "messageStatus" DEFAULT 'pending' NOT NULL,
	"appointmentId" integer,
	"autoReply" boolean DEFAULT false NOT NULL,
	"sentiment" "sentiment" DEFAULT 'neutral',
	"category" varchar(100),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsappSessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"barbershopId" integer NOT NULL,
	"sessionName" varchar(255) NOT NULL,
	"phoneNumber" varchar(20),
	"qrCode" text,
	"status" "whatsappSessionStatus" DEFAULT 'pending' NOT NULL,
	"isActive" boolean DEFAULT false NOT NULL,
	"errorMessage" text,
	"connectedAt" timestamp,
	"disconnectedAt" timestamp,
	"lastActivityAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "appointmentHistoryBarbershopIdIdx" ON "appointmentHistory" USING btree ("barbershopId");--> statement-breakpoint
CREATE INDEX "appointmentHistoryCompletedAtIdx" ON "appointmentHistory" USING btree ("completedAt");--> statement-breakpoint
CREATE INDEX "appointmentsBarbershopIdIdx" ON "appointments" USING btree ("barbershopId");--> statement-breakpoint
CREATE INDEX "appointmentsClientIdIdx" ON "appointments" USING btree ("clientId");--> statement-breakpoint
CREATE INDEX "appointmentsStatusIdx" ON "appointments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "appointmentsScheduledTimeIdx" ON "appointments" USING btree ("scheduledTime");--> statement-breakpoint
CREATE INDEX "barbersBarbershopIdIdx" ON "barbers" USING btree ("barbershopId");--> statement-breakpoint
CREATE INDEX "ownerIdIdx" ON "barbershops" USING btree ("ownerId");--> statement-breakpoint
CREATE INDEX "breaksBarberShopIdIdx" ON "breaks" USING btree ("barbershopId");--> statement-breakpoint
CREATE INDEX "breaksBarberIdIdx" ON "breaks" USING btree ("barberId");--> statement-breakpoint
CREATE INDEX "clientsBarbershopIdIdx" ON "clients" USING btree ("barbershopId");--> statement-breakpoint
CREATE INDEX "clientsPhoneIdx" ON "clients" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "googleCalEventsBarbershopIdIdx" ON "googleCalendarEvents" USING btree ("barbershopId");--> statement-breakpoint
CREATE INDEX "googleCalEventsGoogleEventIdIdx" ON "googleCalendarEvents" USING btree ("googleEventId");--> statement-breakpoint
CREATE INDEX "googleCalEventsLocalEventIdIdx" ON "googleCalendarEvents" USING btree ("localEventId");--> statement-breakpoint
CREATE INDEX "googleCalIntegrationBarbershopIdIdx" ON "googleCalendarIntegrations" USING btree ("barbershopId");--> statement-breakpoint
CREATE INDEX "googleCalIntegrationUserIdIdx" ON "googleCalendarIntegrations" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "googleCalSyncLogsBarbershopIdIdx" ON "googleCalendarSyncLogs" USING btree ("barbershopId");--> statement-breakpoint
CREATE INDEX "googleCalSyncLogsStatusIdx" ON "googleCalendarSyncLogs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "googleCalSyncLogsCreatedAtIdx" ON "googleCalendarSyncLogs" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "queuesBarbershopIdIdx" ON "queues" USING btree ("barbershopId");--> statement-breakpoint
CREATE INDEX "queuesAppointmentIdIdx" ON "queues" USING btree ("appointmentId");--> statement-breakpoint
CREATE INDEX "servicesBarbershopIdIdx" ON "services" USING btree ("barbershopId");--> statement-breakpoint
CREATE INDEX "timeBlocksBarberShopIdIdx" ON "timeBlocks" USING btree ("barbershopId");--> statement-breakpoint
CREATE INDEX "timeBlocksBarberIdIdx" ON "timeBlocks" USING btree ("barberId");--> statement-breakpoint
CREATE INDEX "timeBlocksStartTimeIdx" ON "timeBlocks" USING btree ("startTime");--> statement-breakpoint
CREATE INDEX "webhookLogsBarbershopIdIdx" ON "webhookLogs" USING btree ("barbershopId");--> statement-breakpoint
CREATE INDEX "webhookLogsEventTypeIdx" ON "webhookLogs" USING btree ("eventType");--> statement-breakpoint
CREATE INDEX "webhookLogsStatusIdx" ON "webhookLogs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "webhookLogsCreatedAtIdx" ON "webhookLogs" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "whatsappAutoResponsesBarbershopIdIdx" ON "whatsappAutoResponses" USING btree ("barbershopId");--> statement-breakpoint
CREATE INDEX "whatsappAutoResponsesTriggerIdx" ON "whatsappAutoResponses" USING btree ("trigger");--> statement-breakpoint
CREATE INDEX "whatsappAutoResponsesIsActiveIdx" ON "whatsappAutoResponses" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "whatsappInstancesBarbershopIdIdx" ON "whatsappInstances" USING btree ("barbershopId");--> statement-breakpoint
CREATE INDEX "whatsappMessagesSessionIdIdx" ON "whatsappMessages" USING btree ("sessionId");--> statement-breakpoint
CREATE INDEX "whatsappMessagesBarbershopIdIdx" ON "whatsappMessages" USING btree ("barbershopId");--> statement-breakpoint
CREATE INDEX "whatsappMessagesClientPhoneIdx" ON "whatsappMessages" USING btree ("clientPhone");--> statement-breakpoint
CREATE INDEX "whatsappMessagesDirectionIdx" ON "whatsappMessages" USING btree ("direction");--> statement-breakpoint
CREATE INDEX "whatsappMessagesAppointmentIdIdx" ON "whatsappMessages" USING btree ("appointmentId");--> statement-breakpoint
CREATE INDEX "whatsappMessagesCreatedAtIdx" ON "whatsappMessages" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "whatsappSessionsBarbershopIdIdx" ON "whatsappSessions" USING btree ("barbershopId");--> statement-breakpoint
CREATE INDEX "whatsappSessionsStatusIdx" ON "whatsappSessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "whatsappSessionsIsActiveIdx" ON "whatsappSessions" USING btree ("isActive");