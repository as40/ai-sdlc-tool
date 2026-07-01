import { z } from 'zod';

export const PROVIDERS = ['Anthropic', 'OpenAI', 'Azure OpenAI', 'Custom/Local'] as const;
export type Provider = (typeof PROVIDERS)[number];

export const createAIConfigSchema = z
  .object({
    provider: z.enum(PROVIDERS),
    modelName: z.string().min(1).max(255).trim(),
    apiKey: z.string().min(1).optional(),
    baseUrl: z.string().optional(),
    isLocal: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.isLocal && !data.apiKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'apiKey is required for cloud providers (isLocal=false)',
        path: ['apiKey'],
      });
    }
  });

export const updateAIConfigSchema = z
  .object({
    provider: z.enum(PROVIDERS).optional(),
    modelName: z.string().min(1).max(255).trim().optional(),
    apiKey: z.string().min(1).optional(),
    baseUrl: z.string().optional(),
    isLocal: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isLocal === false && !data.apiKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'apiKey is required when setting isLocal to false',
        path: ['apiKey'],
      });
    }
  });

export type CreateAIConfigInput = z.infer<typeof createAIConfigSchema>;
export type UpdateAIConfigInput = z.infer<typeof updateAIConfigSchema>;
