import axios from "axios";

type ErrorBody = { errors?: string[] | string } | undefined;

export function formatApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const s = err.response?.status;

    if (s === 422) {
      const errors = (err.response?.data as ErrorBody | undefined)?.errors;
      if (Array.isArray(errors)) return errors.join("\n");
      if (typeof errors === "string") return errors;
      return "入力内容に誤りがあります。もう一度ご確認ください。";
    }
    if (s === 401) return "ログインセッションが切れました。お手数ですが、再度ログインしてください。";
    if (s === 403) return "この操作を実行する権限がありません。";
    if (s === 404) return "お探しの情報が見つかりませんでした。ページを更新してもう一度お試しください。";
    if (s && s >= 500) return "サーバーで問題が発生しました。しばらく時間をおいてから再度お試しください。";
  }
  return "通信に失敗しました。インターネット接続をご確認の上、もう一度お試しください。";
}