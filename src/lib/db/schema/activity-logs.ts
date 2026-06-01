import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  userName: text('user_name').notNull(),
  userRole: text('user_role').notNull(),
  action: text('action').notNull(), // 'login', 'create', 'update', 'delete', 'search', 'export'
  entityType: text('entity_type').notNull(), // 'shipment', 'user', 'report', 'auth'
  entityId: text('entity_id'), // ID of the affected entity (optional)
  details: text('details'), // JSON string with additional details
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
