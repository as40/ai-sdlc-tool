import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@frontend': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      all: false,
      exclude: [
        'src/main.tsx',
        'src/test-setup.ts',
        'src/setupTests.ts',
        'src/components/ui/**',
        'src/**/*.d.ts',
        'vitest.config.ts',
        'node_modules/**',
        '**/__tests__/**',
        '**/*.test.{ts,tsx}',
      ],
      thresholds: {
        lines: 80,
      },
    },
  },
});
