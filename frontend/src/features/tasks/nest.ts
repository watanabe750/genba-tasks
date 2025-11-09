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

const compareSites = (a?: string | null, b?: string | null) => {
  const normalizedA = (a ?? "").trim().toLowerCase();
  const normalizedB = (b ?? "").trim().toLowerCase();
  const isAEmpty = normalizedA === "";
  const isBEmpty = normalizedB === "";
  if (isAEmpty !== isBEmpty) return isAEmpty ? 1 : -1; // 空 site は末尾
  return normalizedA < normalizedB ? -1 : normalizedA > normalizedB ? 1 : 0;
};

/**
 * タスクのソート比較関数を生成
 * ルール:
 *  1) completed は常に末尾
 *  2) 期限なしは常に末尾
 *  3) 主キーでソート（order_by）
 *  4) タイブレーク: id 昇順
 */
function createTaskComparator(order_by: string = "deadline", dir: "asc" | "desc" = "asc") {
  const primaryKey = (order_by || "deadline").split(",")[0]?.trim();

  return (a: Task | TaskNode, b: Task | TaskNode): number => {
    // 1) completed 末尾
    const isACompleted = a.status === "completed";
    const isBCompleted = b.status === "completed";
    if (isACompleted !== isBCompleted) return isACompleted ? 1 : -1;

    // 2) 期限なし末尾
    const isANullDeadline = isNullDeadline(a);
    const isBNullDeadline = isNullDeadline(b);
    if (isANullDeadline !== isBNullDeadline) return isANullDeadline ? 1 : -1;

    // 3) 主キー
    if (primaryKey === "site") {
      const siteComparison = compareSites(a.site, b.site);
      if (siteComparison !== 0) return dir === "desc" ? -siteComparison : siteComparison;
      const deadlineA = toDateInputValue(a.deadline);
      const deadlineB = toDateInputValue(b.deadline);
      if (deadlineA !== deadlineB) return deadlineA < deadlineB ? -1 : 1;
    } else {
      const deadlineA = toDateInputValue(a.deadline);
      const deadlineB = toDateInputValue(b.deadline);
      if (deadlineA !== deadlineB) {
        const asc = deadlineA < deadlineB ? -1 : 1;
        return dir === "desc" ? -asc : asc;
      }
      const siteComparison = compareSites(a.site, b.site);
      if (siteComparison !== 0) return siteComparison;
    }

    // 4) tie-break
    return Number(a.id) - Number(b.id);
  };
}

/** ★ UI最終順：TaskNode[]（ルート）を並び替え */
export function sortRootNodes(
  tree: TaskNode[],
  order_by: string = "deadline",
  dir: "asc" | "desc" = "asc"
): TaskNode[] {
  return tree.slice().sort(createTaskComparator(order_by, dir));
}

/** ★ UI最終順：フラット Task[] を並び替え（楽観更新用） */
export function sortFlatForUI(
  arr: Task[],
  order_by: string = "deadline",
  dir: "asc" | "desc" = "asc"
): Task[] {
  return arr.slice().sort(createTaskComparator(order_by, dir));
}