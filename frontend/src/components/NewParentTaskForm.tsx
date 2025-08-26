// src/components/NewParentTaskForm.tsx
import { useState } from "react";
import { useCreateTask } from "../features/tasks/useCreateTask";

const toISO = (v: string) => (v ? new Date(`${v}T00:00:00`).toISOString() : null);

export default function NewParentTaskForm() {
  const { mutate: create, isPending } = useCreateTask();
  const [title, setTitle] = useState("");
  const [site, setSite] = useState("");
  const [deadline, setDeadline] = useState("");

  return (
    <form
      className="mb-4 p-3 border rounded-xl"
      onSubmit={(e) => {
        e.preventDefault();
        const t = title.trim();
        const s = site.trim();
        if (!t || !s) return;
        create(
          { title: t, site: s, parentId: null, deadline: toISO(deadline) },
          { onSuccess: () => { setTitle(""); setSite(""); setDeadline(""); } }
        );
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-600 mb-1" htmlFor="parent-title">タイトル</label>
          <input
            id="parent-title"
            data-testid="new-parent-title"
            className="w-full border rounded p-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isPending}
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1" htmlFor="parent-site">現場名</label>
          <input
            id="parent-site"
            data-testid="new-parent-site"
            className="w-full border rounded p-2"
            value={site}
            onChange={(e) => setSite(e.target.value)}
            disabled={isPending}
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1" htmlFor="parent-deadline">期限</label>
          <input
            id="parent-deadline"
            data-testid="new-parent-deadline"
            type="date"
            className="w-full border rounded p-2"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            disabled={isPending}
          />
        </div>
        <div className="sm:col-span-3">
          <button
            type="submit"
            data-testid="new-parent-submit"
            className="px-3 py-1.5 rounded bg-gray-900 text-white disabled:opacity-60"
            disabled={isPending || !title.trim() || !site.trim()}
          >
            作成
          </button>
        </div>
      </div>
    </form>
  );
}
