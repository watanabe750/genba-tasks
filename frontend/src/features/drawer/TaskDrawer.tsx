// src/features/drawer/TaskDrawer.tsx
import React, { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useTaskDrawer } from "./useTaskDrawer";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { useTaskDetail } from "../tasks/useTaskDetail";
import TaskDrawerSkeleton from "./TaskDrawerSkeleton";
import StatusPill from "../../components/StatusPill";
import ProgressBar from "../../components/ProgressBar";
import { toYmd } from "../../utils/date";
import ChildPreviewList from "./ChildPreviewList";
import ImagePreview from "./ImagePreview";

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

  useBodyScrollLock(open);

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const { data, isLoading, isError, refetch } = useTaskDetail(openTaskId);

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

  const onOverlayMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === overlayRef.current) {
      close();
    }
  };

  useFocusTrap(panelRef.current, open);

  if (!open) return null;

  const titleId = "task-drawer-title";
  const descId = "task-drawer-desc";

  // --- セーフティ（undefined/null を吸収） ---
  const prog = Math.max(0, Math.min(100, Math.round(data?.progress_percent ?? 0)));
  const preview = data?.children_preview ?? [];
  const grandkids = typeof data?.grandchildren_count === "number" ? data!.grandchildren_count : 0;
  const imageUrl = data?.image_url ?? null;

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
        {/* ヘッダー（accessible name はタスク名） */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 id={titleId} className="truncate text-base font-semibold">
            {data?.title ?? "タスク詳細"}
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
            <div className="p-4 text-sm text-gray-800">
              {/* 1行目：ステータス + 進捗％ */}
              <div className="mb-3 flex items-center gap-2">
                <StatusPill status={data.status} />
                <span className="text-xs text-gray-600">進捗: {prog}%</span>
              </div>

              {/* 進捗バー */}
              <div className="mb-4">
                <ProgressBar value={prog} data-testid="drawer-progress" />
              </div>

              {/* 2行目：site / deadline */}
              <div className="mb-3 grid grid-cols-2 gap-3 text-[13px]">
                <div>
                  <div className="text-gray-500">site</div>
                  <div className="font-medium">{data.site ?? "—"}</div>
                </div>
                <div>
                  <div className="text-gray-500">期限</div>
                  <div className="font-medium">{toYmd(data.deadline) ?? "未設定"}</div>
                </div>
              </div>

              {/* 3行目：子サマリ */}
              <div className="mb-3 text-[13px]">
                <span className="text-gray-500">子タスク</span>{" "}
                <span className="font-medium">
                  完了 {data.children_done_count}/{data.children_count}
                </span>
              </div>

              {/* 直下の子プレビュー（最大4件）＆孫件数 */}
              <ChildPreviewList items={preview} grandchildrenCount={grandkids} />

              {/* 画像（存在時のみ） */}
              {imageUrl && (
                <div className="mt-4">
                  <ImagePreview url={imageUrl} title={data.title} />
                </div>
              )}

              {/* 監査情報 */}
              <div className="mt-4 grid grid-cols-2 gap-3 text-[12px] text-gray-600">
                <div>
                  作成者:{" "}
                  <span className="font-medium text-gray-800">{data.created_by_name}</span>
                </div>
                <div>
                  作成日:{" "}
                  <span className="font-medium text-gray-800">{toYmd(data.created_at) ?? "—"}</span>
                </div>
                <div>
                  更新日:{" "}
                  <span className="font-medium text-gray-800">{toYmd(data.updated_at) ?? "—"}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </RootPortal>
  );
}
