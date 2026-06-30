import { pgTable, varchar, uuid, timestamp, boolean, text } from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';
import { workspaces } from './workspaces';

export const aiConfigurations = pgTable('ai_configurations', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'restrict' }),
  provider: varchar('provider', { length: 100 }).notNull(),
  modelName: varchar('model_name', { length: 255 }).notNull(),
  apiKeyEncrypted: text('api_key_encrypted'),
  baseUrl: text('base_url'),
  isLocal: boolean('is_local').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});
