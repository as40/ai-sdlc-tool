import { Router } from 'express';
import {
  createAIConfigController,
  listAIConfigsController,
  updateAIConfigController,
  deleteAIConfigController,
  testConnectionController,
} from './ai-config.controller';

export function createAIConfigRouter(): Router {
  const router = Router({ mergeParams: true });

  router.post('/', createAIConfigController);
  router.get('/', listAIConfigsController);
  router.put('/:configId', updateAIConfigController);
  router.delete('/:configId', deleteAIConfigController);
  router.post('/:configId/test', testConnectionController);

  return router;
}
