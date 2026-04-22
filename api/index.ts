import express from "express";

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Use dynamic imports so any module-load error is caught and returned
// as a readable HTTP response instead of crashing the function.
const initPromise: Promise<Error | null> = (async () => {
  const { default: webhookRoutes } = await import("../server/_core/webhook-routes");
  const { appRouter } = await import("../server/routers");
  const { createContext } = await import("../server/_core/context");
  const { createExpressMiddleware } = await import("@trpc/server/adapters/express");

  app.use("/api/webhook", webhookRoutes);
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

  return null;
})().catch((err) => (err instanceof Error ? err : new Error(String(err))));

export default async function handler(req: any, res: any) {
  const initError = await initPromise;
  if (initError) {
    console.error("[API] Initialization failed:", initError);
    return res.status(500).json({
      error: "INIT_FAILED",
      message: initError.message,
      stack: initError.stack,
    });
  }
  return app(req, res);
}
