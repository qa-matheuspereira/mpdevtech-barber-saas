import { getDb } from "../db";
import { appointments, whatsappSessions, clients } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendMessage } from "./wppconnect-api";

export interface NotificationTemplate {
  type: "confirmation" | "reminder" | "started" | "completed" | "queue_position";
  clientName: string;
  barbershopName: string;
  serviceName?: string;
  time?: string;
  queuePosition?: number;
  barbershopPhone?: string;
}

/**
 * Gerar mensagem de confirmação de agendamento
 */
export function generateConfirmationMessage(data: NotificationTemplate): string {
  return `Olá ${data.clientName}! 👋\n\nSeu agendamento foi confirmado! ✅\n\n📍 ${data.barbershopName}\n💈 Serviço: ${data.serviceName}\n⏰ Horário: ${data.time}\n\nAte logo!`;
}

/**
 * Gerar mensagem de lembrete
 */
export function generateReminderMessage(data: NotificationTemplate): string {
  return `Oi ${data.clientName}! 🔔\n\nLembrete: Seu agendamento é em 1 hora!\n\n📍 ${data.barbershopName}\n💈 ${data.serviceName}\n⏰ ${data.time}\n\nCaso não possa comparecer, avise com antecedência.`;
}

/**
 * Gerar mensagem de início de atendimento
 */
export function generateStartedMessage(data: NotificationTemplate): string {
  return `Oi ${data.clientName}! ✂️\n\nSeu atendimento está começando!\n\n📍 ${data.barbershopName}\n💈 ${data.serviceName}`;
}

/**
 * Gerar mensagem de conclusão
 */
export function generateCompletedMessage(data: NotificationTemplate): string {
  return `Obrigado ${data.clientName}! 😊\n\nSeu atendimento foi concluído!\n\n📍 ${data.barbershopName}\n💈 ${data.serviceName}\n\nVolte sempre! 💪`;
}

/**
 * Gerar mensagem de posição na fila
 */
export function generateQueuePositionMessage(data: NotificationTemplate): string {
  return `Oi ${data.clientName}! 👋\n\nVocê foi adicionado à fila!\n\n📍 ${data.barbershopName}\n💈 ${data.serviceName}\n\nPosição na fila: #${data.queuePosition}\n\nAvisaremos quando for sua vez!`;
}

/**
 * Enviar notificação de confirmação de agendamento
 */
export async function sendConfirmationNotification(
  appointmentId: number,
  establishmentId: number
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    // Obter dados do agendamento
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!appointment) return false;

    // Obter dados do cliente
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, appointment.clientId))
      .limit(1);

    if (!client || !client.phone) return false;

    // Obter sessão WhatsApp ativa
    const [session] = await db
      .select()
      .from(whatsappSessions)
      .where(eq(whatsappSessions.establishmentId, establishmentId))
      .limit(1);

    if (!session || !session.isActive) return false;

    // Gerar e enviar mensagem
    const message = generateConfirmationMessage({
      type: "confirmation",
      clientName: client.name,
      barbershopName: "Sua Barbearia",
      serviceName: "Serviço",
      time: appointment.scheduledTime ? new Date(appointment.scheduledTime).toLocaleString("pt-BR") : "Horário não definido",
    });

    await sendMessage(session.sessionName, client.phone, message);
    return true;
  } catch (error) {
    console.error("Erro ao enviar notificação de confirmação:", error);
    return false;
  }
}

/**
 * Enviar notificação de lembrete
 */
export async function sendReminderNotification(
  appointmentId: number,
  establishmentId: number
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    // Obter dados do agendamento
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!appointment) return false;

    // Obter dados do cliente
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, appointment.clientId))
      .limit(1);

    if (!client || !client.phone) return false;

    // Obter sessão WhatsApp ativa
    const [session] = await db
      .select()
      .from(whatsappSessions)
      .where(eq(whatsappSessions.establishmentId, establishmentId))
      .limit(1);

    if (!session || !session.isActive) return false;

    // Gerar e enviar mensagem
    const message = generateReminderMessage({
      type: "reminder",
      clientName: client.name,
      barbershopName: "Sua Barbearia",
      serviceName: "Serviço",
      time: appointment.scheduledTime ? new Date(appointment.scheduledTime).toLocaleString("pt-BR") : "Horário não definido",
    });

    await sendMessage(session.sessionName, client.phone, message);
    return true;
  } catch (error) {
    console.error("Erro ao enviar notificação de lembrete:", error);
    return false;
  }
}

/**
 * Enviar notificação de início de atendimento
 */
export async function sendStartedNotification(
  appointmentId: number,
  establishmentId: number
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    // Obter dados do agendamento
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!appointment) return false;

    // Obter dados do cliente
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, appointment.clientId))
      .limit(1);

    if (!client || !client.phone) return false;

    // Obter sessão WhatsApp ativa
    const [session] = await db
      .select()
      .from(whatsappSessions)
      .where(eq(whatsappSessions.establishmentId, establishmentId))
      .limit(1);

    if (!session || !session.isActive) return false;

    // Gerar e enviar mensagem
    const message = generateStartedMessage({
      type: "started",
      clientName: client.name,
      barbershopName: "Sua Barbearia",
      serviceName: "Serviço",
    });

    await sendMessage(session.sessionName, client.phone, message);
    return true;
  } catch (error) {
    console.error("Erro ao enviar notificação de início:", error);
    return false;
  }
}

/**
 * Enviar notificação de conclusão
 */
export async function sendCompletedNotification(
  appointmentId: number,
  establishmentId: number
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    // Obter dados do agendamento
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!appointment) return false;

    // Obter dados do cliente
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, appointment.clientId))
      .limit(1);

    if (!client || !client.phone) return false;

    // Obter sessão WhatsApp ativa
    const [session] = await db
      .select()
      .from(whatsappSessions)
      .where(eq(whatsappSessions.establishmentId, establishmentId))
      .limit(1);

    if (!session || !session.isActive) return false;

    // Gerar e enviar mensagem
    const message = generateCompletedMessage({
      type: "completed",
      clientName: client.name,
      barbershopName: "Sua Barbearia",
      serviceName: "Serviço",
    });

    await sendMessage(session.sessionName, client.phone, message);
    return true;
  } catch (error) {
    console.error("Erro ao enviar notificação de conclusão:", error);
    return false;
  }
}

/**
 * Enviar notificação de posição na fila
 */
export async function sendQueuePositionNotification(
  clientPhone: string,
  clientName: string,
  establishmentId: number,
  serviceName: string,
  queuePosition: number
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    // Obter sessão WhatsApp ativa
    const [session] = await db
      .select()
      .from(whatsappSessions)
      .where(eq(whatsappSessions.establishmentId, establishmentId))
      .limit(1);

    if (!session || !session.isActive) return false;

    // Gerar e enviar mensagem
    const message = generateQueuePositionMessage({
      type: "queue_position",
      clientName,
      barbershopName: "Sua Barbearia",
      serviceName,
      queuePosition,
    });

    await sendMessage(session.sessionName, clientPhone, message);
    return true;
  } catch (error) {
    console.error("Erro ao enviar notificação de fila:", error);
    return false;
  }
}
