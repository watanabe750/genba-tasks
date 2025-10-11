import type { Task } from "../types";
import { brandIso } from "./brandIso";
import { demoImageStore } from "../lib/demoImageStore";

const KEY = "demo:tasks";
const IDK = "demo:nextId";
const REQUIRED_VER = "2025-10-11-f"; // ←上げると再seed

function read(): Task[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function write(x: Task[]) { localStorage.setItem(KEY, JSON.stringify(x)); }
function nextId(): number {
  const n = Number(localStorage.getItem(IDK) || "1");
  localStorage.setItem(IDK, String(n + 1));
  return n;
}

// ---- ローカル配布画像（/public/demo 配下） ----
// ※ 拡張子はあなたの実ファイル名に合わせています（A2は .jpeg）
const IMG_A1_SURVEY   = "/demo/siteA_survey.jpg";    // 現場A 現場調査
const IMG_A2_ESTIMATE = "/demo/A2_estimate.jpeg";    // 現場A 見積もり（図面）
const IMG_A3_ORDERING = "/demo/A3_ordering.jpg";     // 現場A 資材発注（倉庫・箱）
const IMG_B1_MOVEPLAN = "/demo/B1_moveplan.jpg";     // 現場B 機器搬入計画（トラック/通路）
const IMG_B2_PANEL    = "/demo/B2_panel.jpg";        // 現場B 盤ラベル更新（盤内配線）
const IMG_C1_FIX      = "/demo/C1_fix.jpg";          // 現場C 是正対応（天井配管）

// 初回シード（空 or 旧verなら親子孫＋画像を投入）
(function seed() {
  const cur = read();
  const ver = localStorage.getItem("demo:ver");
  if (cur.length !== 0 && ver === REQUIRED_VER) return;

  const now = new Date();
  const d = (days: number) => new Date(now.getTime() + days * 864e5).toISOString();

  // 親
  const P = (title: string, site: string, deadlineInDays: number, status: Task["status"], progress: number): Task => ({
    id: nextId(), title, status, progress, deadline: brandIso(d(deadlineInDays)), site, parent_id: null,
  });
  // 子
  const C = (parent_id: number, title: string, site: string, deadlineInDays: number, status: Task["status"], progress: number): Task => ({
    id: nextId(), title, status, progress, deadline: brandIso(d(deadlineInDays)), site, parent_id,
  });
  // 孫
  const G = (parent_id: number, title: string, site: string, deadlineInDays: number, status: Task["status"], progress: number): Task => ({
    id: nextId(), title, status, progress, deadline: brandIso(d(deadlineInDays)), site, parent_id,
  });

  const items: Task[] = [];

  // --- 現場A（空調改修） ---
  const A1 = P("現場A 現場調査", "現場A", 1, "in_progress", 40); items.push(A1);
  const A1_c1 = C(A1.id, "平面・天伏図の確認", "現場A", 1, "in_progress", 50);
  const A1_c2 = C(A1.id, "既設配管ルートの把握", "現場A", 2, "not_started", 0);
  const A1_c3 = C(A1.id, "安全掲示・KY更新", "現場A", 0, "completed", 100);
  const A1_c4 = C(A1.id, "写真撮影（全景/天井裏）", "現場A", 1, "in_progress", 20);
  const A1_c5 = C(A1.id, "電源・盤位置の現況確認", "現場A", 2, "not_started", 0);
  items.push(A1_c1, A1_c2, A1_c3, A1_c4, A1_c5);
  // 孫（A1_c1配下）
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
  // 孫（A2_c1配下）
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
  // 孫（A3_c2配下）
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
  // 孫（B1_c4配下）
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
  // 孫（C1_c2配下）
  items.push(
    G(C1_c2.id, "水平器計測ログ添付", "現場C", 1, "in_progress", 20),
    G(C1_c2.id, "是正前後の比較写真整理", "現場C", 1, "not_started", 0),
  );

  // 書き込み＋バージョン保存
  write(items);
  localStorage.setItem("demo:ver", REQUIRED_VER);


  try {
    const parents = items.filter(t => t.parent_id == null);
    const byTitle = Object.fromEntries(parents.map(t => [t.title, t]));
    const attach = (title: string, url: string) => { const t = byTitle[title]; if (t) demoImageStore.set(t.id, url); };

    attach("現場A 現場調査",    IMG_A1_SURVEY);
    attach("現場A 見積もり",    IMG_A2_ESTIMATE);
    attach("現場A 資材発注",    IMG_A3_ORDERING);
    attach("現場B 機器搬入計画", IMG_B1_MOVEPLAN);
    attach("現場B 盤ラベル更新", IMG_B2_PANEL);
    attach("現場C 是正対応",    IMG_C1_FIX);
  } catch {}
})();

export const demoStore = {
  list(): Task[] { return read(); },
  create(payload: Partial<Task>): Task {
    const all = read();
    const t: Task = {
      id: nextId(),
      title: payload.title ?? "無題のタスク",
      status: payload.status ?? "not_started",
      progress: payload.progress ?? 0,
      deadline: payload.deadline ?? null,
      site: payload.site ?? null,
      parent_id: payload.parent_id ?? null,
    };
    write([t, ...all]);
    return t;
  },
  get(id: number): Task | undefined { return read().find(t => t.id === id); },
  update(id: number, patch: Partial<Task>): Task | undefined {
    const all = read(); const i = all.findIndex(t => t.id === id);
    if (i < 0) return;
    all[i] = { ...all[i], ...patch }; write(all); return all[i];
  },
  remove(id: number): void { write(read().filter(t => t.id !== id)); },
  sites(): string[] {
    return Array.from(new Set(read().map(t => t.site).filter(Boolean))) as string[];
  },
  priority(): Task[] {
    const list = read();
    const score = (t: Task) => (t.deadline ? Date.parse(t.deadline) : 9e15) + (t.progress ?? 0) * 1e10;
    return [...list].sort((a, b) => score(a) - score(b)).slice(0, 5);
  },
  reset(): void { write([]); localStorage.removeItem(IDK); localStorage.removeItem("demo:ver"); },
};
