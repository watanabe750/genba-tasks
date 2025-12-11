import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { OrderBy, SortDir, Status } from "../../types";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

const allStatuses: Status[] = ["not_started", "in_progress", "completed"];

export function TaskFilterBar() {
  const [sp, setSp] = useSearchParams();

  const order_by = (sp.get("order_by") as OrderBy) ?? "deadline";
  const dir = (sp.get("dir") as SortDir) ?? "asc";
  const parents_only = sp.get("parents_only") === "1";
  const status = sp.getAll("status") as Status[];
  const progress_min = sp.get("progress_min") ?? "";
  const progress_max = sp.get("progress_max") ?? "";

  // 検索機能
  const searchFromUrl = sp.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  // デバウンス後の検索値をURLに反映
  useEffect(() => {
    if (debouncedSearch !== searchFromUrl) {
      updateSearchParams((draft) => {
        if (debouncedSearch === "") {
          draft.delete("search");
        } else {
          draft.set("search", debouncedSearch);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const filterChips = useMemo(() => {
    const chips: JSX.Element[] = [];
    if (searchFromUrl) {
      chips.push(<span key="search" className="px-3 py-1 text-[11px] rounded-full bg-rose-400/20 text-rose-700 dark:text-rose-200 border border-rose-400/30 font-medium backdrop-blur-sm">検索: {searchFromUrl}</span>);
    }
    if (status.length) {
      const label = status
        .map((s) => (s === "not_started" ? "未着手" : s === "in_progress" ? "進行中" : "完了"))
        .join(" , ");
      chips.push(<span key="status" className="px-3 py-1 text-[11px] rounded-full bg-sky-400/20 text-sky-700 dark:text-sky-200 border border-sky-400/30 font-medium backdrop-blur-sm">status: {label}</span>);
    }
    if (parents_only) chips.push(<span key="parents" className="px-3 py-1 text-[11px] rounded-full bg-purple-400/20 text-purple-700 dark:text-purple-200 border border-purple-400/30 font-medium backdrop-blur-sm">上位タスクのみ</span>);
    if (progress_min || progress_max) {
      chips.push(
        <span key="progress" className="px-3 py-1 text-[11px] rounded-full bg-amber-400/20 text-amber-700 dark:text-amber-200 border border-amber-400/30 font-medium backdrop-blur-sm">
          progress: {progress_min || 0}–{progress_max || 100}
        </span>
      );
    }
    return chips;
  }, [searchFromUrl, status, parents_only, progress_min, progress_max]);

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
      {/* 検索ボックス */}
      <div className="mb-3">
        <div className="relative">
          <input
            type="text"
            placeholder="タスク・現場を検索... (タイトル・説明文・現場名)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400/50 transition-all shadow-sm"
            data-testid="search-input"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
              aria-label="検索をクリア"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 見出し＋絞り込み状況／件数表示／全解除 */}
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex items-center gap-2 flex-wrap">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white shrink-0">フィルター &amp; 並び替え</h2>
          <span aria-hidden className="hidden sm:inline h-4 w-px bg-gray-300 dark:bg-white/20 mx-1" />
          <span className="text-xs text-gray-600 dark:text-slate-400 shrink-0">絞り込み：</span>
          <div className="min-w-0 flex items-center gap-1 flex-wrap">
            {filterChips.length ? filterChips : <span className="text-xs text-gray-500 dark:text-slate-500">なし</span>}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-medium underline decoration-sky-600/30 dark:decoration-sky-400/30 hover:decoration-sky-700/50 dark:hover:decoration-sky-300/50 underline-offset-2 transition-colors"
            data-testid="filter-reset"
            onClick={() => setSp({}, { replace: true })}
          >
            すべて解除
          </button>
        </div>
      </div>

      {/* 本体：12カラム（横一列 / 等間隔気味の割り当て） */}
      <div className="w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/90 backdrop-blur-md px-4 py-3 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* 1) ステータス（4） */}
          <div className="sm:col-span-4 flex justify-start min-w-0">
            <div role="group" aria-label="ステータスで絞り込み" className="inline-flex rounded-full bg-gray-100 dark:bg-slate-700/80 p-1 flex-nowrap whitespace-nowrap backdrop-blur-sm">
              {allStatuses.map((s) => {
                const active = status.includes(s);
                const label = s === "not_started" ? "未着手" : s === "in_progress" ? "進行中" : "完了";
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleStatus(s)}
                    className={["px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs rounded-full transition-all font-medium", active ? "bg-gradient-to-r from-sky-400 to-emerald-400 text-slate-900 shadow-lg" : "text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600 hover:text-gray-900 dark:hover:text-slate-100"].join(" ")}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2) 進捗（3） */}
          <div className="sm:col-span-3 text-xs text-gray-700 dark:text-slate-200">
            <label className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className="shrink-0 font-medium">進捗</span>
              <div className="flex items-center gap-2">
                <input type="number" min={0} max={100} step={1} data-testid="progress-min" className="w-full sm:w-16 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-400 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/50 backdrop-blur-sm" value={progress_min} onChange={onChangeProgress("progress_min")} placeholder="min" />
                <span className="shrink-0 text-gray-500 dark:text-slate-400">–</span>
                <input type="number" min={0} max={100} step={1} data-testid="progress-max" className="w-full sm:w-16 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-400 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/50 backdrop-blur-sm" value={progress_max} onChange={onChangeProgress("progress_max")} placeholder="max" />
              </div>
            </label>
          </div>

          {/* 3) 上位タスクのみ（2） */}
          <div className="sm:col-span-2 flex items-center justify-start">
            <label className="inline-flex items-center gap-2 text-sm whitespace-nowrap text-gray-700 dark:text-slate-200 font-medium cursor-pointer hover:text-gray-900 dark:hover:text-slate-100 transition-colors" title="上位タスク（親）だけを表示">
              <input type="checkbox" checked={parents_only} onChange={toggleParentsOnly} className="accent-sky-400 w-4 h-4 rounded cursor-pointer" data-testid="filter-parents-only" />
              <span>上位のみ</span>
            </label>
          </div>

          {/* 4) 並び基準（2） */}
          <div className="sm:col-span-2 flex justify-start">
            <select data-testid="order_by" className="w-full max-w-[9rem] rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/50 backdrop-blur-sm font-medium cursor-pointer" value={order_by} onChange={(e) => setOrDelete("order_by", e.target.value)}>
              <option value="deadline" className="bg-white dark:bg-slate-800">期限</option>
              <option value="progress" className="bg-white dark:bg-slate-800">進捗</option>
              <option value="created_at" className="bg-white dark:bg-slate-800">作成日</option>
            </select>
          </div>

          {/* 5) 昇降（1） */}
          <div className="sm:col-span-1 flex justify-start">
            <select data-testid="dir" className="w-full max-w-[7rem] rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/50 backdrop-blur-sm font-medium cursor-pointer" value={dir} onChange={(e) => setOrDelete("dir", e.target.value)}>
              <option value="asc" className="bg-white dark:bg-slate-800">昇順</option>
              <option value="desc" className="bg-white dark:bg-slate-800">降順</option>
            </select>
          </div>
        </div>
      </div>
    </section>
  );
}
