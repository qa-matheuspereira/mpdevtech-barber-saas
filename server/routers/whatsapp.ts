import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { whatsappInstances } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { EvolutionApiService } from "../services/evolution-api";

async function resolveEstablishmentId(userId: number, inputEstablishmentId?: number): Promise<number> {
  const { getEstablishmentsByOwnerId } = await import("../db");
  const shops = await getEstablishmentsByOwnerId(userId);
  if (shops.length === 0) throw new Error("Nenhum estabelecimento encontrado");

  if (inputEstablishmentId) {
    const match = shops.find(s => s.id === inputEstablishmentId);
    if (!match) throw new Error("Estabelecimento não encontrado");
    return match.id;
  }

  return shops[0].id;
}

async function getEvolutionService(establishmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [instance] = await db
    .select()
    .from(whatsappInstances)
    .where(eq(whatsappInstances.establishmentId, establishmentId))
    .limit(1);

  if (!instance || !instance.apiUrl || !instance.apiKey) {
    throw new Error("Evolution API não configurada para este estabelecimento");
  }

  return {
    service: new EvolutionApiService(instance.apiUrl, instance.apiKey),
    instanceName: instance.instanceName,
    instance,
  };
}

export const whatsappRouter = router({
  updateSettings: protectedProcedure
    .input(z.object({
      establishmentId: z.number().optional(),
      apiUrl: z.string().url(),
      apiKey: z.string().min(1),
      instanceName: z.string().min(1),
      aiConfig: z.object({
        enabled: z.boolean(),
        model: z.string().optional(),
        prompt: z.string().optional(),
        assistantName: z.string().optional(),
        personality: z.string().optional(),
        humanPause: z.string().optional(),
        clientPause: z.string().optional(),
        greetingMessage: z.string().optional(),
        closingMessage: z.string().optional(),
        reminders: z.object({
          first: z.string().optional(),
          second: z.string().optional(),
          third: z.string().optional(),
        }).optional(),
        followUps: z.object({
          first: z.string().optional(),
          second: z.string().optional(),
          third: z.string().optional(),
        }).optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const establishmentId = await resolveEstablishmentId(ctx.user.id, input.establishmentId);

      const [existing] = await db
        .select()
        .from(whatsappInstances)
        .where(eq(whatsappInstances.establishmentId, establishmentId))
        .limit(1);

      if (existing) {
        await db.update(whatsappInstances)
          .set({ apiUrl: input.apiUrl, apiKey: input.apiKey, instanceName: input.instanceName, aiConfig: input.aiConfig, updatedAt: new Date() })
          .where(eq(whatsappInstances.id, existing.id));
      } else {
        await db.insert(whatsappInstances).values({
          establishmentId,
          apiUrl: input.apiUrl,
          apiKey: input.apiKey,
          instanceName: input.instanceName,
          aiConfig: input.aiConfig,
          isActive: true,
        });
      }

      return { success: true };
    }),

  getSettings: protectedProcedure
    .input(z.object({ establishmentId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const establishmentId = await resolveEstablishmentId(ctx.user.id, input?.establishmentId).catch(() => null);
      if (!establishmentId) return null;

      const [settings] = await db
        .select()
        .from(whatsappInstances)
        .where(eq(whatsappInstances.establishmentId, establishmentId))
        .limit(1);

      return settings ?? null;
    }),

  createInstance: protectedProcedure
    .input(z.object({ establishmentId: z.number().optional() }).optional())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const establishmentId = await resolveEstablishmentId(ctx.user.id, input?.establishmentId);

      const { service, instanceName } = await getEvolutionService(establishmentId);
      return service.createInstance(instanceName);
    }),

  connectInstance: protectedProcedure
    .input(z.object({ establishmentId: z.number().optional() }).optional())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const establishmentId = await resolveEstablishmentId(ctx.user.id, input?.establishmentId);

      const { service, instanceName } = await getEvolutionService(establishmentId);
      return service.connectInstance(instanceName);
    }),

  checkConnectionStatus: protectedProcedure
    .input(z.object({ establishmentId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const establishmentId = await resolveEstablishmentId(ctx.user.id, input?.establishmentId).catch(() => null);
      if (!establishmentId) return null;

      try {
        const { service, instanceName } = await getEvolutionService(establishmentId);
        return service.getInstanceStatus(instanceName);
      } catch {
        return { instance: { state: "disconnected" } };
      }
    }),

  disconnectSession: protectedProcedure
    .input(z.object({ establishmentId: z.number().optional() }).optional())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const establishmentId = await resolveEstablishmentId(ctx.user.id, input?.establishmentId);

      const { service, instanceName } = await getEvolutionService(establishmentId);
      await service.logoutInstance(instanceName);
      return { success: true };
    }),

  requestPairingCode: protectedProcedure
    .input(z.object({
      establishmentId: z.number().optional(),
      phoneNumber: z.string().min(10),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const establishmentId = await resolveEstablishmentId(ctx.user.id, input.establishmentId);
      const { service, instanceName } = await getEvolutionService(establishmentId);
      return service.requestPairingCode(instanceName, input.phoneNumber);
    }),

  deleteSession: protectedProcedure
    .input(z.object({ establishmentId: z.number().optional() }).optional())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const establishmentId = await resolveEstablishmentId(ctx.user.id, input?.establishmentId);

      const { service, instanceName } = await getEvolutionService(establishmentId);
      await service.deleteInstance(instanceName);
      return { success: true };
    }),
});
