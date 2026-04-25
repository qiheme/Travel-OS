import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: 'apps/web/vitest.setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100
      },
      include: ['apps/web/src/app/**/*.{ts,tsx}', 'apps/web/src/components/**/*.{ts,tsx}', 'apps/web/src/lib/**/*.ts', 'apps/web/api/**/*.ts'],
      exclude: [
        '**/*.test.{ts,tsx}',
        'apps/web/src/lib/types.ts',
        'apps/web/src/lib/data.ts',
        'apps/web/src/lib/utils.ts',
        'apps/web/src/lib/supabase.ts',
        'apps/web/src/app/AppContext.tsx',
      ]
    }
  }
});
