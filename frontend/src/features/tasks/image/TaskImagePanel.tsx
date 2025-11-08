// src/features/tasks/image/TaskImagePanel.tsx
import { useEffect, useRef, useState } from "react";
import api from "../../../lib/apiClient";
import { useQueryClient } from "@tanstack/react-query";

type Props = { taskId: number };
type ShowResponse = {
  image_url: string | null;
  image_thumb_url: string | null;
};

const MAX_MB = 5;
const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function TaskImagePanel({ taskId }: Props) {
  const [data, setData] = useState<ShowResponse>({
    image_url: null,
    image_thumb_url: null,
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const qc = useQueryClient();

  const qk = ["taskDetail", taskId] as const;

  const fetchShow = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.get(`/tasks/${taskId}`);
      const json = res.data;
      setData({
        image_url: json.image_url ?? null,
        image_thumb_url: json.image_thumb_url ?? null,
      });
      // ✨ 取得結果をその場でキャッシュに反映（一覧のサムネが即時更新される）
      qc.setQueryData(qk as unknown as readonly unknown[], (old: any) =>
        old
          ? {
              ...old,
              image_url: json.image_url ?? null,
              image_thumb_url: json.image_thumb_url ?? null,
            }
          : old
      );
      return json;
    } catch (e: any) {
      setErr(e?.message || "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const invalidateDetail = () =>
    qc.invalidateQueries({ queryKey: qk as unknown as readonly unknown[] });

  const onPick = () => fileRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setErr(null);

    if (!ACCEPT.includes(f.type)) {
      setErr("許可形式: jpeg/png/webp/gif");
      e.target.value = "";
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setErr(`ファイルサイズは${MAX_MB}MB以下にしてください`);
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", f, f.name);
      // apiClient 側インターセプタで multipart の Content-Type 自動付与
      await api.post(`/tasks/${taskId}/image`, fd);
      await Promise.all([fetchShow(), invalidateDetail()]);
    } catch (e: any) {
      const msg =
        e?.response?.data?.errors?.join?.("、") ||
        e?.message ||
        "アップロードに失敗しました";
      setErr(msg);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onDelete = async () => {
    if (!confirm("画像を削除しますか？")) return;
    setUploading(true);
    setErr(null);
    try {
      await api.delete(`/tasks/${taskId}/image`);
      await Promise.all([fetchShow(), invalidateDetail()]);
    } catch (e: any) {
      const msg =
        e?.response?.data?.errors?.join?.("、") ||
        e?.message ||
        "削除に失敗しました";
      setErr(msg);
    } finally {
      setUploading(false);
    }
  };

  const hasImage = !!data.image_url;

  return (
    <div
      className="mt-2 rounded-md border p-3 bg-white"
      data-testid={`image-panel-${taskId}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">画像</h3>
        <div className="space-x-2">
          <button
            data-testid="btn-pick"
            type="button"
            className="rounded bg-gray-900 px-2 py-1 text-xs text-white disabled:opacity-60"
            onClick={onPick}
            disabled={uploading || loading}
            title="画像を選択してアップロード"
          >
            {hasImage ? "画像を変更" : "画像を追加"}
          </button>
          {hasImage && (
            <button
              data-testid="btn-delete"
              type="button"
              className="rounded border px-2 py-1 text-xs disabled:opacity-60"
              onClick={onDelete}
              disabled={uploading || loading}
            >
              削除
            </button>
          )}
          <input
            data-testid="image-file"
            ref={fileRef}
            type="file"
            accept={ACCEPT.join(",")}
            className="hidden"
            onChange={onFileChange}
          />
        </div>
      </div>

      {err && (
        <div data-testid="img-error" className="mb-2 rounded bg-red-50 px-2 py-1 text-xs text-red-700">
          {err}
        </div>
      )}

      {loading ? (
        <div className="text-xs text-gray-500">読み込み中…</div>
      ) : hasImage ? (
        <div className="flex items-start gap-3">
          <img
            src={data.image_thumb_url || data.image_url!}
            alt="サムネイル"
            className="h-24 w-24 rounded object-cover ring-1 ring-gray-200"
          />
          <a
            href={data.image_url!}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-700 underline"
          >
            元画像を開く
          </a>
        </div>
      ) : (
        <div className="text-xs text-gray-600">画像は未設定です。</div>
      )}

      <p className="mt-2 text-[11px] text-gray-500">
        許可形式: jpeg/png/webp/gif、サイズ: {MAX_MB}MB以下
      </p>
    </div>
  );
}
