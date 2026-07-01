export interface TestConnectionResult {
  success: boolean;
  latencyMs: number;
  error?: string;
}

export interface ConnectionOptions {
  provider: string;
  modelName: string;
  apiKey?: string;
  baseUrl?: string;
  isLocal: boolean;
}

export class LLMGateway {
  async testConnection(options: ConnectionOptions): Promise<TestConnectionResult> {
    const start = Date.now();
    // Phase 5 will implement real per-provider health checks
    void options;
    return { success: true, latencyMs: Date.now() - start };
  }
}

export const llmGateway = new LLMGateway();
