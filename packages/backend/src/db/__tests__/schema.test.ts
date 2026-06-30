import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';

const { Pool } = pg;

const TEST_DB_URL = process.env.DATABASE_URL;

describe.skipIf(!TEST_DB_URL)('Database schema', () => {
  let pool: pg.Pool;

  beforeAll(() => {
    pool = new Pool({ connectionString: TEST_DB_URL });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('has pgvector extension enabled', async () => {
    const result = await pool.query(
      "SELECT * FROM pg_extension WHERE extname = 'vector'",
    );
    expect(result.rows).toHaveLength(1);
  });

  const tables = [
    'users',
    'workspaces',
    'workspace_members',
    'repositories',
    'ai_configurations',
    'workflow_executions',
  ];

  for (const table of tables) {
    it(`table "${table}" exists`, async () => {
      const result = await pool.query(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = $1`,
        [table],
      );
      expect(result.rows).toHaveLength(1);
    });
  }
});
