// src/components/NewParentTaskForm.tsx
import { useState } from "react";
import { useCreateTask } from "../features/tasks/useCreateTask";
import { brandIso } from "../lib/brandIso";

const toISOorNull = (v: string): string | null =>
  v ? new Date(`${v}T00:00:00`).toISOString() : null;

export default function NewParentTaskForm() {
  const { mutate: create, isPending } = useCreateTask();
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [site, setSite] = useState("");

  // ★ 親（上位）タスクは site 必須（テストの期待仕様）
  const canSubmit = title.trim().length > 0 && site.trim().length > 0 && !isPending;

  const submit = () => {
    if (!canSubmit) return;
    create(
      {
        title: title.trim(),
        parentId: null,
        deadline: brandIso(toISOorNull(deadline)),
        site: site.trim(),
      },
      {
        onSuccess: () => {
          setTitle("");
          setDeadline("");
          setSite("");
        },
      }
    );
  };

  return (
    <section
      data-testid="new-parent-form"
      className={[
        "rounded-xl border border-blue-300 bg-blue-50/60",
        "shadow-sm p-3 dark:border-blue-600 dark:bg-blue-950/20",
      ].join(" ")}
      aria-label="上位タスクを作成"
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold text-blue-700 dark:text-blue-300">上位タスクを作成</h2>
        <span className="text-xs text-blue-700/70 dark:text-blue-300/70">Enterで作成</span>
      </div>

      <form
        className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr,160px,160px,auto]"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input
          data-testid="new-parent-title"
          aria-label="タイトル"                              // ★ 追加
          className="w-full rounded border px-3 py-2"
          placeholder="タイトル（必須）"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
              e.preventDefault();
              submit();
            }
          }}
          autoComplete="off"
          autoFocus
        />

        <input
          data-testid="new-parent-deadline"
          type="date"
          aria-label="期限"                                 // ★ 追加
          className="w-full rounded border px-3 py-2"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />

        <input
          data-testid="new-parent-site"
          aria-label="現場名"                                // ★ 追加
          className="w-full rounded border px-3 py-2"
          placeholder="現場名（必須）"                       // ★ 変更
          value={site}
          onChange={(e) => setSite(e.target.value)}
          autoComplete="off"
        />

        <button
          data-testid="new-parent-submit"
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={!canSubmit}
          aria-disabled={!canSubmit}
          title="上位タスクを作成"
        >
          作成
        </button>
      </form>
    </section>
  );
}
