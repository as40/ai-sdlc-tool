import 'dotenv/config';
import { db } from './index';
import { users, workspaces, workspaceMembers } from './schema/index';

async function seed() {
  console.info('Seeding database...');

  const [devUser] = await db
    .insert(users)
    .values({
      email: 'dev@ai-sdlc.local',
      displayName: 'Dev User',
      accessLevel: 'WORKSPACE_OWNER',
    })
    .returning();

  const [devWorkspace] = await db
    .insert(workspaces)
    .values({
      name: 'Dev Workspace',
      ownerId: devUser.id,
    })
    .returning();

  await db.insert(workspaceMembers).values({
    workspaceId: devWorkspace.id,
    userId: devUser.id,
    accessLevel: 'WORKSPACE_OWNER',
  });

  console.info('Seed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
