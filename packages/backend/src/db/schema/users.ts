import { pgTable, varchar, uuid, timestamp } from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';
import { accessLevelEnum } from './enums';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  accessLevel: accessLevelEnum('access_level').notNull().default('DEVELOPER'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});
