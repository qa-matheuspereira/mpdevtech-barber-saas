import { getDb } from "../db";
import { appointments, whatsappSessions, clients, establishments } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendMessage } from "./wppconnect-api";

export interface NotificationTemplate {
  type: "confirmation" | "reminder" | "started" | "completed" | "queue_position";
  clientName: string;
  establishmentName: string;
  serviceName?: string;
  time?: string;
  queuePosition?: number;
  establishmentPhone?: string;
}

export function generateConfirmationMessage(data: NotificationTemplate): string {
  return `Olá ${data.clientName}! 👋\n\nSeu agendamento foi confirmado! ✅\n\n📍 ${data.establishmentName}\n💈 Serviço: ${data.serviceName}\n⏰ Horário: ${data.time}\n\nAté logo!`;
}

export function generateReminderMessage(data: NotificationTemplate): string {
  return `Oi ${data.clientName}! 🔔\n\nLembrete: Seu agendamento é em 1 hora!\n\n📍 ${data.establishmentName}\n💈 ${data.serviceName}\n⏰ ${data.time}\n\nCaso não possa comparecer, avise com antecedência.`;
}

export function generateStartedMessage(data: NotificationTemplate): string {
  return `Oi ${data.clientName}! ✂️\n\nSeu atendimento está começando!\n\n📍 ${data.establishmentName}\n💈 ${data.serviceName}`;
}

export function generateCompletedMessage(data: NotificationTemplate): string {
  return `Obrigado ${data.clientName}! 😊\n\nSeu atendimento foi concluído!\n\n📍 ${data.establishmentName}\n💈 ${data.serviceName}\n\nVolte sempre! 💪`;
}

export function generateQueuePositionMessage(data: NotificationTemplate): string {
  return `Oi ${data.clientName}! 👋\n\nVocê foi adicionado à fila!\n\n📍 ${data.establishmentName}\n💈 ${data.serviceName}\n\nPosição na fila: #${data.queuePosition}\n\nAvisaremos quando for sua vez!`;
}

async function loadAppointmentData(appointmentId: number, establishmentId: number) {
  const db = await getDb();
  if (!db) return null;

  const [appointment] = await db.select().from(appointments).where(eq(appointments.id, appointmentId)).limit(1);
  if (!appointment) return null;

  const [client] = await db.select().from(clients).where(eq(clients.id, appointment.clientId)).limit(1);
  if (!client || !client.phone) return null;

  const [session] = await db.select().from(whatsappSessions).where(eq(whatsappSessions.establishmentId, establishmentId)).limit(1);
  if (!session || !session.isActive) return null;

  const [establishment] = await db.select({ name: establishments.name }).from(establishments).where(eq(establishments.id, establishmentId)).limit(1);

  return { appointment, client, session, establishmentName: establishment?.name ?? "Estabelecimento" };
}

export async function sendConfirmationNotification(appointmentId: number, establishmentId: number): Promise<boolean> {
  try {
    const data = await loadAppointmentData(appointmentId, establishmentId);
    if (!data) return false;

    const message = generateConfirmationMessage({
      type: "confirmation",
      clientName: data.client.name,
      establishmentName: data.establishmentName,
      serviceName: "Serviço",
      time: data.appointment.scheduledTime
        ? new Date(data.appointment.scheduledTime).toLocaleString("pt-BR")
        : "Horário não definido",
    });

    await sendMessage(data.session.sessionName, data.client.phone, message);
    return true;
  } catch (error) {
    console.error("Erro ao enviar notificação de confirmação:", error);
    return false;
  }
}

export async function sendReminderNotification(appointmentId: number, establishmentId: number): Promise<boolean> {
  try {
    const data = await loadAppointmentData(appointmentId, establishmentId);
    if (!data) return false;

    const message = generateReminderMessage({
      type: "reminder",
      clientName: data.client.name,
      establishmentName: data.establishmentName,
      serviceName: "Serviço",
      time: data.appointment.scheduledTime
        ? new Date(data.appointment.scheduledTime).toLocaleString("pt-BR")
        : "Horário não definido",
    });

    await sendMessage(data.session.sessionName, data.client.phone, message);
    return true;
  } catch (error) {
    console.error("Erro ao enviar notificação de lembrete:", error);
    return false;
  }
}

export async function sendStartedNotification(appointmentId: number, establishmentId: number): Promise<boolean> {
  try {
    const data = await loadAppointmentData(appointmentId, establishmentId);
    if (!data) return false;

    const message = generateStartedMessage({
      type: "started",
      clientName: data.client.name,
      establishmentName: data.establishmentName,
      serviceName: "Serviço",
    });

    await sendMessage(data.session.sessionName, data.client.phone, message);
    return true;
  } catch (error) {
    console.error("Erro ao enviar notificação de início:", error);
    return false;
  }
}

export async function sendCompletedNotification(appointmentId: number, establishmentId: number): Promise<boolean> {
  try {
    const data = await loadAppointmentData(appointmentId, establishmentId);
    if (!data) return false;

    const message = generateCompletedMessage({
      type: "completed",
      clientName: data.client.name,
      establishmentName: data.establishmentName,
      serviceName: "Serviço",
    });

    await sendMessage(data.session.sessionName, data.client.phone, message);
    return true;
  } catch (error) {
    console.error("Erro ao enviar notificação de conclusão:", error);
    return false;
  }
}

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

    const [session] = await db.select().from(whatsappSessions).where(eq(whatsappSessions.establishmentId, establishmentId)).limit(1);
    if (!session || !session.isActive) return false;

    const [establishment] = await db.select({ name: establishments.name }).from(establishments).where(eq(establishments.id, establishmentId)).limit(1);

    const message = generateQueuePositionMessage({
      type: "queue_position",
      clientName,
      establishmentName: establishment?.name ?? "Estabelecimento",
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
