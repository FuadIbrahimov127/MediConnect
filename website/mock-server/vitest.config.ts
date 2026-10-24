import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    env: { MOCK_PERSIST: 'false', MOCK_LATENCY_MS: '0', MOCK_JOBS: 'false', MOCK_DEV_TOOLS: 'true', MOCK_SESSION_TIMEOUT: 'true' },
    setupFiles: ['test/setup.ts'],
  },
});
