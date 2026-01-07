// frontend/src/components/ConfirmPopover.tsx
import { useEffect, useRef } from "react";

type Props = {
  text?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmPopover({ text = "このタスクを削除しますか？", onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // 外側クリックで閉じる
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onCancel();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [onCancel]);

  // 初期フォーカス
  useEffect(() => { cancelRef.current?.focus(); }, []);

  // Escキーで閉じる
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      className="absolute z-50 mt-2 w-72 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-lg"
    >
      <p className="text-sm text-gray-800 dark:text-gray-200">{text}</p>
      <div className="mt-3 flex justify-end gap-2">
        <button
          ref={cancelRef}
          type="button"
          className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200"
          onClick={onCancel}
        >
          キャンセル
        </button>
        <button
          type="button"
          className="px-3 py-1.5 rounded bg-red-600 text-white text-sm hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
          onClick={onConfirm}
        >
          削除
        </button>
      </div>
    </div>
  );
}
