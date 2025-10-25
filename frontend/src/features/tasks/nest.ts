// src/features/tasks/nest.ts
import type { Task, TaskNode } from "../../types";
import { toDateInputValue } from "../../utils/date";

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
 * ルール（優先度の高い順）:
 *  1) completed は常に末尾へ（order_by/dir に関わらず）
 *  2) 期限なし（deadline null/空）は常に末尾へ
 *  3) 主キーでソート（order_by）
 *     - "site" 指定時: site（dir 反映）→ deadline 昇順
 *     - "deadline" 指定時: deadline（dir 反映）→ site 昇順
 *  4) タイブレーク: id 昇順
 *
 * order_by: "deadline" | "site" | "site,deadline" | "deadline,site"
 * dir は主キーのみに適用
 */
const isNullDeadline = (t: { deadline?: string | null }) => !toDateInputValue(t.deadline);

const cmpSite = (a?: string | null, b?: string | null) => {
  const aa = (a ?? "").trim().toLowerCase();
  const bb = (b ?? "").trim().toLowerCase();
  const ae = aa === "";
  const be = bb === "";
  if (ae !== be) return ae ? 1 : -1; // 空 site は末尾
  return aa < bb ? -1 : aa > bb ? 1 : 0;
};

/** ★ UI最終順：TaskNode[]（ルート）を並び替え */
export function sortRootNodes(
  tree: TaskNode[],
  order_by: string = "deadline",
  dir: "asc" | "desc" = "asc"
): TaskNode[] {
  const raw = (order_by || "deadline").split(",").map((s) => s.trim()).filter(Boolean) as Array<"site" | "deadline">;
  const keys: Array<"site" | "deadline"> = [];
  for (const k of raw) if (!keys.includes(k)) keys.push(k);
  if (!keys.includes("deadline")) keys.push("deadline");

  const primary = keys[0];

  return tree.slice().sort((a, b) => {
    // 1) completed 末尾
    const ac = a.status === "completed", bc = b.status === "completed";
    if (ac !== bc) return ac ? 1 : -1;

    // 2) 期限なし末尾
    const an = isNullDeadline(a), bn = isNullDeadline(b);
    if (an !== bn) return an ? 1 : -1;

    // 3) 主キー
    if (primary === "site") {
      const ds = cmpSite(a.site, b.site);
      if (ds !== 0) return dir === "desc" ? -ds : ds;
      const da = toDateInputValue(a.deadline), db = toDateInputValue(b.deadline);
      if (da !== db) return da < db ? -1 : 1;
    } else {
      const da = toDateInputValue(a.deadline), db = toDateInputValue(b.deadline);
      if (da !== db) {
        const asc = da < db ? -1 : 1;
        return dir === "desc" ? -asc : asc;
      }
      const ds = cmpSite(a.site, b.site);
      if (ds !== 0) return ds;
    }

    // 4) tie-break
    return Number(a.id) - Number(b.id);
  });
}

/** ★ UI最終順：フラット Task[] を並び替え（楽観更新用） */
export function sortFlatForUI(
  arr: Task[],
  order_by: string = "deadline",
  dir: "asc" | "desc" = "asc"
): Task[] {
  // ルート/子の区別は不要（一覧は親のみを表示している前提）。規則は sortRootNodes と同じ。
  return arr.slice().sort((a, b) => {
    const ac = a.status === "completed", bc = b.status === "completed";
    if (ac !== bc) return ac ? 1 : -1;

    const an = isNullDeadline(a), bn = isNullDeadline(b);
    if (an !== bn) return an ? 1 : -1;

    const ob = (order_by || "deadline").split(",")[0]?.trim();
    if (ob === "site") {
      const ds = cmpSite(a.site, b.site);
      if (ds !== 0) return dir === "desc" ? -ds : ds;
      const da = toDateInputValue(a.deadline), db = toDateInputValue(b.deadline);
      if (da !== db) return da < db ? -1 : 1;
    } else {
      const da = toDateInputValue(a.deadline), db = toDateInputValue(b.deadline);
      if (da !== db) {
        const asc = da < db ? -1 : 1;
        return dir === "desc" ? -asc : asc;
      }
      const ds = cmpSite(a.site, b.site);
      if (ds !== 0) return ds;
    }
    return Number(a.id) - Number(b.id);
  });
}