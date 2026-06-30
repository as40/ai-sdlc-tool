import { pgTable, uuid, timestamp, unique } from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';
import { workspaces } from './workspaces';
import { users } from './users';
import { accessLevelEnum } from './enums';

export const workspaceMembers = pgTable(
  'workspace_members',
  {
    id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'restrict' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    accessLevel: accessLevelEnum('access_level').notNull().default('DEVELOPER'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('uniq_workspace_member').on(table.workspaceId, table.userId)],
);
