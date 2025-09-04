// src/features/tasks/nest.ts
import type { Task, TaskNode } from "../../types";

/** フラット配列を親子ツリー化（depth 付与・children 初期化） */
export function nestTasks(flat: Task[]): TaskNode[] {
  const map = new Map<number, TaskNode>();
  const roots: TaskNode[] = [];

  flat.forEach((t) => {
    map.set(t.id, { ...t, children: [] });
  });

  map.forEach((node) => {
    if (node.parent_id == null) {
      node.depth = 1;
      roots.push(node);
    } else {
      const p = map.get(node.parent_id);
      if (p) {
        node.depth = (p.depth ?? 1) + 1;
        (p.children ??= []).push(node);
      } else {
        node.depth = 1;
        roots.push(node);
      }
    }
  });

  return roots;
}

/* 親ノード（depth=1）だけを UI 最終順に並べ替え
 * - order_by: "deadline" | "site" | "site,deadline" | "deadline,site"
 * - dir は主キーのみ反転、期限なしは常に末尾（dir に関わらず）
 */
const toDateInput = (iso?: string | null) => {
  if (!iso) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};
const isNullDeadline = (t: TaskNode) => !toDateInput(t.deadline);
const cmpStr = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const cmpId = (a: number, b: number) => (a < b ? -1 : a > b ? 1 : 0);
const siteKey = (t: TaskNode) => (t.site ?? "").toLowerCase();

/** 期限: 昇順（null は常に末尾） */
const cmpDeadlineAsc = (a: TaskNode, b: TaskNode) => {
  const na = isNullDeadline(a), nb = isNullDeadline(b);
  if (na && nb) return 0;
  if (na) return 1;   // null は末尾
  if (nb) return -1;
  return cmpStr(toDateInput(a.deadline), toDateInput(b.deadline));
};
/** 期限: 降順（null は常に末尾） */
const cmpDeadlineDesc = (a: TaskNode, b: TaskNode) => {
  const na = isNullDeadline(a), nb = isNullDeadline(b);
  if (na && nb) return 0;
  if (na) return 1;
  if (nb) return -1;
  // 降順
  return cmpStr(toDateInput(b.deadline), toDateInput(a.deadline));
};

export function sortRootNodes(
  tree: TaskNode[],
  order_by: string = "deadline",
  dir: "asc" | "desc" = "asc"
): TaskNode[] {
  const raw = (order_by || "deadline")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean) as Array<"site" | "deadline">;

  // 重複除去し、deadline なければセカンダリとして追加
  const keys: Array<"site" | "deadline"> = [];
  for (const k of raw) if (!keys.includes(k)) keys.push(k);
  if (!keys.includes("deadline")) keys.push("deadline");

  const cmpSite = (a: string | null | undefined, b: string | null | undefined) => {
    const aa = (a ?? "").trim().toLowerCase();
    const bb = (b ?? "").trim().toLowerCase();
    const ae = aa === "";
    const be = bb === "";
    if (ae !== be) return ae ? 1 : -1; // 空 site は常に末尾
    return aa < bb ? -1 : aa > bb ? 1 : 0;
  };

  const cmp = (a: TaskNode, b: TaskNode) => {
    // ❶ グローバルルール：期限なしは常に全体の末尾（dir や site に関わらず）
    const an = isNullDeadline(a);
    const bn = isNullDeadline(b);
    if (an !== bn) return an ? 1 : -1;

    const primary = keys[0];

    if (primary === "site") {
      // ❷ 主キー: site（dir 反転は主キーのみ）
      const ds = cmpSite(a.site, b.site);
      if (ds !== 0) return dir === "desc" ? -ds : ds;

      // ❸ セカンダリ: deadline（常に昇順。null は ❶ で弾いている）
      const da = toDateInput(a.deadline);
      const db = toDateInput(b.deadline);
      if (da !== db) return da < db ? -1 : 1;
    } else {
      // primary === "deadline"
      // ❷ 主キー: deadline（dir を適用。null は ❶ で弾いている）
      const da = toDateInput(a.deadline);
      const db = toDateInput(b.deadline);
      if (da !== db) return dir === "desc" ? (db < da ? -1 : 1) : (da < db ? -1 : 1);

      // ❸ セカンダリ: site（常に昇順）
      const ds = cmpSite(a.site, b.site);
      if (ds !== 0) return ds;
    }

    // ❹ タイブレーク（安定性担保）
    return Number(a.id) - Number(b.id);
  };

  return tree.slice().sort(cmp);
}
