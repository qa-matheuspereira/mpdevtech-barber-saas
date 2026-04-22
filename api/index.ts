import express from "express";
import type { Request, Response } from "express";

const app = express();
app.set("etag", false);

app.use((_req: Request, res: Response, next: () => void) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  next();
});

app.use(express.json());

app.get("/api/ping", (_req: Request, res: Response) => {
  res.json({ ok: true, ts: Date.now() });
});

// Lazy-load tRPC router on first request so startup errors surface in response
app.use("/api/trpc", async (req: Request, res: Response) => {
  try {
    const { createExpressMiddleware } = await import("@trpc/server/adapters/express");
    const { appRouter } = await import("../server/routers");
    const { createContext } = await import("../server/_core/context");
    const handler = createExpressMiddleware({ router: appRouter, createContext });
    handler(req, res, (err: unknown) => {
      if (err) res.status(500).json({ error: String(err) });
    });
  } catch (err: any) {
    res.status(500).json({ startup_error: err.message, stack: err.stack?.split("\n").slice(0, 5) });
  }
});

export default app;
