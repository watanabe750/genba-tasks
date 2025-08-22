// tests/helpers.ts
import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

// 既存の ensureOnApp を置き換え
async function ensureOnApp(page: Page) {
  const url = page.url();
  // baseURL 未適用や /tasks 以外に居る場合は /tasks へ
  if (!/^https?:\/\//.test(url) || !/\/tasks(\b|\/|$)/.test(url)) {
    await page.goto("/tasks");
  }
}

// 入力全消し（⌘/Ctrl + A → Delete）
export async function clearInput(input: Locator) {
  await input.click();
  const mod = process.platform === "darwin" ? "Meta" : "Control";
  await input.press(`${mod}+A`);
  await input.press("Delete");
}

/**
 * Devise Token Auth のトークンを localStorage から読み取り、
 * ブラウザ側(fetch)で /api/tasks を叩く。
 * レスポンスヘッダに新トークンが来たら localStorage を更新（トークン回転対応）。
 * 作成後は /tasks をリロードして、DOM に新タスクが出現するまで待つ。
 */
export async function createTaskViaApi(
  page: Page,
  overrides: Record<string, any> = {}
) {
  await ensureOnApp(page);

  const isParent = overrides.parent_id == null;
  const payload = {
    title: `Seed-${Date.now()}`,
    deadline: null,
    parent_id: null,
    status: "in_progress", // backend の必須を満たす
    progress: 0,
    ...(isParent ? { site: "E2E" } : {}),
    ...overrides,
  };

  const result = await page.evaluate(async (payload) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    const at = localStorage.getItem("access-token");
    const client = localStorage.getItem("client");
    const uid = localStorage.getItem("uid");
    if (at && client && uid) {
      headers["access-token"] = at;
      headers["client"] = client;
      headers["uid"] = uid;
    } else {
      return {
        ok: false,
        status: 0,
        data: { errors: ["DTA tokens missing in localStorage"] },
      };
    }

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers,
      body: JSON.stringify({ task: payload }),
      credentials: "same-origin",
    });

    // トークン回転：新しいヘッダが来ていたら更新
    const newAt = res.headers.get("access-token");
    const newClient = res.headers.get("client");
    const newUid = res.headers.get("uid");
    if (newAt && newClient && newUid) {
      localStorage.setItem("access-token", newAt);
      localStorage.setItem("client", newClient);
      localStorage.setItem("uid", newUid);
      window.dispatchEvent(new Event("auth:refresh"));
    }

    let data: any = null;
    try {
      data = await res.json();
    } catch {}
    return { ok: res.ok, status: res.status, data };
  }, payload);

  expect(
    result.ok,
    `createTaskViaApi ${result.status} ${JSON.stringify(result.data)}`
  ).toBeTruthy();

  const createdId = result.data?.id;
  if (createdId) {
    // 必ず /tasks へ寄せる（reload より安全）
    await page.goto("/tasks");

    // /api/tasks の成功を待つ（React Query が新規データを取ってくるまで待機）
    try {
      await page.waitForResponse(
        (r) => r.url().includes("/api/tasks") && r.status() === 200,
        { timeout: 10_000 }
      );
    } catch { /* ignore: キャッシュでリクエストが出ない可能性あり */ }

    // ネットワーク静穏も待つと安定（描画完了待ち）
    await page.waitForLoadState("networkidle");

    // レンダが遅れるケースに備えて軽いポーリング
    const target = page
      .locator(`[data-testid="task-item-${createdId}"]`)
      .first();
    for (let i = 0; i < 10; i++) {
      if (await target.isVisible()) break;
      await page.waitForTimeout(300);
    }

    // 最終的に可視になるまで待つ
    await page.waitForSelector(`[data-testid="task-item-${createdId}"]`, {
      state: "visible",
      timeout: 10_000,
    });
  }

  return result.data; // { id, ... }
}