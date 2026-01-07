// src/components/LoadingFallback.tsx
import { memo } from "react";

const LoadingFallbackComponent = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 dark:text-gray-400">読み込み中...</p>
      </div>
    </div>
  );
};

export const LoadingFallback = memo(LoadingFallbackComponent);
