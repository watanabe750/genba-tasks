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
    return out;
  }, [order_by, dir, status, site, parents_only]);

  // --- 操作ユーティリティ ---
  const setOrDelete = (key: string, value: string | null) => {
    if (value == null || value === "") sp.delete(key);
    else sp.set(key, value);
    setSp(sp, { replace: true });
  };

  const toggleParentsOnly = () => {
    if (parents_only) sp.delete("parents_only");
    else sp.set("parents_only", "1");
    setSp(sp, { replace: true });
  };

  const toggleStatus = (s: Status) => {
    const cur = new Set(sp.getAll("status"));
    if (cur.has(s)) cur.delete(s);
    else cur.add(s);
    sp.delete("status");
    [...cur].forEach((v) => sp.append("status", v));
    setSp(sp, { replace: true });
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
          {/* 左：現場名（コンパクト） */}
          <div className="col-span-3">
            <input
              data-testid="filter-site"
              placeholder="現場名"
              className="w-full rounded border px-2 py-1 text-sm"
              value={site}
              onChange={(e) => setOrDelete("site", e.target.value)}
            />
          </div>

          {/* 中央：ステータス（セグメント三連ボタン） */}
          <div className="col-span-6 flex justify-center">
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
          </div>

          {/* 右：上位タスクのみ + 並び替え（右寄せ） */}
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
