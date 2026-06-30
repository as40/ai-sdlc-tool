import { z } from 'zod';

export const MockLoginSchema = z.object({
  role: z.enum(['SUPER_ADMIN', 'WORKSPACE_OWNER', 'DEVELOPER', 'VIEWER']),
  email: z.string().email().optional(),
});

export type MockLoginInput = z.infer<typeof MockLoginSchema>;
