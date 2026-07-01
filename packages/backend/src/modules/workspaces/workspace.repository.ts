import { eq, and } from 'drizzle-orm';
import { db } from '../../db';
import { workspaces, workspaceMembers, users } from '../../db/schema';
import type { WorkspaceRecord, WorkspaceMemberRecord } from './workspace.types';

export class WorkspaceRepository {
  async createWithOwner(
    name: string,
    ownerId: string,
  ): Promise<{ workspace: WorkspaceRecord; member: WorkspaceMemberRecord }> {
    return db.transaction(async (tx) => {
      const [workspace] = await tx.insert(workspaces).values({ name, ownerId }).returning();
      const [member] = await tx
        .insert(workspaceMembers)
        .values({ workspaceId: workspace.id, userId: ownerId, accessLevel: 'WORKSPACE_OWNER' })
        .returning();
      return { workspace: workspace as WorkspaceRecord, member: member as WorkspaceMemberRecord };
    });
  }

  async findById(id: string): Promise<WorkspaceRecord | null> {
    const [row] = await db.select().from(workspaces).where(eq(workspaces.id, id)).limit(1);
    return (row as WorkspaceRecord) ?? null;
  }

  async findAllForUser(userId: string): Promise<WorkspaceRecord[]> {
    const rows = await db
      .select({ workspace: workspaces })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(eq(workspaceMembers.userId, userId));
    return rows.map((r) => r.workspace as WorkspaceRecord);
  }

  async findMember(workspaceId: string, userId: string): Promise<WorkspaceMemberRecord | null> {
    const [row] = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)),
      )
      .limit(1);
    return (row as WorkspaceMemberRecord) ?? null;
  }

  async findAllMembers(workspaceId: string): Promise<WorkspaceMemberRecord[]> {
    const rows = await db
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, workspaceId));
    return rows as WorkspaceMemberRecord[];
  }

  async addMember(
    workspaceId: string,
    userId: string,
    accessLevel: 'DEVELOPER' | 'VIEWER',
  ): Promise<WorkspaceMemberRecord> {
    const [member] = await db
      .insert(workspaceMembers)
      .values({ workspaceId, userId, accessLevel })
      .returning();
    return member as WorkspaceMemberRecord;
  }

  async removeMember(workspaceId: string, userId: string): Promise<void> {
    await db
      .delete(workspaceMembers)
      .where(
        and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)),
      );
  }

  async findUserByEmail(email: string): Promise<{ id: string } | null> {
    const [row] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return row ?? null;
  }
}

export const workspaceRepository = new WorkspaceRepository();
