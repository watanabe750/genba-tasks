/**
 * ISO日付文字列をYYYY-MM-DD形式に変換
 * @param iso ISO形式の日付文字列
 * @returns YYYY-MM-DD形式の文字列、または null
 */
export const toYmd = (iso: string | null | undefined): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};

/**
 * ISO日付文字列を input[type="date"] 用の文字列に変換
 * すでにYYYY-MM-DD形式の場合はそのまま返す
 * @param iso ISO形式の日付文字列
 * @returns YYYY-MM-DD形式の文字列、または空文字列
 */
export function toDateInputValue(iso?: string | null): string {
  if (!iso) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * ISO日付文字列を表示用フォーマット（M/DD(曜日)）に変換
 * @param iso ISO形式の日付文字列
 * @returns M/DD(曜日) 形式の文字列、または "期限なし"
 */
export function formatDeadlineForDisplay(iso?: string | null): string {
  if (!iso) return "期限なし";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso ?? "";
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const dow = "日月火水木金土"[d.getDay()];
  return `${m}/${day}(${dow})`;
}
