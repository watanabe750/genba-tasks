// src/features/drawer/TaskDrawer.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import ImagePreview from "./ImagePreviewList";
import { useToast } from "../../components/ToastProvider";
import { PhotoUploader, PhotoGallery, useAttachments, useUploadPhoto, useDeletePhoto } from "../attachments";
import TaskChildForm from "./TaskChildForm";

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

/** ラッパー：開いてないときは本体をマウントしない（フック順が安定） */
export default function TaskDrawer() {
  const { openTaskId, openSection, close } = useTaskDrawer();
  const open = openTaskId != null;

  // スクロールロックは開いているときだけ効かせる
  useBodyScrollLock(open);

  if (!open) return null;
  return (
    <TaskDrawerInner
      taskId={openTaskId!}
      openSection={openSection}
      close={close}
    />
  );
}

/** 本体（ここにフックを集約） */
function TaskDrawerInner({
  taskId,
  openSection,
  close,
}: {
  taskId: number;
  openSection: "image" | null;
  close: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const { data, isLoading, isError, error, refetch } = useTaskDetail(taskId);
  const { push: toast } = useToast();

  // 写真管理用
  const [showPhotoUploader, setShowPhotoUploader] = useState(false);
  const { data: photos = [], isLoading: photosLoading } = useAttachments(taskId);
  const { mutateAsync: uploadPhoto, isPending: uploading } = useUploadPhoto();
  const { mutateAsync: deletePhoto, isPending: deleting } = useDeletePhoto();

  // Escで閉じる
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  // 401連動：ログアウト時に閉じる
  useEffect(() => {
    const onLogout = () => close();
    window.addEventListener("auth:logout", onLogout as EventListener);
    return () => window.removeEventListener("auth:logout", onLogout as EventListener);
  }, [close]);

  // オーバーレイクリック（外側のみ）
  const onOverlayMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === overlayRef.current) close();
  };

  // フォーカストラップ
  useFocusTrap(panelRef.current, true);

  // エラーUX：404→自動クローズ、401→クローズ、5xx→開いたまま再試行
  useEffect(() => {
    if (!isError) return;
    const err = error as { response?: { status?: number }; status?: number } | null;
    const status = err?.response?.status ?? err?.status ?? null;

    if (status === 404) {
      toast("タスクが見つかりません", "error");
      close();
    } else if (status === 401) {
      toast("セッションが切れました。再ログインしてください", "error");
      close();
    } else {
      toast("サーバーエラー。再試行してください", "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isError, error]);

  const titleId = "task-drawer-title";
  const descId = "task-drawer-desc";

  // セーフティ
  const prog = Math.max(
    0,
    Math.min(100, Math.round(data?.progress_percent ?? 0))
  );
  const preview = data?.children_preview ?? [];
  const grandkids =
    typeof data?.grandchildren_count === "number"
      ? data!.grandchildren_count
      : 0;

  // 画像関連
  const imageUrl = data?.image_url ?? null;
  const imageThumbUrl = data?.image_thumb_url ?? null;

  // 画像セクションを要求されたらスクロール
  useEffect(() => {
    if (openSection !== "image") return;
    const el = document.getElementById("drawer-image-section");
    if (el)
      setTimeout(
        () => el.scrollIntoView({ behavior: "smooth", block: "center" }),
        0
      );
  }, [openSection, imageUrl]);

  return (
    <RootPortal>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[1000] bg-black/30"
        onMouseDown={onOverlayMouseDown}
        aria-hidden="true"
      />
      <aside
        data-testid="task-drawer"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="fixed inset-y-0 right-0 z-[1001] w-full max-w-[560px] bg-white dark:bg-gray-800 shadow-xl outline-none"
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <h2 id={titleId} className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">
            {data?.title ?? "タスク詳細"}
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            aria-label="閉じる"
            className="rounded px-2 py-1 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
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
              <p className="mb-2 text-red-700 dark:text-red-400">読み込みに失敗しました。</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1 text-xs hover:bg-gray-50 dark:hover:bg-gray-600"
                  onClick={() => refetch()}
                >
                  再試行
                </button>
                <button
                  type="button"
                  className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1 text-xs hover:bg-gray-50 dark:hover:bg-gray-600"
                  onClick={close}
                >
                  閉じる
                </button>
              </div>
            </div>
          )}

          {!isLoading && !isError && data && (
            <div className="p-4 text-sm text-gray-800 dark:text-gray-200">
              {/* 1行目：ステータス + 進捗％ */}
              <div className="mb-3 flex items-center gap-2">
                <StatusPill status={data.status} />
                <span className="text-xs text-gray-600 dark:text-gray-400">進捗: {prog}%</span>
              </div>

              {/* 進捗バー */}
              <div className="mb-4">
                <ProgressBar value={prog} data-testid="drawer-progress" />
              </div>

              {/* 2行目：site / deadline */}
              <div className="mb-3 grid grid-cols-1 gap-3 text-[13px] sm:grid-cols-2">
                <div>
                  <div className="text-gray-500 dark:text-gray-400">現場名</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{data.site ?? "—"}</div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">期限</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {toYmd(data.deadline) ?? "未設定"}
                  </div>
                </div>
              </div>

              {/* 説明欄 */}
              {data.description && (
                <div className="mb-4 rounded-md bg-gray-50 dark:bg-gray-900 p-3">
                  <div className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                    説明
                  </div>
                  <div className="whitespace-pre-wrap text-[13px] text-gray-800 dark:text-gray-200">
                    {data.description}
                  </div>
                </div>
              )}

              {/* 3行目：子サマリ */}
              <div className="mb-3 text-[13px]">
                <span className="text-gray-500 dark:text-gray-400">子タスク</span>{" "}
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  完了 {data.children_done_count}/{data.children_count}
                </span>
              </div>

              {/* 直下の子プレビュー（最大4件）＆孫件数 */}
              <ChildPreviewList
                items={preview}
                grandchildrenCount={grandkids}
              />

              {/* 子タスク作成フォーム */}
              <TaskChildForm taskId={taskId} onSuccess={refetch} />

              {/* 画像（存在時のみ / サムネ優先表示） */}
              {imageUrl && (
                <div
                  className="mt-4"
                  id="drawer-image-section"
                  data-testid="drawer-image-section"
                >
                  <ImagePreview
                    url={imageUrl}
                    thumbUrl={imageThumbUrl ?? undefined}
                    title={data.title}
                  />
                </div>
              )}

              {/* 写真管理セクション */}
              <div className="mt-6 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    写真 ({photos.length})
                  </h3>
                  <button
                    onClick={() => setShowPhotoUploader(!showPhotoUploader)}
                    className="text-xs px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    {showPhotoUploader ? "閉じる" : "写真を追加"}
                  </button>
                </div>

                {/* アップローダー */}
                {showPhotoUploader && (
                  <div className="mb-4">
                    <PhotoUploader
                      onUpload={async (file, metadata) => {
                        await uploadPhoto({
                          taskId,
                          file,
                          title: metadata.title,
                          description: metadata.description,
                          category: metadata.category,
                        });
                        setShowPhotoUploader(false);
                      }}
                    />
                  </div>
                )}

                {/* ギャラリー */}
                {photosLoading ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p className="text-sm">読み込み中...</p>
                  </div>
                ) : (
                  <PhotoGallery
                    photos={Array.isArray(photos) ? photos : []}
                    onDelete={async (attachmentId) => {
                      await deletePhoto({ taskId, attachmentId });
                    }}
                    isDeleting={deleting}
                  />
                )}
              </div>

              {/* 監査情報 */}
              <div className="mt-4 grid grid-cols-1 gap-3 text-[12px] text-gray-600 dark:text-gray-400 sm:grid-cols-2">
                <div>
                  作成者:{" "}
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {data.created_by_name}
                  </span>
                </div>
                <div>
                  作成日:{" "}
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {toYmd(data.created_at) ?? "—"}
                  </span>
                </div>
                <div>
                  更新日:{" "}
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {toYmd(data.updated_at) ?? "—"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </RootPortal>
  );
}
