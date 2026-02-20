import { integer, pgEnum, pgTable, text, timestamp, varchar, boolean, numeric, jsonb, index, serial } from "drizzle-orm/pg-core";

/**
 * PostgreSQL Enums (defined separately in pg-core)
 */
export const roleEnum = pgEnum("role", ["user", "admin", "super_admin"]);
export const operatingModeEnum = pgEnum("operatingMode", ["queue", "scheduled", "both"]);
export const appointmentTypeEnum = pgEnum("appointmentType", ["scheduled", "queue"]);
export const appointmentStatusEnum = pgEnum("appointmentStatus", ["pending", "confirmed", "in_progress", "completed", "cancelled", "no_show"]);
export const blockTypeEnum = pgEnum("blockType", ["maintenance", "absence", "closed", "custom"]);
export const googleCalEventTypeEnum = pgEnum("googleCalEventType", ["appointment", "break", "timeBlock"]);
export const syncTypeEnum = pgEnum("syncType", ["appointment", "break", "timeBlock", "full"]);
export const syncStatusEnum = pgEnum("syncStatus", ["pending", "success", "error", "partial"]);
export const whatsappSessionStatusEnum = pgEnum("whatsappSessionStatus", ["pending", "connected", "disconnected", "error"]);
export const messageTypeEnum = pgEnum("messageType", ["text", "image", "audio", "video", "document", "location"]);
export const messageDirectionEnum = pgEnum("messageDirection", ["inbound", "outbound"]);
export const messageStatusEnum = pgEnum("messageStatus", ["pending", "sent", "delivered", "read", "failed"]);
export const sentimentEnum = pgEnum("sentiment", ["positive", "neutral", "negative"]);
export const webhookStatusEnum = pgEnum("webhookStatus", ["success", "failed", "pending"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  maxEstablishments: integer("maxEstablishments").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Establishments - Multi-tenant
export const establishments = pgTable("establishments", {
  id: serial("id").primaryKey(),
  ownerId: integer("ownerId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 20 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zipCode", { length: 10 }),
  description: text("description"),
  operatingMode: operatingModeEnum("operatingMode").default("both").notNull(),
  openTime: varchar("openTime", { length: 5 }), // HH:mm
  closeTime: varchar("closeTime", { length: 5 }), // HH:mm
  closedDays: jsonb("closedDays").$type<number[]>(),
  features: jsonb("features").$type<string[]>(), // Array of enabled feature slugs
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  ownerIdIdx: index("ownerIdIdx").on(table.ownerId),
}));

export type Establishment = typeof establishments.$inferSelect;
export type InsertEstablishment = typeof establishments.$inferInsert;

// Barbeiros/Profissionais dentro do estabelecimento
export const barbers = pgTable("barbers", {
  id: serial("id").primaryKey(),
  establishmentId: integer("establishmentId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  establishmentIdIdx: index("barbersEstablishmentIdIdx").on(table.establishmentId),
}));

export type Barber = typeof barbers.$inferSelect;
export type InsertBarber = typeof barbers.$inferInsert;

// Serviços oferecidos
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  establishmentId: integer("establishmentId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  durationMinutes: integer("durationMinutes").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  establishmentIdIdx: index("servicesEstablishmentIdIdx").on(table.establishmentId),
}));

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

// Clientes
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  establishmentId: integer("establishmentId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 20 }),
  email: varchar("email", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  establishmentIdIdx: index("clientsEstablishmentIdIdx").on(table.establishmentId),
  phoneIdx: index("clientsPhoneIdx").on(table.phone),
}));

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

// Agendamentos
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  establishmentId: integer("establishmentId").notNull(),
  clientId: integer("clientId").notNull(),
  barberId: integer("barberId"),
  serviceId: integer("serviceId").notNull(),
  appointmentType: appointmentTypeEnum("appointmentType").notNull(),
  scheduledTime: timestamp("scheduledTime"),
  queuePosition: integer("queuePosition"),
  status: appointmentStatusEnum("status").default("pending").notNull(),
  notes: text("notes"),
  reminderSentAt: timestamp("reminderSentAt"),
  confirmationSentAt: timestamp("confirmationSentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  establishmentIdIdx: index("appointmentsEstablishmentIdIdx").on(table.establishmentId),
  clientIdIdx: index("appointmentsClientIdIdx").on(table.clientId),
  statusIdx: index("appointmentsStatusIdx").on(table.status),
  scheduledTimeIdx: index("appointmentsScheduledTimeIdx").on(table.scheduledTime),
}));

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

// Fila virtual
export const queues = pgTable("queues", {
  id: serial("id").primaryKey(),
  establishmentId: integer("establishmentId").notNull(),
  appointmentId: integer("appointmentId").notNull(),
  position: integer("position").notNull(),
  enteredAt: timestamp("enteredAt").defaultNow().notNull(),
  calledAt: timestamp("calledAt"),
  completedAt: timestamp("completedAt"),
}, (table) => ({
  establishmentIdIdx: index("queuesEstablishmentIdIdx").on(table.establishmentId),
  appointmentIdIdx: index("queuesAppointmentIdIdx").on(table.appointmentId),
}));

export type Queue = typeof queues.$inferSelect;
export type InsertQueue = typeof queues.$inferInsert;

// Instâncias WhatsApp (credenciais Z-API)
export const whatsappInstances = pgTable("whatsappInstances", {
  id: serial("id").primaryKey(),
  establishmentId: integer("establishmentId").notNull().unique(),
  apiKey: varchar("apiKey", { length: 255 }).notNull(), // Evolution API Global Key
  apiUrl: varchar("apiUrl", { length: 255 }), // Evolution API Base URL
  webhookSecret: varchar("webhookSecret", { length: 255 }),
  aiConfig: jsonb("aiConfig"), // { enabled: boolean, prompt: string, model: string }
  instanceName: varchar("instanceName", { length: 255 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  establishmentIdIdx: index("whatsappInstancesEstablishmentIdIdx").on(table.establishmentId),
}));

export type WhatsappInstance = typeof whatsappInstances.$inferSelect;
export type InsertWhatsappInstance = typeof whatsappInstances.$inferInsert;

// Histórico de atendimentos
export const appointmentHistory = pgTable("appointmentHistory", {
  id: serial("id").primaryKey(),
  establishmentId: integer("establishmentId").notNull(),
  appointmentId: integer("appointmentId").notNull(),
  clientId: integer("clientId").notNull(),
  serviceId: integer("serviceId").notNull(),
  barberId: integer("barberId"),
  completedAt: timestamp("completedAt").notNull(),
  durationMinutes: integer("durationMinutes"),
  price: numeric("price", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  establishmentIdIdx: index("appointmentHistoryEstablishmentIdIdx").on(table.establishmentId),
  completedAtIdx: index("appointmentHistoryCompletedAtIdx").on(table.completedAt),
}));

export type AppointmentHistory = typeof appointmentHistory.$inferSelect;
export type InsertAppointmentHistory = typeof appointmentHistory.$inferInsert;

// Pausas e Intervalos do Barbeiro
export const breaks = pgTable("breaks", {
  id: serial("id").primaryKey(),
  establishmentId: integer("establishmentId").notNull(),
  barberId: integer("barberId"),
  name: varchar("name", { length: 255 }).notNull(),
  startTime: varchar("startTime", { length: 5 }).notNull(),
  endTime: varchar("endTime", { length: 5 }).notNull(),
  daysOfWeek: jsonb("daysOfWeek").$type<number[]>(),
  isRecurring: boolean("isRecurring").default(true).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  establishmentIdIdx: index("breaksEstablishmentIdIdx").on(table.establishmentId),
  barberIdIdx: index("breaksBarberIdIdx").on(table.barberId),
}));

export type Break = typeof breaks.$inferSelect;
export type InsertBreak = typeof breaks.$inferInsert;

// Bloqueios de Tempo (para ausencias, manutencao, etc.)
export const timeBlocks = pgTable("timeBlocks", {
  id: serial("id").primaryKey(),
  establishmentId: integer("establishmentId").notNull(),
  barberId: integer("barberId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  blockType: blockTypeEnum("blockType").notNull(),
  isRecurring: boolean("isRecurring").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  establishmentIdIdx: index("timeBlocksEstablishmentIdIdx").on(table.establishmentId),
  barberIdIdx: index("timeBlocksBarberIdIdx").on(table.barberId),
  startTimeIdx: index("timeBlocksStartTimeIdx").on(table.startTime),
}));

export type TimeBlock = typeof timeBlocks.$inferSelect;
export type InsertTimeBlock = typeof timeBlocks.$inferInsert;

// Integração com Google Calendar
export const googleCalendarIntegrations = pgTable("googleCalendarIntegrations", {
  id: serial("id").primaryKey(),
  establishmentId: integer("establishmentId").notNull().unique(),
  userId: integer("userId").notNull(),
  googleCalendarId: varchar("googleCalendarId", { length: 255 }).notNull(),
  accessToken: text("accessToken").notNull(),
  refreshToken: text("refreshToken"),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  isActive: boolean("isActive").default(true).notNull(),
  syncAppointments: boolean("syncAppointments").default(true).notNull(),
  syncBreaks: boolean("syncBreaks").default(true).notNull(),
  lastSyncAt: timestamp("lastSyncAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  establishmentIdIdx: index("googleCalIntegrationEstablishmentIdIdx").on(table.establishmentId),
  userIdIdx: index("googleCalIntegrationUserIdIdx").on(table.userId),
}));

export type GoogleCalendarIntegration = typeof googleCalendarIntegrations.$inferSelect;
export type InsertGoogleCalendarIntegration = typeof googleCalendarIntegrations.$inferInsert;

// Mapeamento de eventos do Google Calendar para agendamentos locais
export const googleCalendarEvents = pgTable("googleCalendarEvents", {
  id: serial("id").primaryKey(),
  establishmentId: integer("establishmentId").notNull(),
  googleEventId: varchar("googleEventId", { length: 255 }).notNull(),
  localEventId: integer("localEventId"), // ID do agendamento ou pausa local
  eventType: googleCalEventTypeEnum("eventType").notNull(),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  establishmentIdIdx: index("googleCalEventsEstablishmentIdIdx").on(table.establishmentId),
  googleEventIdIdx: index("googleCalEventsGoogleEventIdIdx").on(table.googleEventId),
  localEventIdIdx: index("googleCalEventsLocalEventIdIdx").on(table.localEventId),
}));

export type GoogleCalendarEvent = typeof googleCalendarEvents.$inferSelect;
export type InsertGoogleCalendarEvent = typeof googleCalendarEvents.$inferInsert;

// Logs de sincronização com Google Calendar
export const googleCalendarSyncLogs = pgTable("googleCalendarSyncLogs", {
  id: serial("id").primaryKey(),
  establishmentId: integer("establishmentId").notNull(),
  syncType: syncTypeEnum("syncType").notNull(),
  status: syncStatusEnum("status").default("pending").notNull(),
  totalEvents: integer("totalEvents").default(0).notNull(),
  successCount: integer("successCount").default(0).notNull(),
  errorCount: integer("errorCount").default(0).notNull(),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  duration: integer("duration"), // em milissegundos
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  establishmentIdIdx: index("googleCalSyncLogsEstablishmentIdIdx").on(table.establishmentId),
  statusIdx: index("googleCalSyncLogsStatusIdx").on(table.status),
  createdAtIdx: index("googleCalSyncLogsCreatedAtIdx").on(table.createdAt),
}));

export type GoogleCalendarSyncLog = typeof googleCalendarSyncLogs.$inferSelect;
export type InsertGoogleCalendarSyncLog = typeof googleCalendarSyncLogs.$inferInsert;

// Sessões WhatsApp para autenticação e envio de mensagens
export const whatsappSessions = pgTable("whatsappSessions", {
  id: serial("id").primaryKey(),
  establishmentId: integer("establishmentId").notNull(),
  sessionName: varchar("sessionName", { length: 255 }).notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }),
  qrCode: text("qrCode"), // QR Code em base64
  status: whatsappSessionStatusEnum("status").default("pending").notNull(),
  isActive: boolean("isActive").default(false).notNull(),
  errorMessage: text("errorMessage"),
  connectedAt: timestamp("connectedAt"),
  disconnectedAt: timestamp("disconnectedAt"),
  lastActivityAt: timestamp("lastActivityAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  establishmentIdIdx: index("whatsappSessionsEstablishmentIdIdx").on(table.establishmentId),
  statusIdx: index("whatsappSessionsStatusIdx").on(table.status),
  isActiveIdx: index("whatsappSessionsIsActiveIdx").on(table.isActive),
}));

export type WhatsappSession = typeof whatsappSessions.$inferSelect;
export type InsertWhatsappSession = typeof whatsappSessions.$inferInsert;

// Mensagens WhatsApp recebidas e enviadas
export const whatsappMessages = pgTable("whatsappMessages", {
  id: serial("id").primaryKey(),
  sessionId: integer("sessionId").notNull(),
  establishmentId: integer("establishmentId").notNull(),
  clientPhone: varchar("clientPhone", { length: 20 }).notNull(),
  clientName: varchar("clientName", { length: 255 }),
  messageText: text("messageText").notNull(),
  messageType: messageTypeEnum("messageType").default("text").notNull(),
  direction: messageDirectionEnum("direction").notNull(),
  externalMessageId: varchar("externalMessageId", { length: 255 }),
  status: messageStatusEnum("status").default("pending").notNull(),
  appointmentId: integer("appointmentId"),
  autoReply: boolean("autoReply").default(false).notNull(),
  sentiment: sentimentEnum("sentiment").default("neutral"),
  category: varchar("category", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  sessionIdIdx: index("whatsappMessagesSessionIdIdx").on(table.sessionId),
  establishmentIdIdx: index("whatsappMessagesEstablishmentIdIdx").on(table.establishmentId),
  clientPhoneIdx: index("whatsappMessagesClientPhoneIdx").on(table.clientPhone),
  directionIdx: index("whatsappMessagesDirectionIdx").on(table.direction),
  appointmentIdIdx: index("whatsappMessagesAppointmentIdIdx").on(table.appointmentId),
  createdAtIdx: index("whatsappMessagesCreatedAtIdx").on(table.createdAt),
}));

export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
export type InsertWhatsappMessage = typeof whatsappMessages.$inferInsert;

// Modelos de respostas automáticas
export const whatsappAutoResponses = pgTable("whatsappAutoResponses", {
  id: serial("id").primaryKey(),
  establishmentId: integer("establishmentId").notNull(),
  trigger: varchar("trigger", { length: 255 }).notNull(),
  response: text("response").notNull(),
  category: varchar("category", { length: 100 }),
  isActive: boolean("isActive").default(true).notNull(),
  priority: integer("priority").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  establishmentIdIdx: index("whatsappAutoResponsesEstablishmentIdIdx").on(table.establishmentId),
  triggerIdx: index("whatsappAutoResponsesTriggerIdx").on(table.trigger),
  isActiveIdx: index("whatsappAutoResponsesIsActiveIdx").on(table.isActive),
}));

export type WhatsappAutoResponse = typeof whatsappAutoResponses.$inferSelect;
export type InsertWhatsappAutoResponse = typeof whatsappAutoResponses.$inferInsert;

// Webhook logs para auditoria
export const webhookLogs = pgTable("webhookLogs", {
  id: serial("id").primaryKey(),
  establishmentId: integer("establishmentId").notNull(),
  eventType: varchar("eventType", { length: 100 }).notNull(),
  payload: jsonb("payload"),
  status: webhookStatusEnum("status").default("pending").notNull(),
  errorMessage: text("errorMessage"),
  retryCount: integer("retryCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  establishmentIdIdx: index("webhookLogsEstablishmentIdIdx").on(table.establishmentId),
  eventTypeIdx: index("webhookLogsEventTypeIdx").on(table.eventType),
  statusIdx: index("webhookLogsStatusIdx").on(table.status),
  createdAtIdx: index("webhookLogsCreatedAtIdx").on(table.createdAt),
}));

export type WebhookLog = typeof webhookLogs.$inferSelect;
export type InsertWebhookLog = typeof webhookLogs.$inferInsert;
