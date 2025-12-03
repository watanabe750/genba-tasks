import { useState } from "react";
import type { GalleryFilters as GalleryFiltersType } from "../../types";

interface GalleryFiltersProps {
  filters: GalleryFiltersType;
  onFiltersChange: (filters: GalleryFiltersType) => void;
  sites: string[];
  categories: string[];
}

export function GalleryFilters({
  filters,
  onFiltersChange,
  sites,
  categories,
}: GalleryFiltersProps) {
  const [localFilters, setLocalFilters] = useState<GalleryFiltersType>(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
  };

  const handleReset = () => {
    const resetFilters: GalleryFiltersType = {
      page: 1,
      per_page: filters.per_page || 50,
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">フィルタ</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 現場フィルタ */}
        <div>
          <label htmlFor="filter-site" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            現場
          </label>
          <select
            id="filter-site"
            value={localFilters.site || ""}
            onChange={(e) => setLocalFilters({ ...localFilters, site: e.target.value || undefined, page: 1 })}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">すべて</option>
            {sites.map((site) => (
              <option key={site} value={site}>
                {site}
              </option>
            ))}
          </select>
        </div>

        {/* カテゴリフィルタ */}
        <div>
          <label htmlFor="filter-category" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            カテゴリ
          </label>
          <select
            id="filter-category"
            value={localFilters.category || ""}
            onChange={(e) => setLocalFilters({ ...localFilters, category: e.target.value || undefined, page: 1 })}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">すべて</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* 日付範囲 */}
        <div>
          <label htmlFor="filter-date-from" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            期間開始
          </label>
          <input
            type="date"
            id="filter-date-from"
            value={localFilters.date_from || ""}
            onChange={(e) => setLocalFilters({ ...localFilters, date_from: e.target.value || undefined, page: 1 })}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="filter-date-to" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            期間終了
          </label>
          <input
            type="date"
            id="filter-date-to"
            value={localFilters.date_to || ""}
            onChange={(e) => setLocalFilters({ ...localFilters, date_to: e.target.value || undefined, page: 1 })}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* ボタン */}
      <div className="flex gap-2">
        <button
          onClick={handleApply}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          適用
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm font-medium rounded-md transition-colors"
        >
          リセット
        </button>
      </div>
    </div>
  );
}
