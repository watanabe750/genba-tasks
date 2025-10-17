import type { Task } from "../types";
import { brandIso } from "./brandIso";
import { demoImageStore } from "../lib/demoImageStore";

const KEY = "demo:tasks";
const IDK = "demo:nextId";
const REQUIRED_VER = "2025-10-18-portfolio"; // ←上げると再seed

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

  // ============================================================
  // 現場A（空調改修工事 - オフィスビル）
  // ============================================================
  const A1 = P("現場A 現場調査", "現場A", 1, "in_progress", 65); items.push(A1);
  const A1_c1 = C(A1.id, "平面・天伏図の確認", "現場A", 0, "completed", 100);
  const A1_c2 = C(A1.id, "既設配管ルートの把握", "現場A", 1, "in_progress", 70);
  const A1_c3 = C(A1.id, "安全掲示・KY更新", "現場A", -1, "completed", 100);
  const A1_c4 = C(A1.id, "写真撮影（全景/天井裏）", "現場A", 1, "in_progress", 45);
  const A1_c5 = C(A1.id, "電源・盤位置の現況確認", "現場A", 1, "in_progress", 80);
  items.push(A1_c1, A1_c2, A1_c3, A1_c4, A1_c5);
  items.push(
    G(A1_c2.id, "ダクト系統の凡例確認", "現場A", 0, "completed", 100),
    G(A1_c2.id, "天井裏の干渉ポイント洗い出し", "現場A", 1, "in_progress", 60),
    G(A1_c2.id, "是正箇所マーキング", "現場A", 1, "not_started", 0),
  );

  const A2 = P("現場A 見積もり", "現場A", 4, "in_progress", 50); items.push(A2);
  const A2_c1 = C(A2.id, "数量拾い（配管・ダクト・吊り材）", "現場A", 2, "in_progress", 60);
  const A2_c2 = C(A2.id, "外注見積徴収", "現場A", 3, "in_progress", 40);
  const A2_c3 = C(A2.id, "原価積算・粗利試算", "現場A", 4, "not_started", 0);
  const A2_c4 = C(A2.id, "見積書ドラフト作成", "現場A", 4, "not_started", 0);
  const A2_c5 = C(A2.id, "見積根拠の添付資料整理", "現場A", 4, "not_started", 0);
  items.push(A2_c1, A2_c2, A2_c3, A2_c4, A2_c5);
  items.push(
    G(A2_c1.id, "吊りボルト本数の確認", "現場A", 2, "in_progress", 30),
    G(A2_c1.id, "ダクト角丸変換ロス補正", "現場A", 2, "not_started", 0),
  );

  const A3 = P("現場A 資材発注", "現場A", 7, "not_started", 0); items.push(A3);
  const A3_c1 = C(A3.id, "冷媒管・ドレン手配", "現場A", 6, "not_started", 0);
  const A3_c2 = C(A3.id, "吊り金具ピッチ確認→発注", "現場A", 6, "not_started", 0);
  const A3_c3 = C(A3.id, "納期と搬入動線の調整", "現場A", 7, "not_started", 0);
  const A3_c4 = C(A3.id, "検収・納品書管理フロー作成", "現場A", 7, "not_started", 0);
  items.push(A3_c1, A3_c2, A3_c3, A3_c4);
  items.push(
    G(A3_c2.id, "間隔図面の作成", "現場A", 5, "not_started", 0),
    G(A3_c2.id, "現物サンプル確認", "現場A", 5, "not_started", 0),
  );

  const A4 = P("現場A 施工準備", "現場A", 10, "not_started", 0); items.push(A4);
  const A4_c1 = C(A4.id, "作業エリア養生計画", "現場A", 8, "not_started", 0);
  const A4_c2 = C(A4.id, "職人手配・スケジュール調整", "現場A", 9, "not_started", 0);
  const A4_c3 = C(A4.id, "工具・機材リストアップ", "現場A", 9, "not_started", 0);
  const A4_c4 = C(A4.id, "安全教育資料作成", "現場A", 10, "not_started", 0);
  items.push(A4_c1, A4_c2, A4_c3, A4_c4);

  // ============================================================
  // 現場B（新築・機器搬入工事 - 商業施設）
  // ============================================================
  const B1 = P("現場B 機器搬入計画", "現場B", 6, "in_progress", 55); items.push(B1);
  const B1_c1 = C(B1.id, "搬入経路確認（幅/高さ/養生）", "現場B", 4, "completed", 100);
  const B1_c2 = C(B1.id, "人員・台車・荷エレ段取り", "現場B", 5, "in_progress", 60);
  const B1_c3 = C(B1.id, "搬入当日の安全体制", "現場B", 6, "in_progress", 30);
  const B1_c4 = C(B1.id, "搬入手順書の作成", "現場B", 5, "in_progress", 70);
  items.push(B1_c1, B1_c2, B1_c3, B1_c4);
  items.push(G(B1_c4.id, "ヒヤリハットの事前想定", "現場B", 5, "in_progress", 40));

  const B2 = P("現場B 盤ラベル更新", "現場B", -3, "completed", 100); items.push(B2);
  const B2_c1 = C(B2.id, "回路名整理・表記統一", "現場B", -4, "completed", 100);
  const B2_c2 = C(B2.id, "改訂版の承認取得", "現場B", -3, "completed", 100);
  items.push(B2_c1, B2_c2);

  const B3 = P("現場B 配管施工", "現場B", 8, "not_started", 0); items.push(B3);
  const B3_c1 = C(B3.id, "配管材料の仮置き・検収", "現場B", 7, "not_started", 0);
  const B3_c2 = C(B3.id, "勾配確認・吊りピッチ墨出し", "現場B", 7, "not_started", 0);
  const B3_c3 = C(B3.id, "配管接続・溶接作業", "現場B", 8, "not_started", 0);
  const B3_c4 = C(B3.id, "試運転前チェックシート作成", "現場B", 8, "not_started", 0);
  items.push(B3_c1, B3_c2, B3_c3, B3_c4);

  // ============================================================
  // 現場C（是正対応 - 工場）
  // ============================================================
  const C1p = P("現場C 是正対応", "現場C", 2, "in_progress", 70); items.push(C1p);
  const C1_c1 = C(C1p.id, "是正箇所の洗い出し（写真）", "現場C", -1, "completed", 100);
  const C1_c2 = C(C1p.id, "是正工事（配管勾配）", "現場C", 1, "in_progress", 75);
  const C1_c3 = C(C1p.id, "是正後の確認・報告書", "現場C", 2, "in_progress", 40);
  const C1_c4 = C(C1p.id, "関係者レビュー", "現場C", 2, "not_started", 0);
  items.push(C1_c1, C1_c2, C1_c3, C1_c4);
  items.push(
    G(C1_c2.id, "水平器計測ログ添付", "現場C", 1, "completed", 100),
    G(C1_c2.id, "是正前後の比較写真整理", "現場C", 1, "in_progress", 60),
  );

  const C2 = P("現場C 定期点検", "現場C", 14, "not_started", 0); items.push(C2);
  const C2_c1 = C(C2.id, "点検項目リスト作成", "現場C", 12, "not_started", 0);
  const C2_c2 = C(C2.id, "機器動作確認", "現場C", 13, "not_started", 0);
  const C2_c3 = C(C2.id, "点検報告書提出", "現場C", 14, "not_started", 0);
  items.push(C2_c1, C2_c2, C2_c3);

  // ============================================================
  // 現場D（改修工事 - 病院）
  // ============================================================
  const D1 = P("現場D 設計図書確認", "現場D", 3, "in_progress", 80); items.push(D1);
  const D1_c1 = C(D1.id, "建築図との整合性チェック", "現場D", 2, "completed", 100);
  const D1_c2 = C(D1.id, "既存設備との取り合い確認", "現場D", 2, "in_progress", 90);
  const D1_c3 = C(D1.id, "施主・設計への質疑事項まとめ", "現場D", 3, "in_progress", 60);
  const D1_c4 = C(D1.id, "工程表ドラフト作成", "現場D", 3, "not_started", 0);
  items.push(D1_c1, D1_c2, D1_c3, D1_c4);

  const D2 = P("現場D 協力業者選定", "現場D", 5, "in_progress", 35); items.push(D2);
  const D2_c1 = C(D2.id, "候補業者リストアップ", "現場D", 3, "completed", 100);
  const D2_c2 = C(D2.id, "現地説明会の実施", "現場D", 4, "in_progress", 50);
  const D2_c3 = C(D2.id, "見積比較表作成", "現場D", 5, "not_started", 0);
  const D2_c4 = C(D2.id, "業者決定・発注", "現場D", 5, "not_started", 0);
  items.push(D2_c1, D2_c2, D2_c3, D2_c4);

  const D3 = P("現場D 着工前準備", "現場D", 9, "not_started", 0); items.push(D3);
  const D3_c1 = C(D3.id, "病院への工事届出", "現場D", 7, "not_started", 0);
  const D3_c2 = C(D3.id, "感染対策マニュアル確認", "現場D", 8, "not_started", 0);
  const D3_c3 = C(D3.id, "資材搬入時間調整（夜間対応）", "現場D", 8, "not_started", 0);
  const D3_c4 = C(D3.id, "騒音・振動対策計画", "現場D", 9, "not_started", 0);
  items.push(D3_c1, D3_c2, D3_c3, D3_c4);

  // ============================================================
  // 現場E（保守メンテナンス - データセンター）
  // ============================================================
  const E1 = P("現場E 緊急修理対応", "現場E", 0, "in_progress", 85); items.push(E1);
  const E1_c1 = C(E1.id, "冷却水ポンプ異音調査", "現場E", 0, "completed", 100);
  const E1_c2 = C(E1.id, "予備品在庫確認・手配", "現場E", 0, "completed", 100);
  const E1_c3 = C(E1.id, "ポンプ交換作業", "現場E", 0, "in_progress", 70);
  const E1_c4 = C(E1.id, "試運転・動作確認", "現場E", 0, "not_started", 0);
  const E1_c5 = C(E1.id, "報告書作成・提出", "現場E", 1, "not_started", 0);
  items.push(E1_c1, E1_c2, E1_c3, E1_c4, E1_c5);
  items.push(
    G(E1_c3.id, "既存配管との接続確認", "現場E", 0, "in_progress", 80),
    G(E1_c3.id, "電気配線の再接続", "現場E", 0, "not_started", 0),
  );

  const E2 = P("現場E 月次定期点検", "現場E", -5, "completed", 100); items.push(E2);
  const E2_c1 = C(E2.id, "空調機フィルター清掃", "現場E", -6, "completed", 100);
  const E2_c2 = C(E2.id, "冷却水水質検査", "現場E", -6, "completed", 100);
  const E2_c3 = C(E2.id, "制御盤動作確認", "現場E", -5, "completed", 100);
  const E2_c4 = C(E2.id, "点検報告書提出", "現場E", -5, "completed", 100);
  items.push(E2_c1, E2_c2, E2_c3, E2_c4);

  const E3 = P("現場E 年次オーバーホール計画", "現場E", 60, "not_started", 0); items.push(E3);
  const E3_c1 = C(E3.id, "停止スケジュール調整", "現場E", 50, "not_started", 0);
  const E3_c2 = C(E3.id, "部品発注・納期確認", "現場E", 55, "not_started", 0);
  const E3_c3 = C(E3.id, "作業手順書作成", "現場E", 58, "not_started", 0);
  items.push(E3_c1, E3_c2, E3_c3);

  // ============================================================
  // 現場F（リニューアル工事 - ホテル）
  // ============================================================
  const F1 = P("現場F 既存設備撤去", "現場F", 12, "not_started", 0); items.push(F1);
  const F1_c1 = C(F1.id, "撤去範囲マーキング", "現場F", 10, "not_started", 0);
  const F1_c2 = C(F1.id, "冷媒回収作業", "現場F", 11, "not_started", 0);
  const F1_c3 = C(F1.id, "撤去品の分別・廃棄手配", "現場F", 12, "not_started", 0);
  const F1_c4 = C(F1.id, "撤去後の清掃・養生", "現場F", 12, "not_started", 0);
  items.push(F1_c1, F1_c2, F1_c3, F1_c4);

  const F2 = P("現場F 客室内施工調整", "現場F", 15, "not_started", 0); items.push(F2);
  const F2_c1 = C(F2.id, "営業客室を避けた工程組み", "現場F", 13, "not_started", 0);
  const F2_c2 = C(F2.id, "騒音時間帯の制限確認", "現場F", 14, "not_started", 0);
  const F2_c3 = C(F2.id, "搬入経路（エレベーター）調整", "現場F", 14, "not_started", 0);
  const F2_c4 = C(F2.id, "館内放送・案内板設置依頼", "現場F", 15, "not_started", 0);
  items.push(F2_c1, F2_c2, F2_c3, F2_c4);

  // ============================================================
  // 過去完了プロジェクト（実績アピール用）
  // ============================================================
  const Z1 = P("現場X 竣工検査対応", "現場X", -10, "completed", 100); items.push(Z1);
  const Z1_c1 = C(Z1.id, "完成図書の作成", "現場X", -12, "completed", 100);
  const Z1_c2 = C(Z1.id, "試運転調整記録まとめ", "現場X", -11, "completed", 100);
  const Z1_c3 = C(Z1.id, "検査立会い", "現場X", -10, "completed", 100);
  items.push(Z1_c1, Z1_c2, Z1_c3);

  const Z2 = P("現場Y 引渡し・保証書発行", "現場Y", -7, "completed", 100); items.push(Z2);
  const Z2_c1 = C(Z2.id, "取扱説明会実施", "現場Y", -8, "completed", 100);
  const Z2_c2 = C(Z2.id, "メンテナンス契約締結", "現場Y", -7, "completed", 100);
  items.push(Z2_c1, Z2_c2);

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
