import type { Task } from "../../types/task";

export function nestTasks(flat: Task[]): Task[] {
  const byId = new Map<number, Task & { children: Task[]; depth: number }>();
  flat.forEach(t => byId.set(t.id, { ...t, children: [], depth: 1 }));

  const roots: Task[] = [];
  byId.forEach(t => {
    if (t.parent_id && byId.has(t.parent_id)) {
      const p = byId.get(t.parent_id)!;
      t.depth = p.depth + 1;
      p.children.push(t);
    } else {
      t.depth = 1;
      roots.push(t);
    }
  });
  return roots;
}
