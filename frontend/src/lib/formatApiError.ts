import axios from "axios";

type ErrorBody = { errors?: string[] | string } | undefined;

export function formatApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const s = err.response?.status;

    if (s === 422) {
      const errors = (err.response?.data as ErrorBody | undefined)?.errors;
      if (Array.isArray(errors)) return errors.join("\n");
      if (typeof errors === "string") return errors;
      return "入力内容をご確認ください。";
    }
    if (s === 401) return "ログインが必要です。";
    if (s === 403) return "権限がありません。";
    if (s === 404) return "見つかりません。";
    if (s && s >= 500) return "サーバーエラーが発生しました。";
  }
  return "通信に失敗しました。時間を置いて再度お試しください。";
}