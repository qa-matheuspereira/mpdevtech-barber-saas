CREATE TABLE "barberServices" (
	"id" serial PRIMARY KEY NOT NULL,
	"barberId" integer NOT NULL,
	"serviceId" integer NOT NULL,
	"establishmentId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "barberServiceUnique" ON "barberServices" USING btree ("barberId","serviceId");--> statement-breakpoint
CREATE INDEX "barberServicesBarberIdIdx" ON "barberServices" USING btree ("barberId");--> statement-breakpoint
CREATE INDEX "barberServicesServiceIdIdx" ON "barberServices" USING btree ("serviceId");--> statement-breakpoint
CREATE INDEX "barberServicesEstablishmentIdIdx" ON "barberServices" USING btree ("establishmentId");