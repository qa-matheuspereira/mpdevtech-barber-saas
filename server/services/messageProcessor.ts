import { getDb } from "../db";
import {
  whatsappMessages,
  whatsappAutoResponses,
  appointments,
  clients,
  whatsappSessions,
} from "../../drizzle/schema";
import { eq, and, like, ilike } from "drizzle-orm";
import { sendMessage } from "./wppconnect-api";
import { invokeLLM } from "../_core/llm";

/**
 * Processar mensagem recebida e executar ações automáticas
 */
export async function processIncomingMessage(
  messageId: number,
  sessionId: number,
  clientPhone: string,
  messageText: string,
  establishmentId: number
) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    console.log(
      `Processing message ${messageId} from ${clientPhone}: "${messageText}"`
    );

    // 1. Analisar sentimento da mensagem
    const sentiment = await analyzeSentiment(messageText);

    // 2. Categorizar mensagem
    const category = await categorizeMessage(messageText);

    // 3. Buscar respostas automáticas
    const autoResponse = await findAutoResponse(establishmentId, messageText);

    // 4. Atualizar mensagem com análise
    await db
      .update(whatsappMessages)
      .set({
        sentiment: sentiment as any,
        category,
        updatedAt: new Date(),
      })
      .where(eq(whatsappMessages.id, messageId));

    // 5. Executar ações baseadas na categoria
    await executeActions(
      sessionId,
      clientPhone,
      messageText,
      category,
      establishmentId,
      autoResponse
    );
  } catch (error) {
    console.error("Error processing message:", error);
  }
}

/**
 * Analisar sentimento da mensagem usando IA
 */
async function analyzeSentiment(
  messageText: string
): Promise<"positive" | "neutral" | "negative"> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            'Analyze the sentiment of the following message and respond with only one word: "positive", "neutral", or "negative".',
        },
        {
          role: "user",
          content: messageText,
        },
      ],
    });

    const content = response.choices[0].message.content;
    if (typeof content !== "string") {
      return "neutral";
    }
    const sentiment = content.toLowerCase().trim() as "positive" | "neutral" | "negative";
    return ["positive", "neutral", "negative"].includes(sentiment)
      ? sentiment
      : "neutral";
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    return "neutral";
  }
}

/**
 * Categorizar mensagem (confirmação, cancelamento, dúvida, etc)
 */
async function categorizeMessage(messageText: string): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            'Categorize the following message in one of these categories: "confirmation", "cancellation", "question", "complaint", "feedback", "other". Respond with only the category name.',
        },
        {
          role: "user",
          content: messageText,
        },
      ],
    });

    const content = response.choices[0].message.content;
    if (typeof content === "string") {
      return content.toLowerCase().trim();
    }
    return "other";
  } catch (error) {
    console.error("Error categorizing message:", error);
    return "other";
  }
}

/**
 * Buscar resposta automática configurada
 */
async function findAutoResponse(
  establishmentId: number,
  messageText: string
): Promise<string | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    // Buscar respostas automáticas ativas
    const responses = await db
      .select()
      .from(whatsappAutoResponses)
      .where(
        and(
          eq(whatsappAutoResponses.establishmentId, establishmentId),
          eq(whatsappAutoResponses.isActive, true)
        )
      );

    // Encontrar resposta que melhor corresponde à mensagem
    const lowerMessage = messageText.toLowerCase();

    // Ordenar por prioridade e verificar triggers
    const matchedResponse = responses
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .find((r) => {
        const triggers = r.trigger.split("|").map((t) => t.trim().toLowerCase());
        return triggers.some((trigger) => lowerMessage.includes(trigger));
      });

    return matchedResponse?.response || null;
  } catch (error) {
    console.error("Error finding auto response:", error);
    return null;
  }
}

/**
 * Executar ações baseadas na categoria da mensagem
 */
async function executeActions(
  sessionId: number,
  clientPhone: string,
  messageText: string,
  category: string,
  establishmentId: number,
  autoResponse: string | null
) {
  try {
    const db = await getDb();
    if (!db) return;

    // Obter sessão
    const [session] = await db
      .select()
      .from(whatsappSessions)
      .where(eq(whatsappSessions.id, sessionId))
      .limit(1);

    if (!session) return;

    let responseMessage = "";

    // Ações específicas por categoria
    switch (category) {
      case "confirmation":
        // Confirmar agendamento
        responseMessage =
          autoResponse ||
          "✅ Obrigado pela confirmação! Seu agendamento está confirmado.";
        await handleConfirmation(establishmentId, clientPhone);
        break;

      case "cancellation":
        // Processar cancelamento
        responseMessage =
          autoResponse ||
          "❌ Seu agendamento foi cancelado. Você pode agendar novamente quando desejar.";
        await handleCancellation(establishmentId, clientPhone);
        break;

      case "question":
        // Responder com IA se não houver resposta automática
        if (autoResponse) {
          responseMessage = autoResponse;
        } else {
          responseMessage = await generateAIResponse(messageText);
        }
        break;

      case "complaint":
        // Registrar reclamação e alertar gerente
        responseMessage =
          autoResponse ||
          "😔 Desculpe pelos problemas. Vamos resolver isso em breve!";
        await notifyEstablishmentOwner(
          establishmentId,
          `Reclamação recebida de ${clientPhone}: ${messageText}`
        );
        break;

      default:
        // Resposta padrão
        if (autoResponse) {
          responseMessage = autoResponse;
        } else {
          responseMessage =
            "Obrigado pela mensagem! Como posso ajudá-lo? 😊";
        }
    }

    // Enviar resposta automática
    if (responseMessage) {
      await sendMessage(session.sessionName, clientPhone, responseMessage);

      // Registrar resposta automática
      await db.insert(whatsappMessages).values({
        sessionId,
        establishmentId,
        clientPhone,
        messageText: responseMessage,
        messageType: "text",
        direction: "outbound",
        status: "sent",
        autoReply: true,
        category,
      });
    }
  } catch (error) {
    console.error("Error executing actions:", error);
  }
}

/**
 * Processar confirmação de agendamento
 */
async function handleConfirmation(
  establishmentId: number,
  clientPhone: string
) {
  try {
    const db = await getDb();
    if (!db) return;

    // Buscar agendamento pendente do cliente
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.establishmentId, establishmentId),
          eq(appointments.status, "pending")
        )
      )
      .limit(1);

    if (appointment) {
      // Atualizar status para confirmado
      await db
        .update(appointments)
        .set({
          status: "confirmed",
          updatedAt: new Date(),
        })
        .where(eq(appointments.id, appointment.id));

      console.log(`Appointment ${appointment.id} confirmed`);
    }
  } catch (error) {
    console.error("Error handling confirmation:", error);
  }
}

/**
 * Processar cancelamento de agendamento
 */
async function handleCancellation(
  establishmentId: number,
  clientPhone: string
) {
  try {
    const db = await getDb();
    if (!db) return;

    // Buscar agendamento confirmado do cliente
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.establishmentId, establishmentId),
          eq(appointments.status, "confirmed")
        )
      )
      .limit(1);

    if (appointment) {
      // Atualizar status para cancelado
      await db
        .update(appointments)
        .set({
          status: "cancelled",
          updatedAt: new Date(),
        })
        .where(eq(appointments.id, appointment.id));

      console.log(`Appointment ${appointment.id} cancelled`);
    }
  } catch (error) {
    console.error("Error handling cancellation:", error);
  }
}

/**
 * Gerar resposta usando IA
 */
async function generateAIResponse(messageText: string): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "Você é um assistente de agendamentos. Responda de forma amigável e profissional em português. Mantenha as respostas curtas (máximo 2 linhas).",
        },
        {
          role: "user",
          content: messageText,
        },
      ],
    });

    const content = response.choices[0].message.content;
    if (typeof content === "string") {
      return content;
    }
    return "Obrigado pela mensagem! Como posso ajudá-lo?";
  } catch (error) {
    console.error("Error generating AI response:", error);
    return "Obrigado pela mensagem! Como posso ajudá-lo? 😊";
  }
}

/**
 * Notificar proprietário da barbearia
 */
async function notifyEstablishmentOwner(
  establishmentId: number,
  message: string
) {
  try {
    // Implementar notificação (pode ser email, push, etc)
    console.log(`Notification for barbershop ${establishmentId}: ${message}`);
  } catch (error) {
    console.error("Error notifying barbershop owner:", error);
  }
}
