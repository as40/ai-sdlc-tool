import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(255).trim(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['DEVELOPER', 'VIEWER']),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
