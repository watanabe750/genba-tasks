// utils/highlightText.tsx - テキスト内のキーワードをハイライト表示

import type { ReactNode } from "react";

/**
 * テキスト内の検索キーワードをハイライト表示
 * @param text - ハイライトするテキスト
 * @param query - 検索キーワード
 * @returns ハイライト済みのReactNode
 */
export function highlightText(text: string, query: string): ReactNode {
  if (!query || !text) {
    return text;
  }

  // スペース区切りで複数キーワードを抽出
  const keywords = query
    .trim()
    .split(/\s+/)
    .filter((k) => k.length > 0);

  if (keywords.length === 0) {
    return text;
  }

  // 全キーワードを含む正規表現を作成（大文字小文字を区別しない）
  const pattern = keywords.map((k) => escapeRegExp(k)).join("|");
  const regex = new RegExp(`(${pattern})`, "gi");

  // テキストを分割してハイライト
  const parts = text.split(regex);

  return parts.map((part, index) => {
    // キーワードに一致する部分をハイライト
    const isMatch = keywords.some(
      (k) => k.toLowerCase() === part.toLowerCase()
    );

    if (isMatch) {
      return (
        <mark
          key={index}
          className="bg-yellow-200 dark:bg-yellow-500/40 text-gray-900 dark:text-white px-0.5 rounded"
        >
          {part}
        </mark>
      );
    }

    return part;
  });
}

/**
 * 正規表現の特殊文字をエスケープ
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
