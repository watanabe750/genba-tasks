// TaskCard.tsx
import { demoImageStore } from "../lib/demoImageStore";

type Task = {
  id: number;
  title: string;
  dueDate: string;
  status: string;
  // parent_id?: number | null; // あれば親判定に使える（任意）
};

type Props = {
  task: Task;
  onToggleComplete: (id: number) => void;
};

const TaskCard = ({ task, onToggleComplete }: Props) => {
  const isCompleted = task.status === "completed";
  const imgSrc = demoImageStore.get(task.id); // ★ ここで取り出す（親だけ画像が入ってる）

  return (
    <div className="border rounded p-4 shadow-sm bg-white mb-4">
      {/* ★ 画像（あれば表示、なければ何も出さない） */}
      {imgSrc && (
        <img
          src={imgSrc}
          alt=""
          className="w-full h-40 object-cover rounded mb-3"
          referrerPolicy="no-referrer"
        />
      )}

      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">{task.title}</h2>
        <label className="inline-flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={() => onToggleComplete(task.id)}
            className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
          />
          完了
        </label>
      </div>

      <p className="text-sm text-gray-600">期限: {task.dueDate}</p>
      <p className="text-sm text-gray-600">
        ステータス: {isCompleted ? "完了" : "未完了"}
      </p>
    </div>
  );
};

export default TaskCard;
