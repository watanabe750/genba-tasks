import { useState } from "react";
import type { Attachment } from "../../types";

interface PhotoGalleryProps {
  photos: Attachment[];
  onDelete?: (attachmentId: number) => void;
  isDeleting?: boolean;
}

export function PhotoGallery({ photos, onDelete, isDeleting = false }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Attachment | null>(null);

  if (photos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="mt-2 text-sm">まだ写真がありません</p>
      </div>
    );
  }

  return (
    <>
      {/* グリッドレイアウト */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setSelectedPhoto(photo)}
          >
            {/* サムネイル画像 */}
            {photo.thumbnail_url ? (
              <img
                src={photo.thumbnail_url}
                alt={photo.title || "写真"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <svg
                  className="h-10 w-10 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}

            {/* オーバーレイ情報 */}
            {photo.title && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <p className="text-xs text-white truncate">{photo.title}</p>
              </div>
            )}

            {/* 削除ボタン */}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm("この写真を削除しますか？")) {
                    onDelete(photo.id);
                  }
                }}
                disabled={isDeleting}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-full p-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* モーダル (拡大表示) */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 閉じるボタン */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* 画像 */}
            <div className="max-h-[70vh] overflow-hidden">
              {selectedPhoto.url ? (
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.title || "写真"}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-64 bg-gray-100 dark:bg-gray-800">
                  <p className="text-gray-500 dark:text-gray-400">画像を読み込めません</p>
                </div>
              )}
            </div>

            {/* メタデータ */}
            <div className="p-4 space-y-2 max-h-[20vh] overflow-y-auto">
              {selectedPhoto.title && (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedPhoto.title}
                </h3>
              )}
              {selectedPhoto.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                  {selectedPhoto.description}
                </p>
              )}
              <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                {selectedPhoto.category && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                    {selectedPhoto.category}
                  </span>
                )}
                {selectedPhoto.size && (
                  <span>{(selectedPhoto.size / 1024 / 1024).toFixed(2)} MB</span>
                )}
                {selectedPhoto.created_at && (
                  <span>{new Date(selectedPhoto.created_at).toLocaleString("ja-JP")}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
