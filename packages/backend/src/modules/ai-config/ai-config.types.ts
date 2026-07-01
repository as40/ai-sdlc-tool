export interface AIConfigRecord {
  id: string;
  workspaceId: string;
  provider: string;
  modelName: string;
  baseUrl: string | null;
  isLocal: boolean;
  createdAt: Date;
  updatedAt: Date;
}
