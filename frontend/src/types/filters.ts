export type OrderBy = "deadline" | "progress" | "created_at";
export type SortDir = "asc" | "desc";

export type TaskFilters = {
  site?: string;
  status?: Array<"not_started" | "in_progress" | "completed">;
  progress_min?: number;
  progress_max?: number;
  order_by: OrderBy;
  dir: SortDir;
  parents_only?: "1";
};
