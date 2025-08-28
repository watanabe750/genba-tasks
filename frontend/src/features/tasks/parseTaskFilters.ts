import type { TaskFilters, OrderBy, SortDir } from "../../types";

/** URLSearchParams → TaskFilters（型付き） */
export function parseTaskFilters(sp: URLSearchParams): TaskFilters {
  const site = sp.get("site") || undefined;

  // 複数 status に対応（存在しないなら空配列）
  const status = sp.getAll("status") as TaskFilters["status"];

  const progress_min = sp.get("progress_min");
  const progress_max = sp.get("progress_max");

  const order_by = (sp.get("order_by") as OrderBy) || "deadline";
  const dir = (sp.get("dir") as SortDir) || "asc";

  const parents_only = sp.get("parents_only") === "1" ? "1" : undefined;

  return {
    site,
    status,
    progress_min: progress_min ? Number(progress_min) : undefined,
    progress_max: progress_max ? Number(progress_max) : undefined,
    order_by,
    dir,
    parents_only,
  };
}
