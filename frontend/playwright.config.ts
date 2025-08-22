// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests', // ← ここ基準で testMatch する
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI, // 型エラー出るなら後述の対処へ
  },
  projects: [
    // まず .auth.json を作るセットアップだけ実行
    { name: 'setup', testMatch: 'setup/auth.setup.ts' }, // ← “tests/” は付けない

    // 本編（setup に依存）: setup/ 配下は除外
    {
      name: 'e2e',
      dependencies: ['setup'],
      testMatch: ['**/*.spec.ts', '**/*.e2e.ts', '!setup/**'], // ← グロブでOK
      use: { storageState: '.auth.json' },
    },
  ],
});
