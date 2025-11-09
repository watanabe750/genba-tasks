// src/components/NewParentTaskForm.tsx
import { useState, useRef, useEffect, useMemo } from "react";
import { useCreateTask } from "../features/tasks/useCreateTask";
import { brandIso } from "../lib/brandIso";
import { useTasksFromUrl } from "../features/tasks/useTasks";
import useAuth from "../providers/useAuth";

const toISOorNull = (v: string): string | null =>
  v ? new Date(`${v}T00:00:00`).toISOString() : null;

const LAST_SITE_KEY = "genba-tasks:last-site";

export default function NewParentTaskForm() {
  const { mutate: create, isPending } = useCreateTask();
  const { authed } = useAuth();
  const DEMO = import.meta.env.VITE_DEMO_MODE === "true";
  const enabled = authed || DEMO;

  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [site, setSite] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const siteInputRef = useRef<HTMLInputElement>(null);

  // 既存タスクから現場名を取得
  const { data: tasks = [] } = useTasksFromUrl(enabled);
  const existingSites = useMemo(() => {
    const sites = new Set<string>();
    tasks.forEach((task) => {
      if (task.site && task.site.trim()) {
        sites.add(task.site.trim());
      }
    });
    return Array.from(sites).sort();
  }, [tasks]);

  // 前回入力した現場名を読み込み
  useEffect(() => {
    try {
      const lastSite = localStorage.getItem(LAST_SITE_KEY);
      if (lastSite) {
        setSite(lastSite);
      }
    } catch {
      // localStorage が使えない環境では無視
    }
  }, []);

  // 現場名のサジェスト候補
  const suggestions = useMemo(() => {
    if (!site) return existingSites;
    return existingSites.filter((s) =>
      s.toLowerCase().includes(site.toLowerCase())
    );
  }, [site, existingSites]);

  // ★ 親（上位）タスクは site 必須（テストの期待仕様）
  const canSubmit = title.trim().length > 0 && site.trim().length > 0 && !isPending;

  const submit = () => {
    if (!canSubmit) return;

    // 現場名をlocalStorageに保存
    try {
      localStorage.setItem(LAST_SITE_KEY, site.trim());
    } catch {
      // localStorage が使えない環境では無視
    }

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
          // 現場名は維持して次のタスクも同じ現場で追加しやすくする
          // setSite(""); は削除
          setShowSuggestions(false);
          // タイトル入力欄にフォーカスを戻す（連続入力のため）
          titleInputRef.current?.focus();
        },
      }
    );
  };

  const selectSuggestion = (suggestion: string) => {
    setSite(suggestion);
    setShowSuggestions(false);
    siteInputRef.current?.focus();
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
        <div className="flex items-center gap-2 text-xs text-blue-700/70 dark:text-blue-300/70">
          <span>💡 Enterで連続追加</span>
        </div>
      </div>

      <form
        className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr,160px,160px,auto]"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input
          ref={titleInputRef}
          data-testid="new-parent-title"
          aria-label="タイトル"
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
          aria-label="期限"
          className="w-full rounded border px-3 py-2"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />

        <div className="relative">
          <input
            ref={siteInputRef}
            data-testid="new-parent-site"
            aria-label="現場名"
            className="w-full rounded border px-3 py-2"
            placeholder="現場名（必須）"
            value={site}
            onChange={(e) => setSite(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            autoComplete="off"
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full rounded border bg-white shadow-lg max-h-40 overflow-y-auto">
              {suggestions.slice(0, 5).map((suggestion, idx) => (
                <li
                  key={idx}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                  onClick={() => selectSuggestion(suggestion)}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          data-testid="new-parent-submit"
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 hover:bg-blue-700 transition-colors"
          disabled={!canSubmit}
          aria-disabled={!canSubmit}
          title="上位タスクを作成（Enter）"
        >
          作成
        </button>
      </form>
    </section>
  );
}
