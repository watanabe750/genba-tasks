// src/features/tasks/TaskFilterBar.tsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSites } from "./useTasks";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

const ALL_STATUS = ["not_started", "in_progress", "completed"] as const;
type Status = typeof ALL_STATUS[number];

const toArray = (v: string | string[] | null): string[] =>
  v == null ? [] : Array.isArray(v) ? v : [v];

export function TaskFilterBar() {
  const [sp, setSp] = useSearchParams();
  const { data: sites = [] } = useSites(true);

  // URL → 初期状態
  const initial = useMemo(() => {
    const status = sp.getAll("status");
    return {
      site: sp.get("site") ?? "",
      status: status.length ? (status as Status[]) : ([] as Status[]),
      progress_min: sp.get("progress_min") ?? "",
      progress_max: sp.get("progress_max") ?? "",
      order_by: (sp.get("order_by") ?? "deadline") as
        | "deadline"
        | "progress"
        | "created_at",
      dir: (sp.get("dir") ?? "asc") as "asc" | "desc",
      parents_only: sp.get("parents_only") === "1",
    };
  }, [sp]);

  const [site, setSite] = useState(initial.site);
  const [status, setStatus] = useState<Status[]>(initial.status);
  const [progressMin, setProgressMin] = useState(initial.progress_min);
  const [progressMax, setProgressMax] = useState(initial.progress_max);
  const [orderBy, setOrderBy] = useState(initial.order_by);
  const [dir, setDir] = useState<"asc" | "desc">(initial.dir);
  const [parentsOnly, setParentsOnly] = useState(initial.parents_only);

  // 変更 → 300ms debounce → URL同期
  const debounced = useDebouncedValue(
    { site, status, progressMin, progressMax, orderBy, dir, parentsOnly },
    300
  );

  useEffect(() => {
    const next = new URLSearchParams();

    if (debounced.site.trim()) next.set("site", debounced.site.trim());
    debounced.status.forEach((s) => next.append("status", s));
    if (debounced.progressMin !== "")
      next.set("progress_min", String(debounced.progressMin));
    if (debounced.progressMax !== "")
      next.set("progress_max", String(debounced.progressMax));
    if (debounced.orderBy) next.set("order_by", debounced.orderBy);
    if (debounced.dir) next.set("dir", debounced.dir);
    if (debounced.parentsOnly) next.set("parents_only", "1");

    setSp(next, { replace: true });
  }, [debounced, setSp]);

  const toggleStatus = (s: Status) =>
    setStatus((cur) =>
      cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]
    );

  const reset = () => {
    setSite("");
    setStatus([]);
    setProgressMin("");
    setProgressMax("");
    setOrderBy("deadline");
    setDir("asc");
    setParentsOnly(false);
  };

  return (
    <div className="mb-4 rounded-xl border p-3 bg-white/60 dark:bg-zinc-900/40">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">フィルター</h3>
        <button
          type="button"
          onClick={reset}
          className="text-sm underline decoration-dotted"
          aria-label="フィルタをクリア"
        >
          クリア
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* site */}
        <label className="block text-sm">
          <span className="block text-xs text-gray-500 mb-1">現場</span>
          <input
            list="site-options"
            className="w-full rounded border px-2 py-1"
            value={site}
            onChange={(e) => setSite(e.target.value)}
            placeholder="現場名で絞り込み"
          />
          <datalist id="site-options">
            {sites.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>

        {/* status */}
        <div className="text-sm">
          <div className="text-xs text-gray-500 mb-1">ステータス</div>
          <div className="flex gap-3">
            {ALL_STATUS.map((s) => (
              <label key={s} className="inline-flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={status.includes(s)}
                  onChange={() => toggleStatus(s)}
                />
                <span className="capitalize">
                  {s === "not_started"
                    ? "未着手"
                    : s === "in_progress"
                    ? "進行中"
                    : "完了"}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* parents_only */}
        <label className="inline-flex items-center gap-2 text-sm mt-5 md:mt-0">
          <input
            type="checkbox"
            checked={parentsOnly}
            onChange={(e) => setParentsOnly(e.target.checked)}
          />
          親タスクのみ
        </label>

        {/* progress */}
        <div className="text-sm">
          <div className="text-xs text-gray-500 mb-1">進捗(%)</div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              className="w-20 rounded border px-2 py-1"
              value={progressMin}
              onChange={(e) => setProgressMin(e.target.value)}
              placeholder="最小"
            />
            <span>〜</span>
            <input
              type="number"
              min={0}
              max={100}
              className="w-20 rounded border px-2 py-1"
              value={progressMax}
              onChange={(e) => setProgressMax(e.target.value)}
              placeholder="最大"
            />
          </div>
        </div>

        {/* order_by / dir */}
        <div className="text-sm">
          <div className="text-xs text-gray-500 mb-1">並び替え</div>
          <div className="flex gap-2">
            <select
              className="rounded border px-2 py-1"
              value={orderBy}
              onChange={(e) =>
                setOrderBy(e.target.value as "deadline" | "progress" | "created_at")
              }
            >
              <option value="deadline">期限</option>
              <option value="progress">進捗</option>
              <option value="created_at">作成日時</option>
            </select>
            <select
              className="rounded border px-2 py-1"
              value={dir}
              onChange={(e) => setDir(e.target.value as "asc" | "desc")}
            >
              <option value="asc">昇順</option>
              <option value="desc">降順</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
