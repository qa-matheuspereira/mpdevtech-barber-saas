import { relations } from "drizzle-orm";
import {
  users,
  establishments,
  barbers,
  services,
  barberServices,
  clients,
  appointments,
  queues,
  breaks,
  timeBlocks,
  whatsappInstances,
  googleCalendarIntegrations,
  appointmentHistory,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  establishments: many(establishments),
}));

export const establishmentsRelations = relations(establishments, ({ one, many }) => ({
  owner: one(users, { fields: [establishments.ownerId], references: [users.id] }),
  barbers: many(barbers),
  services: many(services),
  clients: many(clients),
  appointments: many(appointments),
  breaks: many(breaks),
  timeBlocks: many(timeBlocks),
}));

export const barbersRelations = relations(barbers, ({ one, many }) => ({
  establishment: one(establishments, { fields: [barbers.establishmentId], references: [establishments.id] }),
  barberServices: many(barberServices),
  appointments: many(appointments),
  breaks: many(breaks),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  establishment: one(establishments, { fields: [services.establishmentId], references: [establishments.id] }),
  barberServices: many(barberServices),
  appointments: many(appointments),
}));

export const barberServicesRelations = relations(barberServices, ({ one }) => ({
  barber: one(barbers, { fields: [barberServices.barberId], references: [barbers.id] }),
  service: one(services, { fields: [barberServices.serviceId], references: [services.id] }),
  establishment: one(establishments, { fields: [barberServices.establishmentId], references: [establishments.id] }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  establishment: one(establishments, { fields: [clients.establishmentId], references: [establishments.id] }),
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  establishment: one(establishments, { fields: [appointments.establishmentId], references: [establishments.id] }),
  client: one(clients, { fields: [appointments.clientId], references: [clients.id] }),
  barber: one(barbers, { fields: [appointments.barberId], references: [barbers.id] }),
  service: one(services, { fields: [appointments.serviceId], references: [services.id] }),
}));

export const queuesRelations = relations(queues, ({ one }) => ({
  appointment: one(appointments, { fields: [queues.appointmentId], references: [appointments.id] }),
}));

export const breaksRelations = relations(breaks, ({ one }) => ({
  establishment: one(establishments, { fields: [breaks.establishmentId], references: [establishments.id] }),
  barber: one(barbers, { fields: [breaks.barberId], references: [barbers.id] }),
}));

export const timeBlocksRelations = relations(timeBlocks, ({ one }) => ({
  establishment: one(establishments, { fields: [timeBlocks.establishmentId], references: [establishments.id] }),
  barber: one(barbers, { fields: [timeBlocks.barberId], references: [barbers.id] }),
}));

export const appointmentHistoryRelations = relations(appointmentHistory, ({ one }) => ({
  establishment: one(establishments, { fields: [appointmentHistory.establishmentId], references: [establishments.id] }),
  client: one(clients, { fields: [appointmentHistory.clientId], references: [clients.id] }),
  barber: one(barbers, { fields: [appointmentHistory.barberId], references: [barbers.id] }),
  service: one(services, { fields: [appointmentHistory.serviceId], references: [services.id] }),
}));

export const googleCalendarIntegrationsRelations = relations(googleCalendarIntegrations, ({ one }) => ({
  establishment: one(establishments, { fields: [googleCalendarIntegrations.establishmentId], references: [establishments.id] }),
  user: one(users, { fields: [googleCalendarIntegrations.userId], references: [users.id] }),
}));
