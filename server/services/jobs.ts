import cron from "node-cron";
import { getDb } from "../db";
import { appointments } from "../../drizzle/schema";
import { eq, lte, gte, and } from "drizzle-orm";
import { sendReminderNotification } from "./notifications";

let reminderJobScheduled = false;

/**
 * Inicializar jobs agendados
 */
export function initializeJobs() {
  if (reminderJobScheduled) return;

  // Job para enviar lembretes 1 hora antes do agendamento
  // Executa a cada 5 minutos
  cron.schedule("*/5 * * * *", async () => {
    try {
      await sendReminders();
    } catch (error) {
      console.error("Erro ao executar job de lembretes:", error);
    }
  });

  reminderJobScheduled = true;
  console.log("Jobs agendados inicializados com sucesso");
}

/**
 * Enviar lembretes para agendamentos que começam em 1 hora
 */
async function sendReminders() {
  try {
    const db = await getDb();
    if (!db) return;

    // Calcular o intervalo de tempo: próxima 1 hora
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // Buscar agendamentos que começam em aproximadamente 1 hora
    const upcomingAppointments = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.status, "confirmed"),
          gte(appointments.scheduledTime, fiveMinutesAgo),
          lte(appointments.scheduledTime, oneHourLater)
        )
      );

    // Enviar lembretes para cada agendamento
    for (const appointment of upcomingAppointments) {
      try {
        await sendReminderNotification(appointment.id, appointment.establishmentId);
      } catch (error) {
        console.error(`Erro ao enviar lembrete para agendamento ${appointment.id}:`, error);
      }
    }
  } catch (error) {
    console.error("Erro ao buscar agendamentos para lembretes:", error);
  }
}

/**
 * Parar todos os jobs
 */
export function stopAllJobs() {
  cron.getTasks().forEach((task) => {
    task.stop();
  });
  reminderJobScheduled = false;
  console.log("Todos os jobs foram parados");
}
