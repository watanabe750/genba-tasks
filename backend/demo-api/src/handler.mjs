// Node.js 20 (ESM)
const ORIGIN = process.env.ALLOWED_ORIGIN || "https://app.genba-tasks.com";

/* ===================== CORS ===================== */
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ORIGIN,
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type,Authorization,x-auth-start,X-Auth-Start,access-token,client,uid,token-type,expiry",
    "Access-Control-Expose-Headers":
      "access-token,client,uid,token-type,expiry",
    Vary: "Origin",
  };
}
const ok = (data, status = 200, extraHeaders = {}) => ({
  statusCode: status,
  headers: { "Content-Type": "application/json", ...corsHeaders(), ...extraHeaders },
  body: typeof data === "string" ? data : JSON.stringify(data),
});
const noContent = (status = 204) => ({
  statusCode: status,
  headers: { ...corsHeaders() },
  body: "",
});
const notFound = (msg = "Not Found") => ok({ error: msg }, 404);

/* ===================== Utils ===================== */
const iso = (d) => new Date(d).toISOString();

/* ===================== DEMO DB（demoStore と同じデータ） ===================== */
/** Task: {id,title,status,progress,deadline,site,parent_id} */
let NEXT_ID = 1;
const nextId = () => NEXT_ID++;

// 画像URL（/public/demo 配布前提の相対パス）
const IMG_A1_SURVEY   = "/demo/siteA_survey.jpg";
const IMG_A2_ESTIMATE = "/demo/A2_estimate.jpeg";
const IMG_A3_ORDERING = "/demo/A3_ordering.jpg";
const IMG_B1_MOVEPLAN = "/demo/B1_moveplan.jpg";
const IMG_B2_PANEL    = "/demo/B2_panel.jpg";
const IMG_C1_FIX      = "/demo/C1_fix.jpg";

const now = Date.now();
const d = (days) => iso(now + days * 864e5);

const P = (title, site, deadlineInDays, status, progress) => ({
  id: nextId(), title, status, progress, deadline: d(deadlineInDays), site, parent_id: null,
});
const C = (pid, title, site, deadlineInDays, status, progress) => ({
  id: nextId(), title, status, progress, deadline: d(deadlineInDays), site, parent_id: pid,
});
const G = (pid, title, site, deadlineInDays, status, progress) => ({
  id: nextId(), title, status, progress, deadline: d(deadlineInDays), site, parent_id: pid,
});

const TASKS = (() => {
  const items = [];

  // --- 現場A（空調改修） ---
  const A1 = P("現場A 現場調査", "現場A", 1, "in_progress", 40); items.push(A1);
  const A1_c1 = C(A1.id, "平面・天伏図の確認", "現場A", 1, "in_progress", 50);
  const A1_c2 = C(A1.id, "既設配管ルートの把握", "現場A", 2, "not_started", 0);
  const A1_c3 = C(A1.id, "安全掲示・KY更新", "現場A", 0, "completed", 100);
  const A1_c4 = C(A1.id, "写真撮影（全景/天井裏）", "現場A", 1, "in_progress", 20);
  const A1_c5 = C(A1.id, "電源・盤位置の現況確認", "現場A", 2, "not_started", 0);
  items.push(A1_c1, A1_c2, A1_c3, A1_c4, A1_c5);
  items.push(
    G(A1_c1.id, "ダクト系統の凡例確認", "現場A", 1, "in_progress", 30),
    G(A1_c1.id, "天井裏の干渉ポイント洗い出し", "現場A", 2, "not_started", 0),
    G(A1_c1.id, "是正箇所マーキング", "現場A", 2, "not_started", 0),
  );

  const A2 = P("現場A 見積もり", "現場A", 3, "in_progress", 35); items.push(A2);
  const A2_c1 = C(A2.id, "数量拾い（配管・ダクト・吊り材）", "現場A", 2, "in_progress", 30);
  const A2_c2 = C(A2.id, "外注見積徴収", "現場A", 3, "not_started", 0);
  const A2_c3 = C(A2.id, "原価積算・粗利試算", "現場A", 3, "not_started", 0);
  const A2_c4 = C(A2.id, "見積書ドラフト作成", "現場A", 3, "not_started", 0);
  const A2_c5 = C(A2.id, "見積根拠の添付資料整理", "現場A", 3, "not_started", 0);
  items.push(A2_c1, A2_c2, A2_c3, A2_c4, A2_c5);
  items.push(
    G(A2_c1.id, "吊りボルト本数の確認", "現場A", 2, "not_started", 0),
    G(A2_c1.id, "ダクト角丸変換ロス補正", "現場A", 2, "not_started", 0),
  );

  const A3 = P("現場A 資材発注", "現場A", 5, "not_started", 0); items.push(A3);
  const A3_c1 = C(A3.id, "冷媒管・ドレン手配", "現場A", 4, "not_started", 0);
  const A3_c2 = C(A3.id, "吊り金具ピッチ確認→発注", "現場A", 4, "not_started", 0);
  const A3_c3 = C(A3.id, "納期と搬入動線の調整", "現場A", 5, "not_started", 0);
  const A3_c4 = C(A3.id, "検収・納品書管理フロー作成", "現場A", 5, "not_started", 0);
  items.push(A3_c1, A3_c2, A3_c3, A3_c4);
  items.push(
    G(A3_c2.id, "間隔図面の作成", "現場A", 3, "not_started", 0),
    G(A3_c2.id, "現物サンプル確認", "現場A", 3, "not_started", 0),
  );

  // --- 現場B（新築・機器搬入） ---
  const B1 = P("現場B 機器搬入計画", "現場B", 6, "in_progress", 20); items.push(B1);
  const B1_c1 = C(B1.id, "搬入経路確認（幅/高さ/養生）", "現場B", 4, "in_progress", 30);
  const B1_c2 = C(B1.id, "人員・台車・荷エレ段取り", "現場B", 5, "not_started", 0);
  const B1_c3 = C(B1.id, "搬入当日の安全体制", "現場B", 6, "not_started", 0);
  const B1_c4 = C(B1.id, "搬入手順書の作成", "現場B", 5, "not_started", 0);
  items.push(B1_c1, B1_c2, B1_c3, B1_c4);
  items.push(G(B1_c4.id, "ヒヤリハットの事前想定", "現場B", 5, "not_started", 0));

  const B2 = P("現場B 盤ラベル更新", "現場B", 2, "completed", 100); items.push(B2);
  const B2_c1 = C(B2.id, "回路名整理・表記統一", "現場B", 0, "completed", 100);
  const B2_c2 = C(B2.id, "改訂版の承認取得", "現場B", 1, "completed", 100);
  items.push(B2_c1, B2_c2);

  // --- 現場C（是正対応） ---
  const C1p = P("現場C 是正対応", "現場C", 2, "in_progress", 60); items.push(C1p);
  const C1_c1 = C(C1p.id, "是正箇所の洗い出し（写真）", "現場C", 0, "completed", 100);
  const C1_c2 = C(C1p.id, "是正工事（配管勾配）", "現場C", 1, "in_progress", 40);
  const C1_c3 = C(C1p.id, "是正後の確認・報告書", "現場C", 2, "not_started", 0);
  const C1_c4 = C(C1p.id, "関係者レビュー", "現場C", 2, "not_started", 0);
  items.push(C1_c1, C1_c2, C1_c3, C1_c4);
  items.push(
    G(C1_c2.id, "水平器計測ログ添付", "現場C", 1, "in_progress", 20),
    G(C1_c2.id, "是正前後の比較写真整理", "現場C", 1, "not_started", 0),
  );

  return items;
})();

// 画像の紐付け（親タスクの id -> 画像URL）
const IMAGE_BY_PARENT_TITLE = {
  "現場A 現場調査":    IMG_A1_SURVEY,
  "現場A 見積もり":    IMG_A2_ESTIMATE,
  "現場A 資材発注":    IMG_A3_ORDERING,
  "現場B 機器搬入計画": IMG_B1_MOVEPLAN,
  "現場B 盤ラベル更新": IMG_B2_PANEL,
  "現場C 是正対応":    IMG_C1_FIX,
};
const PARENT_ID_TO_IMAGE = (() => {
  const parents = TASKS.filter(t => t.parent_id == null);
  const byTitle = Object.fromEntries(parents.map(t => [t.title, t.id]));
  const map = {};
  for (const [title, url] of Object.entries(IMAGE_BY_PARENT_TITLE)) {
    const pid = byTitle[title];
    if (pid) map[pid] = url;
  }
  return map;
})();

/* ===================== Handlers ===================== */
export async function health() {
  return ok({ ok: true, ts: Date.now() });
}

export async function guestLogin() {
  const token = "guest-demo-token";
  const client = "guest-demo-client";
  const uid = "guest@example.com";
  const tokenType = "Bearer";
  const expiry = String(Math.floor(Date.now() / 1000) + 3600);
  return {
    statusCode: 200,
    headers: {
      ...corsHeaders(),
      "Content-Type": "application/json",
      "access-token": token,
      client,
      uid,
      "token-type": tokenType,
      expiry,
    },
    body: JSON.stringify({
      token, client, uid, token_type: tokenType, expiry,
      user: { id: "guest", name: "Guest User" },
    }),
  };
}

export async function me() {
  return ok({ email: "guest@example.com", name: "Guest User" });
}

export async function listTasks() {
  // demoStore と同じ：配列そのまま
  return ok(TASKS);
}

export async function createTask(event) {
  // スタブ：作成できるようにする（メモリだけ・永続化なし）
  const body = event?.body ? JSON.parse(event.body) : {};
  const src = body?.task ?? body ?? {};
  const t = {
    id: nextId(),
    title: src.title ?? "無題のタスク",
    status: src.status ?? "not_started",
    progress: src.progress ?? 0,
    deadline: src.deadline ?? null,
    site: src.site ?? null,
    parent_id: src.parent_id ?? null,
  };
  TASKS.unshift(t);
  return ok(t, 201);
}

export async function getTask(event) {
  const id = Number(event?.pathParameters?.id);
  const t = TASKS.find(x => x.id === id);
  if (!t) return notFound();
  // 画像URLは個別取得時に付ける（親なら画像、子孫は親の画像を継承してもOK）
  const pid = t.parent_id ?? t.id;
  const image_url = PARENT_ID_TO_IMAGE[pid] ?? null;
  return ok({ ...t, image_url });
}

export async function patchTask(event) {
  const id = Number(event?.pathParameters?.id);
  const i = TASKS.findIndex(x => x.id === id);
  if (i < 0) return notFound();
  const body = event?.body ? JSON.parse(event.body) : {};
  const patch = body?.task ?? body ?? {};
  TASKS[i] = { ...TASKS[i], ...patch };
  return ok(TASKS[i]);
}

export async function deleteTask(event) {
  const id = Number(event?.pathParameters?.id);
  const before = TASKS.length;
  for (let i = TASKS.length - 1; i >= 0; i--) {
    if (TASKS[i].id === id || TASKS[i].parent_id === id) TASKS.splice(i, 1);
  }
  return before === TASKS.length ? notFound() : noContent();
}

export async function tasksPriority() {
  const score = (t) => (t.deadline ? Date.parse(t.deadline) : 9e15) + (t.progress ?? 0) * 1e10;
  const top5 = [...TASKS].sort((a,b) => score(a) - score(b)).slice(0,5);
  return ok(top5);
}

export async function taskSites() {
  const sites = Array.from(new Set(TASKS.map(t => t.site).filter(Boolean)));
  return ok(sites);
}

// 画像API（ダミー）
export async function taskImagePost() {
  return ok({ url: null }, 201);
}
export async function taskImageDelete() {
  return noContent();
}

/* Optional */
export async function preflight() { return noContent(204); }
export async function notFound() { return ok({ error: "Not Found" }, 404); }
