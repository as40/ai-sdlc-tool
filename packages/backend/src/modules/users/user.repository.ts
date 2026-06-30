import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { users } from '../../db/schema';
import type { SsoProfile, UserRecord } from './user.types';

export class UserRepository {
  async findByEmail(email: string): Promise<UserRecord | null> {
    const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return row ?? null;
  }

  async upsert(profile: SsoProfile): Promise<{ user: UserRecord; isNew: boolean }> {
    return db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(users)
        .where(eq(users.email, profile.email))
        .limit(1);

      if (existing) {
        // Soft-deleted users are returned as-is; the caller enforces the 403.
        if (existing.deletedAt !== null) {
          return { user: existing as UserRecord, isNew: false };
        }

        if (existing.displayName !== profile.displayName) {
          const [updated] = await tx
            .update(users)
            .set({ displayName: profile.displayName })
            .where(eq(users.id, existing.id))
            .returning();
          return { user: updated as UserRecord, isNew: false };
        }

        return { user: existing as UserRecord, isNew: false };
      }

      const [created] = await tx
        .insert(users)
        .values({
          email: profile.email,
          displayName: profile.displayName,
          accessLevel: 'DEVELOPER',
        })
        .returning();

      return { user: created as UserRecord, isNew: true };
    });
  }
}

export const userRepository = new UserRepository();
