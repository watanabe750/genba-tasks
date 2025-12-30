// src/components/NewParentTaskForm.tsx
import { useState, useRef, useEffect, useMemo } from "react";
import { useCreateTask } from "../features/tasks/useCreateTask";
import { brandIso } from "../lib/brandIso";
import { useTasksFromUrl } from "../features/tasks/useTasks";
import useAuth from "../providers/useAuth";
import { toISOorNull } from "../utils/dateFormat";

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
      className="rounded-2xl border border-white/20 bg-gradient-to-br from-sky-500/15 via-emerald-500/10 to-sky-500/15 backdrop-blur-md shadow-2xl p-4 animate-[fadeIn_0.8s_ease-out]"
      aria-label="上位タスクを作成"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold text-white text-base flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-sky-400 shadow-lg shadow-sky-400/50"></span>
          上位タスクを作成
        </h2>
        <div className="flex items-center gap-2 text-xs text-sky-200 font-medium">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm border border-white/15">
            <span className="text-sky-300">⚡</span>
            Enterで連続追加
          </span>
        </div>
      </div>

      <form
        className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr,160px,160px,auto]"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input
          ref={titleInputRef}
          data-testid="new-parent-title"
          aria-label="タイトル"
          className="w-full rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-slate-400 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400/50 transition-all backdrop-blur-sm font-medium"
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
          className="w-full rounded-xl border border-white/20 bg-white/10 text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400/50 transition-all backdrop-blur-sm font-medium [color-scheme:dark]"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />

        <div className="relative">
          <input
            ref={siteInputRef}
            data-testid="new-parent-site"
            aria-label="現場名"
            className="w-full rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-slate-400 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400/50 transition-all backdrop-blur-sm font-medium"
            placeholder="現場名（必須）"
            value={site}
            onChange={(e) => setSite(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            autoComplete="off"
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-10 mt-2 w-full rounded-xl border border-white/20 bg-slate-900/95 backdrop-blur-xl shadow-2xl max-h-40 overflow-y-auto">
              {suggestions.slice(0, 5).map((suggestion, idx) => (
                <li
                  key={idx}
                  className="px-4 py-2.5 hover:bg-sky-500/20 cursor-pointer text-sm text-white font-medium transition-colors border-b border-white/10 last:border-b-0"
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
          className="group relative rounded-xl bg-gradient-to-r from-sky-400 via-emerald-300 to-emerald-500 px-6 py-2.5 text-sm font-bold text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-sky-500/30 hover:scale-105 active:scale-100 transition-all duration-300"
          disabled={!canSubmit}
          aria-disabled={!canSubmit}
          title="上位タスクを作成（Enter）"
        >
          <span className="relative z-10">作成</span>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-400 to-sky-400 opacity-0 group-hover:opacity-100 transition-opacity blur-lg" />
        </button>
      </form>
    </section>
  );
}
