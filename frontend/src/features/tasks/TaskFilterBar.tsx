import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { OrderBy, SortDir, Status } from "../../types";

type Props = { summary?: string };

const allStatuses: Status[] = ["not_started", "in_progress", "completed"];

export function TaskFilterBar({ summary }: Props) {
  const [sp, setSp] = useSearchParams();

  const site = sp.get("site") ?? "";
  const order_by = (sp.get("order_by") as OrderBy) ?? "deadline";
  const dir = (sp.get("dir") as SortDir) ?? "asc";
  const parents_only = sp.get("parents_only") === "1";
  const status = sp.getAll("status") as Status[];
  const progress_min = sp.get("progress_min") ?? "";
  const progress_max = sp.get("progress_max") ?? "";

  const filterChips = useMemo(() => {
    const chips: JSX.Element[] = [];
    if (status.length) {
      const label = status
        .map((s) => (s === "not_started" ? "未着手" : s === "in_progress" ? "進行中" : "完了"))
        .join(" , ");
      chips.push(<span key="status" className="px-2 py-0.5 text-[11px] rounded-full bg-gray-100">status: {label}</span>);
    }
    if (site) chips.push(<span key="site" className="px-2 py-0.5 text-[11px] rounded-full bg-gray-100">site: {site}</span>);
    if (parents_only) chips.push(<span key="parents" className="px-2 py-0.5 text-[11px] rounded-full bg-gray-100">上位タスクのみ</span>);
    if (progress_min || progress_max) {
      chips.push(
        <span key="progress" className="px-2 py-0.5 text-[11px] rounded-full bg-gray-100">
          progress: {progress_min || 0}–{progress_max || 100}
        </span>
      );
    }
    return chips;
  }, [status, site, parents_only, progress_min, progress_max]);

  const updateSearchParams = (mutate: (draft: URLSearchParams) => void) => {
    const next = new URLSearchParams(sp);
    mutate(next);
    setSp(next, { replace: true });
  };
  const setOrDelete = (key: string, value: string | null) => {
    updateSearchParams((draft) => {
      if (value == null || value === "") draft.delete(key);
      else draft.set(key, value);
    });
  };
  const toggleParentsOnly = () => {
    updateSearchParams((draft) => {
      if (draft.get("parents_only") === "1") draft.delete("parents_only");
      else draft.set("parents_only", "1");
    });
  };
  const toggleStatus = (s: Status) => {
    updateSearchParams((draft) => {
      const cur = new Set(draft.getAll("status"));
      if (cur.has(s)) cur.delete(s);
      else cur.add(s);
      draft.delete("status");
      for (const v of cur) draft.append("status", v);
    });
  };
  const onChangeProgress =
    (key: "progress_min" | "progress_max") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === "") return setOrDelete(key, "");
      const n = Math.max(0, Math.min(100, Number(raw)));
      setOrDelete(key, String(n));
    };

  return (
    <section className="mb-4" data-testid="filter-bar">
      {/* 見出し＋絞り込み状況／件数表示／全解除 */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0 flex items-center gap-2 flex-wrap">
          <h2 className="text-sm font-medium text-gray-700 shrink-0">フィルター &amp; 並び替え</h2>
          <span aria-hidden className="h-4 w-px bg-gray-300/70 mx-1" />
          <span className="text-xs text-gray-500 shrink-0">絞り込み：</span>
          <div className="min-w-0 flex items-center gap-1 flex-wrap">
            {filterChips.length ? filterChips : <span className="text-xs text-gray-400">なし</span>}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {summary && <span className="text-xs text-gray-600">{summary}</span>}
          <button
            type="button"
            className="text-xs text-gray-600 underline decoration-dotted"
            data-testid="filter-reset"
            onClick={() => setSp({}, { replace: true })}
          >
            すべて解除
          </button>
        </div>
      </div>

      {/* 本体：12カラム（横一列 / 等間隔気味の割り当て） */}
      <div className="w-full rounded-xl border bg-white px-3 py-2">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* 1) 現場名（3） */}
          <div className="sm:col-span-3">
            <input
              data-testid="filter-site"
              placeholder="現場名"
              className="w-full rounded border px-2 py-1 text-sm"
              value={site}
              onChange={(e) => setOrDelete("site", e.target.value)}
            />
          </div>

          {/* 2) ステータス（3） */}
          <div className="sm:col-span-3 flex justify-start min-w-0">
            <div role="group" aria-label="ステータスで絞り込み" className="inline-flex rounded-full bg-gray-100 p-1 flex-nowrap whitespace-nowrap">
              {allStatuses.map((s) => {
                const active = status.includes(s);
                const label = s === "not_started" ? "未着手" : s === "in_progress" ? "進行中" : "完了";
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleStatus(s)}
                    className={["px-3 py-1 text-xs rounded-full transition", active ? "bg-white shadow border" : "text-gray-600 hover:bg-white/70"].join(" ")}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3) 進捗（2） */}
          <div className="sm:col-span-2 flex items-center justify-start text-xs text-gray-600">
            <label className="flex items-center gap-2">
              <span>進捗</span>
              <input type="number" min={0} max={100} step={1} data-testid="progress-min" className="w-16 rounded border px-2 py-1" value={progress_min} onChange={onChangeProgress("progress_min")} placeholder="min" />
              <span>–</span>
              <input type="number" min={0} max={100} step={1} data-testid="progress-max" className="w-16 rounded border px-2 py-1" value={progress_max} onChange={onChangeProgress("progress_max")} placeholder="max" />
            </label>
          </div>

          {/* 4) 上位タスクのみ（2） */}
          <div className="sm:col-span-2 flex items-center justify-start">
            <label className="inline-flex items-center gap-1 text-sm whitespace-nowrap" title="上位タスク（親）だけを表示">
              <input type="checkbox" checked={parents_only} onChange={toggleParentsOnly} className="accent-blue-600" data-testid="filter-parents-only" />
              <span>上位タスクのみ</span>
            </label>
          </div>

          {/* 5) 並び基準（1） */}
          <div className="sm:col-span-1 flex justify-start">
            <select data-testid="order_by" className="w-full max-w-[9rem] rounded border px-2 py-1 text-sm" value={order_by} onChange={(e) => setOrDelete("order_by", e.target.value)}>
              <option value="deadline">期限</option>
              <option value="progress">進捗</option>
              <option value="created_at">作成日</option>
            </select>
          </div>

          {/* 6) 昇降（1） */}
          <div className="sm:col-span-1 flex justify-start">
            <select data-testid="dir" className="w-full max-w-[7rem] rounded border px-2 py-1 text-sm" value={dir} onChange={(e) => setOrDelete("dir", e.target.value)}>
              <option value="asc">昇順</option>
              <option value="desc">降順</option>
            </select>
          </div>
        </div>
      </div>
    </section>
  );
}
