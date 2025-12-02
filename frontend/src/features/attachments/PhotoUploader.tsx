import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

interface PhotoUploaderProps {
  onUpload: (file: File, metadata: { title?: string; description?: string; category?: string }) => Promise<void>;
  maxSize?: number; // バイト単位 (デフォルト: 10MB)
}

export function PhotoUploader({ onUpload, maxSize = 10 * 1024 * 1024 }: PhotoUploaderProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setError(null);
      setUploading(true);

      try {
        await onUpload(file, {
          title: title || undefined,
          description: description || undefined,
          category: category || undefined,
        });

        // アップロード成功後にフォームをリセット
        setTitle("");
        setDescription("");
        setCategory("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "アップロードに失敗しました");
      } finally {
        setUploading(false);
      }
    },
    [onUpload, title, description, category]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxSize,
    maxFiles: 1,
    multiple: false,
  });

  return (
    <div className="space-y-4">
      {/* ドロップゾーン */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${
            isDragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-gray-400 dark:hover:border-gray-500"
          }
          ${uploading ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} disabled={uploading} />
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {uploading ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">アップロード中...</p>
          ) : isDragActive ? (
            <p className="text-sm text-blue-600 dark:text-blue-400">ここにドロップしてください</p>
          ) : (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                クリックして写真を選択、またはドラッグ&ドロップ
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PNG, JPG, GIF, WEBP (最大{(maxSize / 1024 / 1024).toFixed(0)}MB)
              </p>
            </>
          )}
        </div>
      </div>

      {/* エラー表示 */}
      {(error || fileRejections.length > 0) && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">エラー</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                {error && <p>{error}</p>}
                {fileRejections.map(({ file, errors }) => (
                  <div key={file.name}>
                    {errors.map((e) => (
                      <p key={e.code}>
                        {e.code === "file-too-large"
                          ? `ファイルサイズが大きすぎます (最大${(maxSize / 1024 / 1024).toFixed(0)}MB)`
                          : e.code === "file-invalid-type"
                          ? "サポートされていないファイル形式です"
                          : e.message}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* メタデータ入力フォーム */}
      <div className="space-y-3">
        <div>
          <label htmlFor="photo-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            タイトル (任意)
          </label>
          <input
            type="text"
            id="photo-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="例: 基礎工事完了"
            disabled={uploading}
          />
        </div>

        <div>
          <label htmlFor="photo-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            説明 (任意)
          </label>
          <textarea
            id="photo-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="写真の詳細説明を入力..."
            disabled={uploading}
          />
        </div>

        <div>
          <label htmlFor="photo-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            カテゴリ (任意)
          </label>
          <input
            type="text"
            id="photo-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="例: 基礎工事"
            disabled={uploading}
          />
        </div>
      </div>
    </div>
  );
}
