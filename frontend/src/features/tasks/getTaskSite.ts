import type { Task } from "../../types/task";

export function getTaskSite(t: Task): string | null {
  const site = (t.site ?? "").trim();
  if (site) return site;

  // 既存データの救済（タイトルに [現場:○○] / [site:○○] 形式があれば使う）
  const m = /\[(?:現場|site)\s*:\s*([^\]]+)\]/i.exec(t.title ?? "");
  return m ? m[1].trim() : null;
}
