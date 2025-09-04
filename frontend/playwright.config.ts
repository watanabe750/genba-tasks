// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  workers: 1,
  testDir: "tests",
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    // 1) ストレージ作成用（この1ファイルだけ実行）
    {
      name: "setup",
      testMatch: /tests\/\.auth\/setup\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
      workers: 1,
    },

    // 2) 認証前提のテスト群（ほぼ全部がこちら）
    {
      name: "chromium-auth",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/.auth/storage.json",
      },
      dependencies: ["setup"],
      // auth の挙動を検証する spec は除外
      testIgnore: [
        /tests\/\.auth\/setup\.spec\.ts/,
        /tests\/auth\.spec\.ts/,
      ],
    },

    // 3) 未ログイン挙動（/login リダイレクト等）だけこちら
    {
      name: "chromium-unauth",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
      testMatch: [/tests\/auth\.spec\.ts/],
    },
  ],
});
