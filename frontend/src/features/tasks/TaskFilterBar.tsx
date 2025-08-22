import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useSites } from "./useSites";
import { readSiteHistory } from "../../lib/siteHistory";

const STATUSES = ["not_started", "in_progress", "completed"] as const;

export function TaskFilterBar() {
  const [sp, setSp] = useSearchParams();
  const { data: serverSites = [] } = useSites(true);
  const localSites = readSiteHistory();
  const siteOptions = Array.from(
    new Set([...localSites, ...serverSites])
  ).slice(0, 50);

  const filters = useMemo(
    () => ({
      site: sp.get("site") || "",
      status: sp.getAll("status"),
      progress_min: Number(sp.get("progress_min") ?? "0"),
      progress_max: Number(sp.get("progress_max") ?? "100"),
      order_by: (sp.get("order_by") ?? "deadline") as
        | "deadline"
        | "progress"
        | "created_at",
      dir: (sp.get("dir") ?? "asc") as "asc" | "desc",
    }),
    [sp]
  );

  const patch = (
    obj: Record<string, string | string[] | number | undefined>
  ) => {
    const curr = Object.fromEntries(sp.entries());
    const next: Record<string, string> = { ...curr };

    Object.entries(obj).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        // 一旦削除して複数値を入れ直す
        delete next[k];
      } else if (v === "" || v === undefined) {
        delete next[k];
      } else {
        next[k] = String(v);
      }
    });

    const nextSp = new URLSearchParams(next);
    Object.entries(obj).forEach(([k, v]) => {
      if (Array.isArray(v)) v.forEach((val) => nextSp.append(k, val));
    });
    setSp(nextSp, { replace: false });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 border rounded-xl">
      <input
        className="border rounded px-2 py-1"
        placeholder="現場名(site)"
        list="site-options"
        value={filters.site}
        onChange={(e) => patch({ site: e.target.value })}
      />
      <datalist id="site-options">
        {siteOptions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={filters.parents_only === "1"}
          onChange={(e) =>
            patch({ parents_only: e.target.checked ? "1" : undefined })
          }
        />
        親タスクのみ
      </label>

      <label className="flex items-center gap-2">
        進捗 {filters.progress_min}%–{filters.progress_max}%
        <input
          type="number"
          min={0}
          max={100}
          value={filters.progress_min}
          onChange={(e) => patch({ progress_min: Number(e.target.value) })}
          className="w-16 border rounded px-1 py-0.5"
        />
        <input
          type="number"
          min={0}
          max={100}
          value={filters.progress_max}
          onChange={(e) => patch({ progress_max: Number(e.target.value) })}
          className="w-16 border rounded px-1 py-0.5"
        />
      </label>

      <div className="flex items-center gap-2">
        {STATUSES.map((s) => {
          const on = filters.status.includes(s);
          return (
            <button
              key={s}
              className={`px-2 py-1 rounded border ${on ? "font-bold" : ""}`}
              onClick={() => {
                const set = new Set(filters.status);
                on ? set.delete(s) : set.add(s);
                patch({ status: Array.from(set) });
              }}
            >
              {s}
            </button>
          );
        })}
      </div>

      <select
        value={`${filters.order_by}:${filters.dir}`}
        onChange={(e) => {
          const [order_by, dir] = e.target.value.split(":");
          patch({ order_by, dir });
        }}
        className="border rounded px-2 py-1"
      >
        <option value="deadline:asc">期限 ↑</option>
        <option value="deadline:desc">期限 ↓</option>
        <option value="progress:asc">進捗 ↑</option>
        <option value="progress:desc">進捗 ↓</option>
        <option value="created_at:desc">新着 ↓</option>
        <option value="created_at:asc">新着 ↑</option>
      </select>
    </div>
  );
}
