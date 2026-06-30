import { pgTable, uuid, timestamp, varchar } from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';
import { workspaces } from './workspaces';
import { workflowStatusEnum } from './enums';

export const workflowExecutions = pgTable('workflow_executions', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'restrict' }),
  sessionId: uuid('session_id'),
  status: workflowStatusEnum('status').notNull().default('IDLE'),
  jiraStoryId: varchar('jira_story_id', { length: 100 }),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});
