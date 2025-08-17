import { useState } from "react";
import { useCreateTask } from "../features/tasks/useCreateTask";

export default function NewTaskButton() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const { mutate: createTask, isPending } = useCreateTask();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    createTask(
      { title: t, description: desc.trim() || undefined },
      {
        onSuccess: () => {
          setTitle("");
          setDesc("");
          setOpen(false);
        },
      }
    );
  };

  return (
    <>
      <button
        type="button"
        className="px-3 py-1.5 rounded bg-gray-900 text-white text-sm"
        onClick={() => setOpen(true)}
      >
        新規タスク
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
          <form
            onSubmit={onSubmit}
            className="bg-white rounded-2xl shadow p-4 w-full max-w-md space-y-3"
          >
            <h2 className="font-semibold">タスクを作成</h2>

            <div>
              <label htmlFor="new-title" className="block text-sm mb-1">
                タイトル
              </label>
              <input
                id="new-title"
                className="w-full border rounded p-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                minLength={1}
              />
            </div>

            <div>
              <label htmlFor="new-desc" className="block text-sm mb-1">
                説明（任意）
              </label>
              <textarea
                id="new-desc"
                className="w-full border rounded p-2"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded border"
                onClick={() => setOpen(false)}
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-3 py-1.5 rounded bg-gray-900 text-white disabled:opacity-60"
              >
                {isPending ? "作成中..." : "作成"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
