export const REQ_TIME_HEADER = "x-auth-start";
const API_ORIGIN = process.env.PW_API_ORIGIN || process.env.VITE_API_ORIGIN || "http://localhost:3000";
export const apiUrl = (path) => (path.startsWith("http") ? path : new URL(path, API_ORIGIN).toString());
export async function clearInput(input) {
    const mod = process.platform === "darwin" ? "Meta" : "Control";
    await input.press(`${mod}+A`);
    await input.press("Delete");
}
// 401 を見たらだけ強制再ログイン
export async function waitForTasksOk(page, timeout = 15_000) {
    if (page.isClosed())
        return;
    const until = Date.now() + timeout;
    while (Date.now() < until && !page.isClosed()) {
        const remain = Math.max(1, until - Date.now());
        let resp;
        try {
            resp = await page.waitForResponse(r => r.url().includes("/api/tasks") && r.request().method() === "GET", { timeout: remain });
        }
        catch {
            break;
        }
        if (resp.status() === 200)
            return;
        if (resp.status() === 401) {
            await ensureAuthTokens(page, { force: true });
            if (page.isClosed())
                return;
            await page.evaluate(() => window.dispatchEvent(new Event("auth:refresh"))).catch(() => { });
            continue;
        }
    }
}
/** 事前ログイン → /tasks を開き、auth:refresh → GET200待ち */
export async function openTasks(page) {
    if (page.isClosed())
        return;
    // about:blank で localStorage セキュリティエラーを食らわないよう origin 確立
    if (!/^https?:\/\//.test(page.url())) {
        await page.goto("/", { waitUntil: "domcontentloaded" }).catch(() => { });
    }
    // ★ 先にトークン確保（初回の GET /api/tasks を 200 で始める）
    await ensureAuthTokens(page).catch(() => { });
    if (!/\/tasks(\?.*)?$/.test(page.url())) {
        await page.goto("/tasks", { waitUntil: "domcontentloaded" });
    }
    else {
        await page.waitForLoadState("domcontentloaded");
    }
    await page.evaluate(() => window.dispatchEvent(new Event("auth:refresh"))).catch(() => { });
    await waitForTasksOk(page);
}
export async function refreshTasks(page) {
    if (page.isClosed())
        return;
    await page.evaluate(() => window.dispatchEvent(new Event("auth:refresh"))).catch(() => { });
    await waitForTasksOk(page);
}
/** localStorage → ヘッダ（Authorization も付与） */
async function readDtaHeaders(page) {
    if (page.isClosed())
        return {};
    const hdrs = await page
        .evaluate(() => {
        const h = {};
        const at = localStorage.getItem("access-token");
        const client = localStorage.getItem("client");
        const uid = localStorage.getItem("uid");
        const expiry = localStorage.getItem("expiry");
        const tokenType = localStorage.getItem("token-type") || "Bearer";
        if (at && client && uid) {
            h["access-token"] = at;
            h["client"] = client;
            h["uid"] = uid;
            if (expiry)
                h["expiry"] = expiry;
            h["token-type"] = tokenType;
            h["Authorization"] = `${tokenType} ${at}`;
        }
        return h;
    })
        .catch(() => ({}));
    return hdrs || {};
}
/** レスポンスヘッダ → localStorage 反映 */
async function writeRotatedTokens(page, headers) {
    if (page.isClosed())
        return;
    await page
        .evaluate((h) => {
        if (h["access-token"])
            localStorage.setItem("access-token", h["access-token"]);
        if (h["client"])
            localStorage.setItem("client", h["client"]);
        if (h["uid"])
            localStorage.setItem("uid", h["uid"]);
        if (h["expiry"])
            localStorage.setItem("expiry", h["expiry"]);
        if (h["token-type"])
            localStorage.setItem("token-type", h["token-type"]);
    }, headers)
        .catch(() => { });
}
/** 必要な時だけサインイン（force か、トークン欠落時） */
export async function ensureAuthTokens(page, opts) {
    if (page.isClosed())
        return;
    const force = opts?.force ?? false;
    const has = await page
        .evaluate(() => !!localStorage.getItem("access-token") &&
        !!localStorage.getItem("client") &&
        !!localStorage.getItem("uid"))
        .catch(() => false);
    if (has && !force)
        return;
    const res = await page.request.post(apiUrl("/api/auth/sign_in"), {
        headers: {
            accept: "application/json",
            "content-type": "application/json",
            [REQ_TIME_HEADER]: String(Date.now()),
        },
        data: { email: "e2e@example.com", password: "password" },
        timeout: 30_000,
    });
    if (!res.ok()) {
        const body = await res.text().catch(() => "");
        throw new Error(`sign_in failed: ${res.status()} ${body}`);
    }
    const h = res.headers();
    const at = h["access-token"] ?? "";
    const client = h["client"] ?? "";
    const uid = h["uid"] ?? "";
    if (!at || !client || !uid) {
        const body = await res.text().catch(() => "");
        throw new Error(`sign_in ok but headers missing (CORS expose?) body=${body}`);
    }
    await page.evaluate((p) => {
        localStorage.setItem("access-token", p.at);
        localStorage.setItem("client", p.client);
        localStorage.setItem("uid", p.uid);
        if (p.expiry)
            localStorage.setItem("expiry", p.expiry);
        if (p.tokenType)
            localStorage.setItem("token-type", p.tokenType);
        window.dispatchEvent(new Event("auth:refresh"));
    }, {
        at,
        client,
        uid,
        expiry: h["expiry"] ?? "",
        tokenType: h["token-type"] ?? "Bearer",
    });
}
/** API: タスク作成（まず /tasks を開く。401 の時だけログインして再試行） */
export async function createTaskViaApi(page, task, opts) {
    if (page.isClosed())
        throw new Error("page closed");
    await openTasks(page);
    const baseHeaders = {
        "content-type": "application/json",
        accept: "application/json",
        [REQ_TIME_HEADER]: String(Date.now()),
    };
    // まずは localStorage の手持ちトークンだけで撃つ（無ければここでだけ sign_in）
    async function currentAuthHeaders() {
        let h = await readDtaHeaders(page);
        if (!h["access-token"] || !h["client"] || !h["uid"]) {
            await ensureAuthTokens(page, { force: true });
            h = await readDtaHeaders(page);
        }
        return h;
    }
    let headers = { ...baseHeaders, ...(await currentAuthHeaders()) };
    let res = await page.request.post(apiUrl("/api/tasks"), {
        headers,
        data: { task },
        timeout: 20_000,
    });
    if (res.status() === 401) {
        headers = { ...baseHeaders };
        await ensureAuthTokens(page, { force: true });
        headers = { ...headers, ...(await readDtaHeaders(page)) };
        res = await page.request.post(apiUrl("/api/tasks"), {
            headers,
            data: { task },
            timeout: 15_000,
        });
    }
    if (!res.ok()) {
        const body = await res.text().catch(() => "");
        throw new Error(`create failed: ${res.status()} ${body}`);
    }
    await writeRotatedTokens(page, res.headers());
    const json = await res.json();
    const waitForDom = opts?.waitForDom ?? true;
    if (waitForDom && !page.isClosed() && /\/tasks(\?.*)?$/.test(page.url())) {
        await refreshTasks(page);
        await waitForTasksOk(page);
        const createdId = json?.task?.id ?? json?.id;
        if (createdId) {
            const selector = `[data-testid="task-item-${createdId}"]`;
            for (let i = 0; i < 20; i++) {
                if (page.isClosed())
                    break;
                const ok = await page.locator(selector).first().isVisible().catch(() => false);
                if (ok)
                    break;
                await page.waitForTimeout(200).catch(() => { });
            }
            await page.waitForSelector(selector, { state: "visible", timeout: 5_000 }).catch(() => { });
        }
    }
    return json;
}
/** ベストエフォート削除 */
export async function apiDeleteTask(page, id) {
    if (page.isClosed())
        return;
    try {
        await page.request.delete(apiUrl(`/api/tasks/${id}`), {
            headers: { [REQ_TIME_HEADER]: String(Date.now()) },
            timeout: 3000,
        });
    }
    catch { }
}
