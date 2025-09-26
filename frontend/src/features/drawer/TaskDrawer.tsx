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
import { useCreateTask } from "../tasks/useCreateTask";
import { brandIso } from "../../lib/brandIso";

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
  // 子タスク作成用のローカル状態
  const [childTitle, setChildTitle] = useState("");
  const [childDue, setChildDue] = useState<string>(""); // YYYY-MM-DD
  const { mutateAsync: createTask, isPending: creating } = useCreateTask();

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
    window.addEventListener("auth:logout", onLogout as any);
    return () => window.removeEventListener("auth:logout", onLogout as any);
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
    const status =
      (error as any)?.response?.status ?? (error as any)?.status ?? null;

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
        className="fixed inset-y-0 right-0 z-[1001] w-full max-w-[560px] bg-white shadow-xl outline-none"
      >
        {/* ヘッダー */}
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
                  <div className="text-gray-500">現場名</div>
                  <div className="font-medium">{data.site ?? "—"}</div>
                </div>
                <div>
                  <div className="text-gray-500">期限</div>
                  <div className="font-medium">
                    {toYmd(data.deadline) ?? "未設定"}
                  </div>
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
              <ChildPreviewList
                items={preview}
                grandchildrenCount={grandkids}
              />

              {/* 子タスク作成（タイトル＋期限） */}
              <div className="mt-3 rounded-md border p-3">
                <div className="mb-2 text-[13px] text-gray-500">
                  子タスクを作成
                </div>
                <div className="flex items-center gap-2">
                  <input
                    className="input input-bordered flex-1"
                    placeholder="子タスク名（必須）"
                    value={childTitle}
                    onChange={(e) => setChildTitle(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter" && childTitle.trim()) {
                        try {
                          await createTask({
                            title: childTitle.trim(),
                            parentId: taskId,
                            deadline: brandIso(childDue || undefined), // APIは deadline を受け付ける
                          });
                          setChildTitle("");
                          setChildDue("");
                          // ドロワー内の情報を更新（子プレビュー/カウント）
                          refetch();
                        } catch (err: any) {
                          toast(err?.message ?? "作成に失敗しました", "error");
                        }
                      }
                    }}
                    aria-label="子タスク名"
                  />
                  <input
                    type="date"
                    className="input input-bordered w-40"
                    value={childDue}
                    onChange={(e) => setChildDue(e.target.value)}
                    aria-label="期限"
                  />
                  <button
                    className="btn btn-primary"
                    onClick={async () => {
                      if (!childTitle.trim()) return;
                      try {
                        await createTask({
                          title: childTitle.trim(),
                          parentId: taskId,
                          deadline: brandIso(childDue || undefined),
                        });
                        setChildTitle("");
                        setChildDue("");
                        refetch();
                      } catch (err: any) {
                        toast(err?.message ?? "作成に失敗しました", "error");
                      }
                    }}
                    disabled={!childTitle.trim() || creating}
                  >
                    作成
                  </button>
                </div>
              </div>

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

              {/* 監査情報 */}
              <div className="mt-4 grid grid-cols-2 gap-3 text-[12px] text-gray-600">
                <div>
                  作成者:{" "}
                  <span className="font-medium text-gray-800">
                    {data.created_by_name}
                  </span>
                </div>
                <div>
                  作成日:{" "}
                  <span className="font-medium text-gray-800">
                    {toYmd(data.created_at) ?? "—"}
                  </span>
                </div>
                <div>
                  更新日:{" "}
                  <span className="font-medium text-gray-800">
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
