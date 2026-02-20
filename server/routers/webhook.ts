import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import {
  whatsappMessages,
  whatsappAutoResponses,
  webhookLogs,
} from "../../drizzle/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const webhookRouter = router({
  // Listar mensagens recebidas
  getMessages: protectedProcedure
    .input(
      z.object({
        establishmentId: z.number(),
        sessionId: z.number().optional(),
        direction: z.enum(["inbound", "outbound", "both"]).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      const whereConditions = [
        eq(whatsappMessages.establishmentId, input.establishmentId),
      ];

      if (input.sessionId) {
        whereConditions.push(eq(whatsappMessages.sessionId, input.sessionId));
      }

      if (input.direction && input.direction !== "both") {
        whereConditions.push(eq(whatsappMessages.direction, input.direction));
      }

      const messages = await db
        .select()
        .from(whatsappMessages)
        .where(and(...whereConditions))
        .orderBy(desc(whatsappMessages.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return messages;
    }),

  // Obter detalhes de uma mensagem
  getMessage: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      const [message] = await db
        .select()
        .from(whatsappMessages)
        .where(eq(whatsappMessages.id, input.id))
        .limit(1);

      if (!message) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Message not found" });
      }

      return message;
    }),

  // Criar resposta automática
  createAutoResponse: protectedProcedure
    .input(
      z.object({
        establishmentId: z.number(),
        trigger: z.string().min(1),
        response: z.string().min(1),
        category: z.string().optional(),
        priority: z.number().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      const result = await db.insert(whatsappAutoResponses).values({
        establishmentId: input.establishmentId,
        trigger: input.trigger,
        response: input.response,
        category: input.category,
        priority: input.priority,
        isActive: true,
      });

      return {
        id: (result as any).insertId || 0,
        ...input,
        isActive: true,
      };
    }),

  // Listar respostas automáticas
  getAutoResponses: protectedProcedure
    .input(
      z.object({
        establishmentId: z.number(),
        category: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      const whereConditions = [
        eq(whatsappAutoResponses.establishmentId, input.establishmentId),
      ];

      if (input.category) {
        whereConditions.push(
          eq(whatsappAutoResponses.category, input.category)
        );
      }

      const responses = await db
        .select()
        .from(whatsappAutoResponses)
        .where(and(...whereConditions))
        .orderBy(desc(whatsappAutoResponses.priority));

      return responses;
    }),

  // Atualizar resposta automática
  updateAutoResponse: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        trigger: z.string().optional(),
        response: z.string().optional(),
        category: z.string().optional(),
        priority: z.number().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      const updateData: any = {};
      if (input.trigger !== undefined) updateData.trigger = input.trigger;
      if (input.response !== undefined) updateData.response = input.response;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.priority !== undefined) updateData.priority = input.priority;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;

      await db
        .update(whatsappAutoResponses)
        .set(updateData)
        .where(eq(whatsappAutoResponses.id, input.id));

      return { success: true };
    }),

  // Deletar resposta automática
  deleteAutoResponse: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      await db
        .delete(whatsappAutoResponses)
        .where(eq(whatsappAutoResponses.id, input.id));

      return { success: true };
    }),

  // Obter logs de webhook
  getWebhookLogs: protectedProcedure
    .input(
      z.object({
        establishmentId: z.number(),
        eventType: z.string().optional(),
        status: z.enum(["success", "failed", "pending"]).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      const whereConditions = [
        eq(webhookLogs.establishmentId, input.establishmentId),
      ];

      if (input.eventType) {
        whereConditions.push(eq(webhookLogs.eventType, input.eventType));
      }

      if (input.status) {
        whereConditions.push(eq(webhookLogs.status, input.status));
      }

      const logs = await db
        .select()
        .from(webhookLogs)
        .where(and(...whereConditions))
        .orderBy(desc(webhookLogs.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return logs;
    }),

  // Obter estatísticas de mensagens
  getMessageStats: protectedProcedure
    .input(
      z.object({
        establishmentId: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      const whereConditions = [
        eq(whatsappMessages.establishmentId, input.establishmentId),
      ];

      if (input.startDate) {
        whereConditions.push(gte(whatsappMessages.createdAt, input.startDate));
      }

      if (input.endDate) {
        whereConditions.push(lte(whatsappMessages.createdAt, input.endDate));
      }

      const messages = await db
        .select()
        .from(whatsappMessages)
        .where(and(...whereConditions));

      const stats = {
        total: messages.length,
        inbound: messages.filter((m) => m.direction === "inbound").length,
        outbound: messages.filter((m) => m.direction === "outbound").length,
        autoReplies: messages.filter((m) => m.autoReply).length,
        byCategory: {} as Record<string, number>,
        bySentiment: {
          positive: messages.filter((m) => m.sentiment === "positive").length,
          neutral: messages.filter((m) => m.sentiment === "neutral").length,
          negative: messages.filter((m) => m.sentiment === "negative").length,
        },
      };

      // Contar por categoria
      messages.forEach((m) => {
        if (m.category) {
          stats.byCategory[m.category] =
            (stats.byCategory[m.category] || 0) + 1;
        }
      });

      return stats;
    }),
});
