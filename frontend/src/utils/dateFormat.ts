/**
 * 日付フォーマット関連のユーティリティ関数
 */

/**
 * 日付文字列をISO形式に変換します
 * @param dateStr - 変換する日付文字列（YYYY-MM-DD等）
 * @returns ISO形式の日付文字列、または入力がnull/undefinedの場合はnull
 */
export function toISOorNull(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toISOString();
}

/**
 * ISO形式の日付文字列をinput[type="date"]用のフォーマット（YYYY-MM-DD）に変換します
 * @param iso - ISO形式の日付文字列
 * @returns YYYY-MM-DD形式の日付文字列、または入力がnull/undefinedの場合は空文字列
 */
export function fromISOtoDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.split('T')[0];
}
