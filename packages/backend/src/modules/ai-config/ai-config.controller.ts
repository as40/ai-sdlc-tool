import type { Request, Response } from 'express';
import { createAIConfigSchema, updateAIConfigSchema } from './ai-config.schemas';
import { aiConfigService } from './ai-config.service';
import { ServiceError } from './ai-config.errors';

function handleError(res: Response, err: unknown): void {
  if (err instanceof ServiceError) {
    res
      .status(err.statusCode)
      .json({ status: err.statusCode, title: err.title, detail: err.message });
    return;
  }
  res
    .status(500)
    .json({ status: 500, title: 'Internal Server Error', detail: 'An unexpected error occurred.' });
}

export async function createAIConfigController(req: Request, res: Response): Promise<void> {
  const parsed = createAIConfigSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ status: 400, title: 'Bad Request', detail: parsed.error.message });
    return;
  }
  try {
    const config = await aiConfigService.createConfig(req.workspaceId!, parsed.data);
    res.status(201).json(config);
  } catch (err) {
    handleError(res, err);
  }
}

export async function listAIConfigsController(req: Request, res: Response): Promise<void> {
  try {
    const configs = await aiConfigService.listConfigs(req.workspaceId!);
    res.status(200).json(configs);
  } catch (err) {
    handleError(res, err);
  }
}

export async function updateAIConfigController(req: Request, res: Response): Promise<void> {
  const parsed = updateAIConfigSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ status: 400, title: 'Bad Request', detail: parsed.error.message });
    return;
  }
  try {
    const config = await aiConfigService.updateConfig(
      req.params['configId'] as string,
      req.workspaceId!,
      parsed.data,
    );
    res.status(200).json(config);
  } catch (err) {
    handleError(res, err);
  }
}

export async function deleteAIConfigController(req: Request, res: Response): Promise<void> {
  try {
    await aiConfigService.deleteConfig(req.params['configId'] as string, req.workspaceId!);
    res.status(204).send();
  } catch (err) {
    handleError(res, err);
  }
}

export async function testConnectionController(req: Request, res: Response): Promise<void> {
  try {
    const result = await aiConfigService.testConnection(
      req.params['configId'] as string,
      req.workspaceId!,
    );
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
}
