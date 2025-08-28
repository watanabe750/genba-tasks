import type { Task, TaskNode } from "../../types";

export function nestTasks(flat: Task[]): TaskNode[] {
  // 既存ロジックに型注釈を足すだけ
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