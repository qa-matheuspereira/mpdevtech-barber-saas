import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { whatsappInstances } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { EvolutionApiService } from "../services/evolution-api";

// Helper to get service instance
async function getEvolutionService(establishmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [instance] = await db
    .select()
    .from(whatsappInstances)
    .where(eq(whatsappInstances.establishmentId, establishmentId))
    .limit(1);

  if (!instance || !instance.apiUrl || !instance.apiKey) {
    throw new Error("Evolution API not configured for this barbershop");
  }

  return {
    service: new EvolutionApiService(instance.apiUrl, instance.apiKey),
    instanceName: instance.instanceName,
    instance,
  };
}

export const whatsappRouter = router({
  // Salvar/Atualizar configurações da Evolution API
  updateSettings: protectedProcedure
    .input(z.object({
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
          third: z.string().optional()
        }).optional(),
        followUps: z.object({
          first: z.string().optional(),
          second: z.string().optional(),
          third: z.string().optional()
        }).optional()
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Check if settings exist
      const [existing] = await db
        .select()
        .from(whatsappInstances)
        .where(eq(whatsappInstances.establishmentId, 1)) // Assuming single tenant for now or getting from context/barbershop list
        // TODO: Handle multi-tenant properly. user -> barbershop.
        // For now, we'll try to find any instance for the user's barbershop.
        // But since we don't have establishmentId in input, we need to fetch it.
        // Let's assume we pass establishmentId or fetch the first one owned by user.
        .limit(1);

      // Get user's primary barbershop
      const { getEstablishmentsByOwnerId } = await import("../db");
      const shops = await getEstablishmentsByOwnerId(ctx.user.id);
      if (shops.length === 0) throw new Error("No barbershop found");
      const establishmentId = shops[0].id;

      let result;
      if (existing) {
        result = await db.update(whatsappInstances)
          .set({
            apiUrl: input.apiUrl,
            apiKey: input.apiKey,
            instanceName: input.instanceName,
            aiConfig: input.aiConfig,
            updatedAt: new Date(),
          })
          .where(eq(whatsappInstances.id, existing.id));
      } else {
        result = await db.insert(whatsappInstances).values({
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

  // Obter configurações
  getSettings: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const { getEstablishmentsByOwnerId } = await import("../db");
      const shops = await getEstablishmentsByOwnerId(ctx.user.id);
      if (shops.length === 0) return null;
      const establishmentId = shops[0].id;

      const [settings] = await db
        .select()
        .from(whatsappInstances)
        .where(eq(whatsappInstances.establishmentId, establishmentId))
        .limit(1);

      return settings;
    }),

  // Criar Instância (na Evolution API)
  createInstance: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const { getEstablishmentsByOwnerId } = await import("../db");
      const shops = await getEstablishmentsByOwnerId(ctx.user.id);
      if (shops.length === 0) throw new Error("No barbershop found");

      try {
        const { service, instanceName, instance } = await getEvolutionService(shops[0].id);
        const result = await service.createInstance(instanceName);
        return result;
      } catch (error: any) {
        // If already exists, try to fetching connection status/QR
        throw new Error(error.message);
      }
    }),

  // Conectar (Obter QR Code)
  connectInstance: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const { getEstablishmentsByOwnerId } = await import("../db");
      const shops = await getEstablishmentsByOwnerId(ctx.user.id);
      if (shops.length === 0) throw new Error("No barbershop found");

      const { service, instanceName } = await getEvolutionService(shops[0].id);
      const result = await service.connectInstance(instanceName);
      return result; // contains base64/ascii qr
    }),

  // Verificar Status
  checkConnectionStatus: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const { getEstablishmentsByOwnerId } = await import("../db");
      const shops = await getEstablishmentsByOwnerId(ctx.user.id);
      if (shops.length === 0) return null;

      try {
        const { service, instanceName } = await getEvolutionService(shops[0].id);
        const status = await service.getInstanceStatus(instanceName);
        return status;
      } catch (error) {
        return { instance: { state: "disconnected", error: String(error) } };
      }
    }),

  // Desconectar
  disconnectSession: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const { getEstablishmentsByOwnerId } = await import("../db");
      const shops = await getEstablishmentsByOwnerId(ctx.user.id);

      const { service, instanceName } = await getEvolutionService(shops[0].id);
      await service.logoutInstance(instanceName);
      return { success: true };
    }),

  // Delete Session (Limpar da Evolution também)
  deleteSession: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const { getEstablishmentsByOwnerId } = await import("../db");
      const shops = await getEstablishmentsByOwnerId(ctx.user.id);

      const { service, instanceName } = await getEvolutionService(shops[0].id);
      await service.deleteInstance(instanceName);
      return { success: true };
    }),
});

