// src/features/tasks/nest.ts
import type { Task, TaskNode } from "../../types";
import type { OrderBy, SortDir } from "../../types";

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

/** 親（depth=1）の配列を UI 最終順として並び替える（NULL は常に末尾） */
export function sortRootNodes(
  roots: TaskNode[],
  order_by: OrderBy = "deadline",
  dir: SortDir = "asc"
): TaskNode[] {
  if (!Array.isArray(roots) || roots.length <= 1) return roots;

  if (order_by === "deadline") {
    const val = (n: TaskNode) => {
      const t = n.deadline ? Date.parse(n.deadline as any) : NaN;
      if (!Number.isFinite(t)) {
        // NULL は末尾に送る
        return dir === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
      }
      return t;
    };
    return [...roots].sort((a, b) =>
      dir === "asc" ? val(a) - val(b) : val(b) - val(a)
    );
  }

  if (order_by === "progress") {
    const val = (n: TaskNode) => {
      const p = typeof n.progress === "number" ? n.progress : NaN;
      if (!Number.isFinite(p)) {
        return dir === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
      }
      return p;
    };
    return [...roots].sort((a, b) =>
      dir === "asc" ? val(a) - val(b) : val(b) - val(a)
    );
  }

  // created_at は API の select に含めていないため、サーバ順に委ねる
  return roots;
}
