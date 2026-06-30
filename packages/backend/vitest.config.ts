import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'src/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: [
        'src/index.ts',
        'src/config.ts',
        'src/db/seed.ts',
        'src/db/schema/**',
        'src/db/index.ts',
        'drizzle.config.ts',
        'vitest.config.ts',
        'node_modules/**',
        '**/__tests__/**',
        '**/*.test.ts',
      ],
      thresholds: {
        lines: 80,
      },
    },
  },
});
