// src/features/drawer/TaskDrawer.tsx
import React, { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useTaskDrawer } from "./useTaskDrawer";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { useTaskDetail } from "../tasks/useTaskDetail";
import TaskDrawerSkeleton from "./TaskDrawerSkeleton";

const RootPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const el = useMemo(() => document.createElement("div"), []);
  useEffect(() => {
    document.body.appendChild(el);
    return () => {
      document.body.removeChild(el);
    };
  }, [el]);
  return createPortal(children, el);
};

export default function TaskDrawer() {
  const { openTaskId, close } = useTaskDrawer();
  const open = openTaskId != null;

  // body scroll lock
  useBodyScrollLock(open);

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  // 詳細データ（open時だけ）
  const { data, isLoading, isError, refetch } = useTaskDetail(openTaskId);

  // Escで閉じる
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  // オーバーレイクリックで閉じる（パネル外のみ）
  const onOverlayMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === overlayRef.current) {
      close();
    }
  };

  // フォーカストラップ（開いている間だけ）
  useFocusTrap(panelRef.current, open);

  if (!open) return null;

  const titleId = "task-drawer-title";
  const descId = "task-drawer-desc";

  return (
    <RootPortal>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[1000] bg-black/30"
        onMouseDown={onOverlayMouseDown}
        aria-hidden="true"
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="fixed inset-y-0 right-0 z-[1001] w-full max-w-[560px] bg-white shadow-xl outline-none"
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 id={titleId} className="text-base font-semibold">
            タスク詳細
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            aria-label="閉じる"
            className="rounded px-2 py-1 text-sm hover:bg-gray-100"
            onClick={close}
          >
            ✕
          </button>
        </div>

        {/* 本文 */}
        <div id={descId} className="min-h-[160px]">
          {isLoading && <TaskDrawerSkeleton />}

          {!isLoading && isError && (
            <div className="p-4 text-sm">
              <p className="mb-2 text-red-700">読み込みに失敗しました。</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded border px-3 py-1 text-xs"
                  onClick={() => refetch()}
                >
                  再試行
                </button>
                <button
                  type="button"
                  className="rounded border px-3 py-1 text-xs"
                  onClick={close}
                >
                  閉じる
                </button>
              </div>
            </div>
          )}

          {!isLoading && !isError && data && (
            <div className="p-4 text-sm text-gray-700">
              {/* ここは次ブランチ feat/drawer-content-basic で整える */}
              <div className="mb-3">
                <div className="text-lg font-semibold">{data.title}</div>
                <div className="text-xs text-gray-500">
                  site: {data.site ?? "—"} / 期限: {data.deadline ?? "—"}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                （この表示は仮。次ブランチで正式レイアウトに差し替え）
              </div>
            </div>
          )}
        </div>
      </aside>
    </RootPortal>
  );
}
