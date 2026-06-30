import { pgTable, varchar, uuid, timestamp, boolean, text, jsonb } from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';
import { workspaces } from './workspaces';

export const repositories = pgTable('repositories', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'restrict' }),
  name: varchar('name', { length: 255 }).notNull(),
  remoteUrl: text('remote_url').notNull(),
  isPrimary: boolean('is_primary').notNull().default(false),
  localPath: text('local_path'),
  techStack: jsonb('tech_stack'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});
