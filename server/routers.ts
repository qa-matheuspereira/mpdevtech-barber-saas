
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getEstablishmentsByOwnerId, getEstablishmentById } from "./db";
import { establishments } from "../drizzle/schema";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { establishmentRouter } from "./routers/establishment";
import { barbersRouter } from "./routers/barbers";
import { serviceRouter } from "./routers/services";
import { clientRouter } from "./routers/clients";
import { appointmentRouter } from "./routers/appointments";
import { analyticsRouter } from "./routers/analytics";
import { breaksRouter } from "./routers/breaks";
import { whatsappRouter } from "./routers/whatsapp";
import { adminRouter } from "./routers/admin";
import { barberBreaksRouter } from "./routers/barber-breaks";
import { authRouter } from "./routers/auth";

export const appRouter = router({
    auth: authRouter,
    establishment: establishmentRouter,
    barbers: barbersRouter,
    services: serviceRouter,
    clients: clientRouter,
    appointments: appointmentRouter,
    analytics: analyticsRouter,
    breaks: breaksRouter,
    whatsapp: whatsappRouter,
    admin: adminRouter,
    barberBreaks: barberBreaksRouter,

});

export type AppRouter = typeof appRouter;
