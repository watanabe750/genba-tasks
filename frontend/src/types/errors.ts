/**
 * エラー関連の型定義
 */

/**
 * API エラーの種類
 */
export type ApiErrorType = 'validation' | 'auth' | 'notFound' | 'server' | 'network';

/**
 * 統一された API エラー型
 */
export interface ApiError {
  /** エラーの種類 */
  type: ApiErrorType;
  /** 開発者向けエラーメッセージ */
  message: string;
  /** ユーザー向けエラーメッセージ */
  userMessage: string;
  /** HTTPステータスコード */
  statusCode?: number;
  /** エラーの詳細情報 */
  details?: Record<string, unknown>;
}

/**
 * 非同期処理の状態を表す型
 */
export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: ApiError };

/**
 * Axios エラーレスポンスの型
 */
export interface AxiosErrorResponse {
  response?: {
    status?: number;
    data?: {
      errors?: string[];
      error?: string;
      message?: string;
    };
  };
  message?: string;
  status?: number;
}
