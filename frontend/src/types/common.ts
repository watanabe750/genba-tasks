// types/common.ts - 共通ユーティリティ型

/** ブランド型: 同じ基底型でも区別したい場合に使用 */
export type Brand<T, B extends string> = T & { readonly __brand: B };

/** ISO 8601 形式の日付文字列 (例: "2025-01-02T00:00:00.000Z") */
export type ISODateString = Brand<string, "IsoDate">;

/** null を許容する型 */
export type Nullable<T> = T | null;
