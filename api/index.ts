import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import webhookRoutes from "../server/_core/webhook-routes";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/api/webhook", webhookRoutes);
app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

export default app;
