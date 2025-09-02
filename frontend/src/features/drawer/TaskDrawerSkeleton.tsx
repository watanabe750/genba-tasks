// src/features/drawer/TaskDrawerSkeleton.tsx
import React from "react";

export default function TaskDrawerSkeleton() {
  return (
    <div className="p-4 animate-pulse">
      <div className="h-5 w-40 rounded bg-gray-200 mb-4" />
      <div className="space-y-2">
        <div className="h-4 w-5/6 rounded bg-gray-200" />
        <div className="h-4 w-3/5 rounded bg-gray-200" />
        <div className="h-4 w-4/5 rounded bg-gray-200" />
      </div>
    </div>
  );
}
