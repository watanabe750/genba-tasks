import { usePriorityTasks } from "./usePriorityTasks";
import { Link } from "react-router-dom";

function formatDeadline(iso?: string | null) {
  if (!iso) return "期限なし";
  const d = new Date(iso);
  const w = ["日","月","火","水","木","金","土"][d.getDay()];
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

  return (
    <section className="bg-white rounded-2xl shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">今日の優先タスク</h2>
        <Link to="/tasks" className="text-sm underline">
          すべて見る
        </Link>
      </div>

      {isLoading && (
        <ul className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <li key={i} className="h-12 bg-gray-100 animate-pulse rounded" />
          ))}
        </ul>
      )}

      {isError && (
        <p className="text-sm text-red-600">読み込みに失敗しました</p>
      )}

      {data && data.length === 0 && (
        <p className="text-sm text-gray-500">優先タスクはありません</p>
      )}

      {data && data.length > 0 && (
        <ul className="space-y-3">
          {data.map((t) => (
            <li key={t.id} className="border rounded-xl p-3 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <Link to={`/tasks/${t.id}`} className="font-medium line-clamp-1">
                  {t.title}
                </Link>
                <DueBadge deadline={t.deadline} />
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {formatDeadline(t.deadline)} ・ 進捗 {t.progress}%
              </div>
              <div className="w-full bg-gray-200 h-2 rounded mt-2">
                <div
                  className="h-2 rounded bg-gray-700"
                  style={{ width: `${t.progress}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}