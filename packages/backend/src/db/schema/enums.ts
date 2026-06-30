import { pgEnum } from 'drizzle-orm/pg-core';

export const accessLevelEnum = pgEnum('access_level', [
  'SUPER_ADMIN',
  'WORKSPACE_OWNER',
  'DEVELOPER',
  'VIEWER',
]);

export const workflowStatusEnum = pgEnum('workflow_status', [
  'IDLE',
  'RUNNING',
  'AWAITING_APPROVAL',
  'REVISION_REQUESTED',
  'COMPLETED',
]);
