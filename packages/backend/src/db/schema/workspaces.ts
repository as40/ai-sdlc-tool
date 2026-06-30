import { pgTable, varchar, uuid, timestamp } from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';
import { users } from './users';

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  name: varchar('name', { length: 255 }).notNull(),
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});
