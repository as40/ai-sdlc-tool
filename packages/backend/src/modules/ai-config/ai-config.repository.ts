import { eq, and } from 'drizzle-orm';
import { db } from '../../db';
import { aiConfigurations } from '../../db/schema';
import type { AIConfigRecord } from './ai-config.types';

type Row = typeof aiConfigurations.$inferSelect;

function toRecord(row: Row): AIConfigRecord {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    provider: row.provider,
    modelName: row.modelName,
    baseUrl: row.baseUrl,
    isLocal: row.isLocal,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class AIConfigRepository {
  async create(data: {
    workspaceId: string;
    provider: string;
    modelName: string;
    apiKeyEncrypted?: string;
    baseUrl?: string;
    isLocal: boolean;
  }): Promise<AIConfigRecord> {
    const [row] = await db.insert(aiConfigurations).values(data).returning();
    return toRecord(row);
  }

  async findAllForWorkspace(workspaceId: string): Promise<AIConfigRecord[]> {
    const rows = await db
      .select()
      .from(aiConfigurations)
      .where(eq(aiConfigurations.workspaceId, workspaceId));
    return rows.map(toRecord);
  }

  async findById(id: string, workspaceId: string): Promise<AIConfigRecord | null> {
    const [row] = await db
      .select()
      .from(aiConfigurations)
      .where(and(eq(aiConfigurations.id, id), eq(aiConfigurations.workspaceId, workspaceId)))
      .limit(1);
    return row ? toRecord(row) : null;
  }

  async findByIdWithKey(
    id: string,
    workspaceId: string,
  ): Promise<{ record: AIConfigRecord; apiKeyEncrypted: string | null } | null> {
    const [row] = await db
      .select()
      .from(aiConfigurations)
      .where(and(eq(aiConfigurations.id, id), eq(aiConfigurations.workspaceId, workspaceId)))
      .limit(1);
    if (!row) return null;
    return { record: toRecord(row), apiKeyEncrypted: row.apiKeyEncrypted };
  }

  async update(
    id: string,
    workspaceId: string,
    data: {
      provider?: string;
      modelName?: string;
      apiKeyEncrypted?: string;
      baseUrl?: string | null;
      isLocal?: boolean;
    },
  ): Promise<AIConfigRecord | null> {
    const [row] = await db
      .update(aiConfigurations)
      .set(data)
      .where(and(eq(aiConfigurations.id, id), eq(aiConfigurations.workspaceId, workspaceId)))
      .returning();
    return row ? toRecord(row) : null;
  }

  async delete(id: string, workspaceId: string): Promise<boolean> {
    const rows = await db
      .delete(aiConfigurations)
      .where(and(eq(aiConfigurations.id, id), eq(aiConfigurations.workspaceId, workspaceId)))
      .returning({ id: aiConfigurations.id });
    return rows.length > 0;
  }
}

export const aiConfigRepository = new AIConfigRepository();
