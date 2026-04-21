import { getDb } from "../db";
import { appointments, whatsappSessions, clients, services } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { sendMessage } from "./wppconnect-api";

/**
 * Enviar notificação de confirmação de agendamento via WhatsApp
 */
export async function sendConfirmationNotification(appointmentId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Obter dados do agendamento
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!appointment) throw new Error("Appointment not found");

    // Obter dados do cliente
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, appointment.clientId))
      .limit(1);

    if (!client) throw new Error("Client not found");

    // Obter serviço
    const [service] = await db
      .select()
      .from(services)
      .where(eq(services.id, appointment.serviceId))
      .limit(1);

    // Obter sessão WhatsApp ativa
    const [session] = await db
      .select()
      .from(whatsappSessions)
      .where(
        and(
          eq(whatsappSessions.establishmentId, appointment.establishmentId),
          eq(whatsappSessions.isActive, true)
        )
      )
      .limit(1);

    if (!session) {
      console.log("No active WhatsApp session for barbershop:", appointment.establishmentId);
      return;
    }

    // Formatar mensagem
    const appointmentDate = appointment.scheduledTime 
      ? new Date(appointment.scheduledTime).toLocaleDateString("pt-BR")
      : "Data não definida";
    const appointmentTime = appointment.scheduledTime
      ? new Date(appointment.scheduledTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      : "Horário não definido";
    const serviceName = service?.name || "Serviço";

    const message = `✅ Seu agendamento foi confirmado!\n\n📅 Data: ${appointmentDate}\n⏰ Horário: ${appointmentTime}\n💇 Serviço: ${serviceName}\n\nAté logo!`;

    // Enviar mensagem
    await sendMessage(session.sessionName, client.phone || "", message);
    console.log(`Confirmation notification sent for appointment ${appointmentId}`);
  } catch (error) {
    console.error("Error sending confirmation notification:", error);
  }
}

/**
 * Enviar notificação de lembrete 1 hora antes do agendamento
 */
export async function sendReminderNotification(appointmentId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Obter dados do agendamento
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!appointment) throw new Error("Appointment not found");

    // Obter dados do cliente
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, appointment.clientId))
      .limit(1);

    if (!client) throw new Error("Client not found");

    // Obter sessão WhatsApp ativa
    const [session] = await db
      .select()
      .from(whatsappSessions)
      .where(
        and(
          eq(whatsappSessions.establishmentId, appointment.establishmentId),
          eq(whatsappSessions.isActive, true)
        )
      )
      .limit(1);

    if (!session) {
      console.log("No active WhatsApp session for barbershop:", appointment.establishmentId);
      return;
    }

    // Formatar mensagem
    const appointmentTime = appointment.scheduledTime
      ? new Date(appointment.scheduledTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      : "Horário não definido";
    const message = `⏰ Lembrete: Seu agendamento é em 1 hora!\n\n🕐 Horário: ${appointmentTime}\n\nNão se atrase! 😊`;

    // Enviar mensagem
    await sendMessage(session.sessionName, client.phone || "", message);
    console.log(`Reminder notification sent for appointment ${appointmentId}`);
  } catch (error) {
    console.error("Error sending reminder notification:", error);
  }
}

/**
 * Enviar notificação ao iniciar atendimento
 */
export async function sendStartNotification(appointmentId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Obter dados do agendamento
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!appointment) throw new Error("Appointment not found");

    // Obter dados do cliente
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, appointment.clientId))
      .limit(1);

    if (!client) throw new Error("Client not found");

    // Obter sessão WhatsApp ativa
    const [session] = await db
      .select()
      .from(whatsappSessions)
      .where(
        and(
          eq(whatsappSessions.establishmentId, appointment.establishmentId),
          eq(whatsappSessions.isActive, true)
        )
      )
      .limit(1);

    if (!session) {
      console.log("No active WhatsApp session for barbershop:", appointment.establishmentId);
      return;
    }

    // Formatar mensagem
    const message = `🎉 Seu atendimento está começando!\n\nVocê já pode se dirigir ao estabelecimento. Obrigado! 💇`;

    // Enviar mensagem
    await sendMessage(session.sessionName, client.phone || "", message);
    console.log(`Start notification sent for appointment ${appointmentId}`);
  } catch (error) {
    console.error("Error sending start notification:", error);
  }
}

/**
 * Enviar notificação ao concluir atendimento
 */
export async function sendCompletionNotification(appointmentId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Obter dados do agendamento
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!appointment) throw new Error("Appointment not found");

    // Obter dados do cliente
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, appointment.clientId))
      .limit(1);

    if (!client) throw new Error("Client not found");

    // Obter sessão WhatsApp ativa
    const [session] = await db
      .select()
      .from(whatsappSessions)
      .where(
        and(
          eq(whatsappSessions.establishmentId, appointment.establishmentId),
          eq(whatsappSessions.isActive, true)
        )
      )
      .limit(1);

    if (!session) {
      console.log("No active WhatsApp session for barbershop:", appointment.establishmentId);
      return;
    }

    // Formatar mensagem
    const message = `✨ Seu atendimento foi concluído!\n\n💇 Muito obrigado pela visita!\n\nVolte sempre! 😊`;

    // Enviar mensagem
    await sendMessage(session.sessionName, client.phone || "", message);
    console.log(`Completion notification sent for appointment ${appointmentId}`);
  } catch (error) {
    console.error("Error sending completion notification:", error);
  }
}

/**
 * Enviar notificação de posição na fila
 */
export async function sendQueuePositionNotification(appointmentId: number, position: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Obter dados do agendamento
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!appointment) throw new Error("Appointment not found");

    // Obter dados do cliente
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, appointment.clientId))
      .limit(1);

    if (!client) throw new Error("Client not found");

    // Obter sessão WhatsApp ativa
    const [session] = await db
      .select()
      .from(whatsappSessions)
      .where(
        and(
          eq(whatsappSessions.establishmentId, appointment.establishmentId),
          eq(whatsappSessions.isActive, true)
        )
      )
      .limit(1);

    if (!session) {
      console.log("No active WhatsApp session for barbershop:", appointment.establishmentId);
      return;
    }

    // Formatar mensagem
    const message = `📍 Sua posição na fila: ${position}º lugar\n\nVocê será chamado em breve! ⏳`;

    // Enviar mensagem
    await sendMessage(session.sessionName, client.phone || "", message);
    console.log(`Queue position notification sent for appointment ${appointmentId}`);
  } catch (error) {
    console.error("Error sending queue position notification:", error);
  }
}
