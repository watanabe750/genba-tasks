/**
 * エラーハンドリングユーティリティ
 */

import type { ApiError, ApiErrorType, AxiosErrorResponse } from '../types/errors';

/**
 * エラーの種類を判定します
 * @param statusCode - HTTPステータスコード
 * @param errorData - エラーレスポンスデータ
 * @returns エラーの種類
 */
function determineErrorType(statusCode?: number, errorData?: unknown): ApiErrorType {
  if (!statusCode) return 'network';

  if (statusCode === 401 || statusCode === 403) {
    return 'auth';
  }

  if (statusCode === 404) {
    return 'notFound';
  }

  if (statusCode >= 400 && statusCode < 500) {
    return 'validation';
  }

  if (statusCode >= 500) {
    return 'server';
  }

  return 'network';
}

/**
 * エラーメッセージを抽出します
 * @param error - エラーオブジェクト
 * @returns エラーメッセージ
 */
function extractErrorMessage(error: AxiosErrorResponse): string {
  // response.data.errors (配列形式)
  if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    return error.response.data.errors.join(', ');
  }

  // response.data.error (文字列形式)
  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  // response.data.message (文字列形式)
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // エラーオブジェクトのmessageプロパティ
  if (error.message) {
    return error.message;
  }

  return '不明なエラーが発生しました';
}

/**
 * ユーザー向けエラーメッセージを生成します
 * @param type - エラーの種類
 * @param message - 開発者向けメッセージ
 * @returns ユーザー向けメッセージ
 */
function generateUserMessage(type: ApiErrorType, message: string): string {
  switch (type) {
    case 'auth':
      return '認証に失敗しました。ログインし直してください。';
    case 'validation':
      return message; // バリデーションエラーはそのまま表示
    case 'notFound':
      return '指定されたリソースが見つかりませんでした。';
    case 'server':
      return 'サーバーエラーが発生しました。しばらくしてから再度お試しください。';
    case 'network':
      return 'ネットワークエラーが発生しました。接続を確認してください。';
    default:
      return '予期しないエラーが発生しました。';
  }
}

/**
 * unknown 型のエラーを ApiError 型に変換します
 * @param error - エラーオブジェクト
 * @returns 統一されたAPIエラー
 */
export function handleApiError(error: unknown): ApiError {
  // 既に ApiError 型の場合はそのまま返す
  if (isApiError(error)) {
    return error;
  }

  // Axios エラーの場合
  const axiosError = error as AxiosErrorResponse;
  const statusCode = axiosError.response?.status || axiosError.status;
  const message = extractErrorMessage(axiosError);
  const type = determineErrorType(statusCode, axiosError.response?.data);
  const userMessage = generateUserMessage(type, message);

  return {
    type,
    message,
    userMessage,
    statusCode,
    details: axiosError.response?.data as Record<string, unknown>,
  };
}

/**
 * 型ガード: unknown が ApiError かどうかを判定します
 * @param error - 判定対象のエラー
 * @returns ApiError型の場合true
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'message' in error &&
    'userMessage' in error
  );
}

/**
 * エラーからユーザー向けメッセージを取得します
 * @param error - エラーオブジェクト
 * @returns ユーザー向けメッセージ
 */
export function getUserMessage(error: unknown): string {
  const apiError = handleApiError(error);
  return apiError.userMessage;
}

/**
 * デバッグ用: エラー情報をコンソールに出力します（開発環境のみ）
 * @param error - エラーオブジェクト
 * @param context - エラーが発生したコンテキスト
 */
export function logError(error: unknown, context?: string): void {
  if (import.meta.env.DEV) {
    const apiError = handleApiError(error);
    console.error(
      `[Error${context ? ` in ${context}` : ''}]:`,
      {
        type: apiError.type,
        message: apiError.message,
        userMessage: apiError.userMessage,
        statusCode: apiError.statusCode,
        details: apiError.details,
      }
    );
  }
}
