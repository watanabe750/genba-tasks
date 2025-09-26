// src/lib/demoStore.ts
import type { Task } from "../type";

const KEY = "demo:tasks";
const IDK = "demo:nextId";

function read(): Task[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function write(x: Task[]) { localStorage.setItem(KEY, JSON.stringify(x)); }
function nextId(): number {
  const n = Number(localStorage.getItem(IDK) || "1");
  localStorage.setItem(IDK, String(n + 1));
  return n;
}

// 初回シード（空なら簡単なタスクを投入）
(function seed() {
  const cur = read();
  if (cur.length === 0) {
    const now = new Date();
    const d = (days: number) => new Date(now.getTime() + days * 864e5).toISOString();
    const items: Task[] = [
      { id: nextId(), title: "現場A 見積もり", status: "in_progress", progress: 40, deadline: d(3), site: "現場A", parent_id: null },
      { id: nextId(), title: "資材発注",       status: "not_started", progress: 0,  deadline: d(5), site: "現場A", parent_id: null },
      { id: nextId(), title: "現場B 朝礼準備", status: "completed",   progress: 100,deadline: d(0), site: "現場B", parent_id: null },
    ];
    write(items);
  }
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
    const all = read();
    const i = all.findIndex(t => t.id === id);
    if (i < 0) return;
    all[i] = { ...all[i], ...patch };
    write(all);
    return all[i];
  },
  remove(id: number): void {
    write(read().filter(t => t.id !== id));
  },
  sites(): string[] {
    return Array.from(new Set(read().map(t => t.site).filter(Boolean))) as string[];
  },
  priority(): Task[] {
    // ざっくり「期限が近い or 進捗<50%」を上位に
    const list = read();
    const score = (t: Task) => (t.deadline ? Date.parse(t.deadline) : 9e15) + (t.progress ?? 0) * 1e10;
    return [...list].sort((a, b) => score(a) - score(b)).slice(0, 5);
  },
  reset(): void { write([]); localStorage.removeItem(IDK); },
};
