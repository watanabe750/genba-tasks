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

/**
 * 期限までの残り日数を計算
 * @param iso ISO形式の日付文字列
 * @returns 残り日数（負の値は期限切れ）、期限なしの場合はnull
 */
export function getDaysUntilDeadline(iso?: string | null): number | null {
  if (!iso) return null;
  const deadline = new Date(iso);
  if (Number.isNaN(deadline.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);

  const diffTime = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * 期限の緊急度を判定
 * @param iso ISO形式の日付文字列
 * @returns "overdue" | "urgent" | "warning" | "normal" | "none"
 */
export function getDeadlineUrgency(iso?: string | null): "overdue" | "urgent" | "warning" | "normal" | "none" {
  const daysUntil = getDaysUntilDeadline(iso);

  if (daysUntil === null) return "none";
  if (daysUntil < 0) return "overdue"; // 期限切れ
  if (daysUntil <= 3) return "urgent"; // 3日以内
  if (daysUntil <= 7) return "warning"; // 7日以内

  return "normal";
}

/**
 * 期限を「残り○日」形式でフォーマット
 * @param iso ISO形式の日付文字列
 * @returns "残り○日" または "期限切れ" または "期限なし"
 */
export function formatDaysUntilDeadline(iso?: string | null): string {
  const daysUntil = getDaysUntilDeadline(iso);

  if (daysUntil === null) return "期限なし";
  if (daysUntil < 0) return `期限切れ（${Math.abs(daysUntil)}日超過）`;
  if (daysUntil === 0) return "今日が期限";
  if (daysUntil === 1) return "明日が期限";

  return `残り${daysUntil}日`;
}
