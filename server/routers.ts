import { router } from "./_core/trpc";
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
import { googleCalendarRouter } from "./routers/google-calendar";
import { webhookRouter } from "./routers/webhook";

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
  googleCalendar: googleCalendarRouter,
  webhook: webhookRouter,
});

export type AppRouter = typeof appRouter;
