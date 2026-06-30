import { z } from 'zod';

export const IncomingMessageSchema = z.object({
  type: z.string().min(1),
  payload: z.unknown().optional(),
});

export type IncomingMessage = z.infer<typeof IncomingMessageSchema>;
