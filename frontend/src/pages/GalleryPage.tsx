import { useState, useMemo } from "react";
import { useGallery, GalleryFilters, PhotoGallery } from "../features/attachments";
import { useSites } from "../features/tasks/useSites";
import type { GalleryFilters as GalleryFiltersType } from "../types";

export default function GalleryPage() {
  const [filters, setFilters] = useState<GalleryFiltersType>({
    page: 1,
    per_page: 50,
  });

  const { data, isLoading, isError } = useGallery(filters);
  const { data: sites = [] } = useSites();

  // カテゴリ一覧を写真データから抽出
  const categories = useMemo(() => {
    if (!data?.attachments) return [];
    const uniqueCategories = new Set<string>();
    data.attachments.forEach((attachment) => {
      if (attachment.category) {
        uniqueCategories.add(attachment.category);
      }
    });
    return Array.from(uniqueCategories).sort();
  }, [data]);

  const handleFiltersChange = (newFilters: GalleryFiltersType) => {
    setFilters({ ...newFilters, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 一括ダウンロード
  const handleBulkDownload = async () => {
    if (!data?.attachments || data.attachments.length === 0) return;

    const confirmed = window.confirm(
      `現在のフィルタ条件の写真 ${data.pagination.total_count} 件をダウンロードしますか？`
    );

    if (!confirmed) return;

    // 各写真を個別にダウンロード
    for (const attachment of data.attachments) {
      if (!attachment.url) continue;

      try {
        const response = await fetch(attachment.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = attachment.filename || `photo-${attachment.id}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        // ダウンロード間隔を空ける（ブラウザの制限対策）
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to download ${attachment.filename}:`, error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">写真ギャラリー</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            全タスクの写真を一覧表示します
          </p>
        </div>

        {/* フィルタ */}
        <div className="mb-6">
          <GalleryFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            sites={sites}
            categories={categories}
          />
        </div>

        {/* 結果表示 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          {/* ツールバー */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {data && (
                <>
                  {data.pagination.total_count} 件中 {data.attachments.length} 件を表示
                </>
              )}
            </div>
            {data && data.attachments.length > 0 && (
              <button
                onClick={handleBulkDownload}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                一括ダウンロード
              </button>
            )}
          </div>

          {/* ローディング */}
          {isLoading && (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500 dark:text-gray-400">読み込み中...</p>
            </div>
          )}

          {/* エラー */}
          {isError && (
            <div className="text-center py-12">
              <p className="text-sm text-red-600 dark:text-red-400">
                読み込みに失敗しました
              </p>
            </div>
          )}

          {/* ギャラリー */}
          {!isLoading && !isError && data && (
            <>
              <PhotoGallery photos={data.attachments} />

              {/* ページネーション */}
              {data.pagination.total_count > data.pagination.per_page && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <button
                    onClick={() => handlePageChange(data.pagination.current_page - 1)}
                    disabled={data.pagination.current_page === 1}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    前へ
                  </button>

                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {data.pagination.current_page} /{" "}
                    {Math.ceil(data.pagination.total_count / data.pagination.per_page)}
                  </span>

                  <button
                    onClick={() => handlePageChange(data.pagination.current_page + 1)}
                    disabled={
                      data.pagination.current_page ===
                      Math.ceil(data.pagination.total_count / data.pagination.per_page)
                    }
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    次へ
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
