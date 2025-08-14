import { useState } from "react";
import { useUpdateTask } from "../tasks/useUpdateTask";
import { usePriorityTasks } from "./usePriorityTasks";
import { Link } from "react-router-dom";
import { devSignIn } from "../../../lib/devSignIn";

function formatDeadline(iso?: string | null) {
  if (!iso) return "期限なし";
  const d = new Date(iso);
  const w = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()}(${w})`;
}

function DueBadge({ deadline }: { deadline?: string | null }) {
  if (!deadline) return null;
  const now = new Date();
  const d = new Date(deadline);
  const diff = d.getTime() - now.getTime();
  if (diff < 0)
    return (
      <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">
        期限超過
      </span>
    );
  if (diff <= 24 * 60 * 60 * 1000)
    return (
      <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">
        締切間近
      </span>
    );
  return null;
}

export default function PriorityTasksPanel() {
  const { data, isLoading, isError } = usePriorityTasks();
  const items = data ?? [];
  const [pendingId, setPendingId] = useState<number | null>(null);
  const { mutate: updateTask } = useUpdateTask();
  const authed = !!localStorage.getItem("access-token");

  return (
    // ← 右カラム化：幅・境界線・独立スクロール
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">全体の優先タスク</h2>
        {/* 件数バッジ */}
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">
            {items.length}件
          </span>
          {!authed && (
            <button
              onClick={() => devSignIn()}
              className="text-xs px-2 py-1 rounded bg-gray-800 text-white"
            >
              開発用ログイン
            </button>
          )}
        </div>
      </div>

      {isLoading && (
        <ul className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <li key={i} className="h-12 bg-gray-100 animate-pulse rounded" />
          ))}
        </ul>
      )}

      {isError && (
        <p className="text-sm text-red-600">読み込みに失敗しました</p>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <p className="text-sm text-gray-500">優先タスクはありません</p>
      )}

      {!isLoading && !isError && items.length > 0 && (
        <ul className="space-y-3">
          {items.map((t) => {
            const progress = t.progress ?? 0;
            const disabled = pendingId === t.id;

            return (
              <li
                key={t.id}
                className={`border rounded-xl p-3 hover:bg-gray-50 ${
                  disabled ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <Link
                    to={`/tasks/${t.id}`}
                    className="font-medium line-clamp-1"
                  >
                    {t.title}
                  </Link>
                  <div className="flex items-center gap-2">
                    <DueBadge deadline={t.deadline} />

                    {/* ✔ 完了チェック（JSX整形＆行単位disable） */}
                    <label className="inline-flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={t.status === "completed"}
                        disabled={disabled}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setPendingId(t.id);
                          const checked = e.target.checked;
                          updateTask(
                            {
                              id: t.id,
                              data: checked
                                ? { status: "completed", progress: 100 }
                                : {
                                    status: "in_progress",
                                    progress: Math.min(progress, 99),
                                  },
                            },
                            {
                              onSettled: () => setPendingId(null),
                            } // 成否に関わらず解除
                          );
                        }}
                      />
                      <span>完了</span>
                    </label>
                  </div>
                </div>

                <div className="text-xs text-gray-600 mt-1">
                  {formatDeadline(t.deadline)} ・ 進捗 {progress}%
                </div>

                <div className="w-full bg-gray-200 h-2 rounded mt-2">
                  <div
                    className="h-2 rounded bg-gray-700"
                    style={{
                      width: `${Math.min(Math.max(progress, 0), 100)}%`,
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* 補助リンク（任意） */}
      <div className="mt-4 text-right">
        <Link to="/tasks" className="text-xs underline text-gray-700">
          タスク一覧へ
        </Link>
      </div>
    </div>
  );
}
