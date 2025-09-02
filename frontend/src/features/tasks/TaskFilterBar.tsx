// src/features/tasks/TaskFilterBar.tsx
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { OrderBy, SortDir, Status } from "../../types";

const allStatuses: Status[] = ["not_started", "in_progress", "completed"];

export function TaskFilterBar() {
  const [sp, setSp] = useSearchParams();

  // --- クエリ同期 ---
  const site = sp.get("site") ?? "";
  const order_by = (sp.get("order_by") as OrderBy) ?? "deadline";
  const dir = (sp.get("dir") as SortDir) ?? "asc";
  const parents_only = sp.get("parents_only") === "1";
  const status = sp.getAll("status") as Status[];
  // ★ 進捗レンジ（未指定は空文字扱い）
  const progress_min = sp.get("progress_min") ?? "";
  const progress_max = sp.get("progress_max") ?? "";

  // 表示中のチップ
  const chips = useMemo(() => {
    const out: JSX.Element[] = [];
    if (order_by || dir) {
      out.push(
        <span key="sort" className="px-2 py-1 text-xs rounded-full bg-gray-100">
          sort: {order_by} / {dir}
        </span>
      );
    }
    if (status.length) {
      const label = status
        .map((s) => (s === "not_started" ? "未着手" : s === "in_progress" ? "進行中" : "完了"))
        .join(" , ");
      out.push(
        <span key="status" className="px-2 py-1 text-xs rounded-full bg-gray-100">
          status: {label}
        </span>
      );
    }
    if (site) {
      out.push(
        <span key="site" className="px-2 py-1 text-xs rounded-full bg-gray-100">
          site: {site}
        </span>
      );
    }
    if (parents_only) {
      out.push(
        <span key="parents" className="px-2 py-1 text-xs rounded-full bg-gray-100">
          上位タスクのみ
        </span>
      );
    }
    if (progress_min || progress_max) {
      out.push(
        <span key="progress" className="px-2 py-1 text-xs rounded-full bg-gray-100">
          progress: {progress_min || 0}–{progress_max || 100}
        </span>
      );
    }
    return out;
  }, [order_by, dir, status, site, parents_only, progress_min, progress_max]);

  // --- URLSearchParams を毎回“新しいインスタンス”で更新 ---
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

  // ★ 0..100 クランプしながら set/delete
  const onChangeProgress = (key: "progress_min" | "progress_max") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === "") return setOrDelete(key, "");
      const n = Math.max(0, Math.min(100, Number(raw)));
      setOrDelete(key, String(n));
    };

  return (
    <section className="mb-4" data-testid="filter-bar">
      {/* 上段：チップ + 全解除 */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {chips.length ? (
          <>
            {chips}
            <button
              type="button"
              className="ml-2 text-xs text-gray-600 underline decoration-dotted"
              data-testid="filter-reset"
              onClick={() => setSp({}, { replace: true })}
            >
              すべて解除
            </button>
          </>
        ) : (
          <span className="text-xs text-gray-500">条件なし</span>
        )}
      </div>

      {/* 下段：横幅いっぱい、中央にステータス、右端に上位タスクのみ・並び替え */}
      <div className="w-full rounded-xl border bg-white px-3 py-2">
        <div className="grid grid-cols-12 items-center gap-2">
          {/* 左：現場名 */}
          <div className="col-span-3">
            <input
              data-testid="filter-site"
              placeholder="現場名"
              className="w-full rounded border px-2 py-1 text-sm"
              value={site}
              onChange={(e) => setOrDelete("site", e.target.value)}
            />
          </div>

          {/* 中央：ステータス + 進捗レンジ */}
          <div className="col-span-6 flex flex-col items-center gap-2">
            <div
              role="group"
              aria-label="ステータスで絞り込み"
              className="inline-flex rounded-full bg-gray-100 p-1"
            >
              {allStatuses.map((s) => {
                const active = status.includes(s);
                const label =
                  s === "not_started" ? "未着手" : s === "in_progress" ? "進行中" : "完了";
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleStatus(s)}
                    className={[
                      "px-3 py-1 text-xs rounded-full transition",
                      active ? "bg-white shadow border" : "text-gray-600 hover:bg-white/70",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* ★ 進捗レンジ UI */}
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <label className="flex items-center gap-1">
                <span>進捗</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  data-testid="progress-min"
                  className="w-16 rounded border px-2 py-1"
                  value={progress_min}
                  onChange={onChangeProgress("progress_min")}
                  placeholder="min"
                />
                <span>–</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  data-testid="progress-max"
                  className="w-16 rounded border px-2 py-1"
                  value={progress_max}
                  onChange={onChangeProgress("progress_max")}
                  placeholder="max"
                />
              </label>
            </div>
          </div>

          {/* 右：上位タスクのみ + 並び替え */}
          <div className="col-span-3 flex items-center justify-end gap-2 flex-nowrap">
            <label
              className="inline-flex items-center gap-1 text-sm whitespace-nowrap shrink-0"
              title="上位タスク（親）だけを表示"
            >
              <input
                type="checkbox"
                checked={parents_only}
                onChange={toggleParentsOnly}
                className="accent-blue-600"
                data-testid="filter-parents-only"
              />
              <span>上位タスクのみ</span>
            </label>

            <select
              data-testid="order_by"
              className="w-28 rounded border px-2 py-1 text-sm"
              value={order_by}
              onChange={(e) => setOrDelete("order_by", e.target.value)}
            >
              <option value="deadline">期限</option>
              <option value="progress">進捗</option>
              <option value="created_at">作成日</option>
            </select>

            <select
              data-testid="dir"
              className="w-20 rounded border px-2 py-1 text-sm"
              value={dir}
              onChange={(e) => setOrDelete("dir", e.target.value)}
            >
              <option value="asc">昇順</option>
              <option value="desc">降順</option>
            </select>
          </div>
        </div>
      </div>
    </section>
  );
}
