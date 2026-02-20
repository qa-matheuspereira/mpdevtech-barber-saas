import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { whatsappMessages, whatsappInstances, webhookLogs, clients } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
// import { processIncomingMessage } from "../services/messageProcessor"; // Helper to be adapted

const router = Router();

/**
 * Webhook para receber eventos da Evolution API
 * POST /api/webhook/whatsapp
 */
router.post("/whatsapp", async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(503).json({ error: "Database unavailable" });
    }

    const { type, data, instance } = req.body;

    // Log raw webhook
    const [instanceRecord] = await db
      .select()
      .from(whatsappInstances)
      .where(eq(whatsappInstances.instanceName, instance))
      .limit(1);

    if (instanceRecord) {
      await db.insert(webhookLogs).values({
        establishmentId: instanceRecord.establishmentId,
        eventType: type,
        payload: req.body,
        status: "success",
      });
    }

    // Handle Messages Upsert (New Message)
    if (type === "MESSAGES_UPSERT") {
      const { key, message, pushName, messageType, messageTimestamp } = data;

      if (!key.fromMe) { // Ignore messages sent by me (unless we want to track them too)
        const remoteJid = key.remoteJid;
        const clientPhone = remoteJid.replace(/\D/g, ""); // Extract numbers
        const messageId = key.id;

        // Determine message text content
        let messageText = "";
        if (messageType === "conversation") {
          messageText = message.conversation;
        } else if (messageType === "extendedTextMessage") {
          messageText = message.extendedTextMessage.text;
        } else {
          messageText = `[${messageType}]`;
        }

        if (instanceRecord) {
          // Find or Create Client
          let [client] = await db
            .select()
            .from(clients)
            .where(eq(clients.phone, clientPhone))
            .limit(1);

          if (!client) {
            const result = await db.insert(clients).values({
              establishmentId: instanceRecord.establishmentId,
              name: pushName || `Cliente ${clientPhone}`,
              phone: clientPhone,
              whatsapp: clientPhone,
            });
            // We'd fetch back to get ID, but for now we just need to know it's handled
          }

          // Save Message
          await db.insert(whatsappMessages).values({
            sessionId: instanceRecord.id, // Using instance ID as session ID
            establishmentId: instanceRecord.establishmentId,
            clientPhone,
            clientName: pushName,
            messageText,
            messageType: "text", // mapping simple text for now
            direction: "inbound",
            externalMessageId: messageId,
            status: "delivered",
            createdAt: new Date(messageTimestamp * 1000),
          });

          // Trigger AI Processing here if enabled
          // TODO: Implement AI processing
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

export default router;
