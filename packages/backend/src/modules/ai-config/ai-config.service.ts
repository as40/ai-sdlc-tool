import { aiConfigRepository, type AIConfigRepository } from './ai-config.repository';
import { cryptoService } from '../../utils/crypto.service';
import { llmGateway } from '../../services/llm-gateway.service';
import type { AIConfigRecord } from './ai-config.types';
import type { TestConnectionResult } from '../../services/llm-gateway.service';
export { ServiceError } from './ai-config.errors';
import { ServiceError } from './ai-config.errors';

export class AIConfigService {
  constructor(private readonly repo: AIConfigRepository) {}

  async createConfig(
    workspaceId: string,
    data: {
      provider: string;
      modelName: string;
      apiKey?: string;
      baseUrl?: string;
      isLocal: boolean;
    },
  ): Promise<AIConfigRecord> {
    const apiKeyEncrypted = data.apiKey ? cryptoService.encrypt(data.apiKey) : undefined;
    return this.repo.create({
      workspaceId,
      provider: data.provider,
      modelName: data.modelName,
      apiKeyEncrypted,
      baseUrl: data.baseUrl,
      isLocal: data.isLocal,
    });
  }

  async listConfigs(workspaceId: string): Promise<AIConfigRecord[]> {
    return this.repo.findAllForWorkspace(workspaceId);
  }

  async updateConfig(
    id: string,
    workspaceId: string,
    data: {
      provider?: string;
      modelName?: string;
      apiKey?: string;
      baseUrl?: string;
      isLocal?: boolean;
    },
  ): Promise<AIConfigRecord> {
    const existing = await this.repo.findById(id, workspaceId);
    if (!existing) throw new ServiceError(404, 'Not Found', 'AI configuration not found.');

    const updatePayload: {
      provider?: string;
      modelName?: string;
      apiKeyEncrypted?: string;
      baseUrl?: string;
      isLocal?: boolean;
    } = {};

    if (data.provider !== undefined) updatePayload.provider = data.provider;
    if (data.modelName !== undefined) updatePayload.modelName = data.modelName;
    if (data.baseUrl !== undefined) updatePayload.baseUrl = data.baseUrl;
    if (data.isLocal !== undefined) updatePayload.isLocal = data.isLocal;
    if (data.apiKey !== undefined)
      updatePayload.apiKeyEncrypted = cryptoService.encrypt(data.apiKey);

    const updated = await this.repo.update(id, workspaceId, updatePayload);
    if (!updated) throw new ServiceError(404, 'Not Found', 'AI configuration not found.');
    return updated;
  }

  async deleteConfig(id: string, workspaceId: string): Promise<void> {
    const deleted = await this.repo.delete(id, workspaceId);
    if (!deleted) throw new ServiceError(404, 'Not Found', 'AI configuration not found.');
  }

  async testConnection(id: string, workspaceId: string): Promise<TestConnectionResult> {
    const found = await this.repo.findByIdWithKey(id, workspaceId);
    if (!found) throw new ServiceError(404, 'Not Found', 'AI configuration not found.');

    const { record, apiKeyEncrypted } = found;
    const apiKey = apiKeyEncrypted ? cryptoService.decrypt(apiKeyEncrypted) : undefined;

    return llmGateway.testConnection({
      provider: record.provider,
      modelName: record.modelName,
      apiKey,
      baseUrl: record.baseUrl ?? undefined,
      isLocal: record.isLocal,
    });
  }
}

export const aiConfigService = new AIConfigService(aiConfigRepository);
