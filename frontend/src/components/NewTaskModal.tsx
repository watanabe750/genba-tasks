// src/components/NewTaskModal.tsx
import { useState, useRef, useEffect, useMemo, Fragment } from "react";
import { useCreateTask } from "../features/tasks/useCreateTask";
import { brandIso } from "../lib/brandIso";
import { useTasksFromUrl } from "../features/tasks/useTasks";
import useAuth from "../providers/useAuth";
import { toISOorNull } from "../utils/dateFormat";

const LAST_SITE_KEY = "genba-tasks:last-site";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function NewTaskModal({ isOpen, onClose }: Props) {
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

  // モーダルが開いたときに前回入力した現場名を読み込み
  useEffect(() => {
    if (isOpen) {
      try {
        const lastSite = localStorage.getItem(LAST_SITE_KEY);
        if (lastSite) {
          setSite(lastSite);
        }
      } catch {
        // localStorage が使えない環境では無視
      }
      // フォーカスを設定
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // 現場名のサジェスト候補
  const suggestions = useMemo(() => {
    if (!site) return existingSites;
    return existingSites.filter((s) =>
      s.toLowerCase().includes(site.toLowerCase())
    );
  }, [site, existingSites]);

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

  const handleClose = () => {
    setTitle("");
    setDeadline("");
    setShowSuggestions(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 animate-[fadeIn_0.2s_ease-out]"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-2xl bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl pointer-events-auto animate-[fadeIn_0.3s_ease-out]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 id="modal-title" className="text-lg font-bold text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sky-400 shadow-lg shadow-sky-400/50"></span>
              上位タスクを作成
            </h2>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-white transition-colors p-1"
              aria-label="閉じる"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form
            className="p-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div>
              <label htmlFor="task-title" className="block text-sm font-medium text-slate-300 mb-2">
                タイトル（必須）
              </label>
              <input
                id="task-title"
                ref={titleInputRef}
                data-testid="modal-task-title"
                className="w-full rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-slate-400 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400/50 transition-all backdrop-blur-sm font-medium"
                placeholder="タイトルを入力"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                autoComplete="off"
              />
            </div>

            <div>
              <label htmlFor="task-deadline" className="block text-sm font-medium text-slate-300 mb-2">
                期限
              </label>
              <input
                id="task-deadline"
                data-testid="modal-task-deadline"
                type="date"
                className="w-full rounded-xl border border-white/20 bg-white/10 text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400/50 transition-all backdrop-blur-sm font-medium [color-scheme:dark]"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            <div className="relative">
              <label htmlFor="task-site" className="block text-sm font-medium text-slate-300 mb-2">
                現場名（必須）
              </label>
              <input
                id="task-site"
                ref={siteInputRef}
                data-testid="modal-task-site"
                className="w-full rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-slate-400 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400/50 transition-all backdrop-blur-sm font-medium"
                placeholder="現場名を入力"
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

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                data-testid="modal-task-submit"
                className="group relative rounded-xl bg-gradient-to-r from-sky-400 via-emerald-300 to-emerald-500 px-6 py-2.5 text-sm font-bold text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-sky-500/30 hover:scale-105 active:scale-100 transition-all duration-300"
                disabled={!canSubmit}
                aria-disabled={!canSubmit}
              >
                <span className="relative z-10">作成</span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-400 to-sky-400 opacity-0 group-hover:opacity-100 transition-opacity blur-lg" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </Fragment>
  );
}
