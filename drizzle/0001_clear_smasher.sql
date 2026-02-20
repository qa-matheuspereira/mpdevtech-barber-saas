ALTER TABLE "whatsappInstances" ADD COLUMN "apiUrl" varchar(255);--> statement-breakpoint
ALTER TABLE "whatsappInstances" ADD COLUMN "webhookSecret" varchar(255);--> statement-breakpoint
ALTER TABLE "whatsappInstances" ADD COLUMN "aiConfig" jsonb;