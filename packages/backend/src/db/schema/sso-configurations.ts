import { pgEnum, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';
import { workspaces } from './workspaces';

export const ssoProviderEnum = pgEnum('sso_provider', ['oidc', 'saml']);

export const ssoConfigurations = pgTable(
  'sso_configurations',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    provider: ssoProviderEnum('provider').notNull(),
    configEncrypted: text('config_encrypted').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [unique('uniq_sso_workspace_provider').on(table.workspaceId, table.provider)],
);
