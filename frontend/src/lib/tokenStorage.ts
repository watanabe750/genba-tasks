/**
 * トークンバンドル型定義（後方互換性のために残す）
 */
export type TokenBundle = {
  at?: string;
  client?: string;
  uid?: string;
  tokenType?: string;
  expiry?: string;
};

/**
 * Cookie から値を取得するヘルパー
 */
function getCookie(name: string): string | undefined {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift();
  }
  return undefined;
}

/**
 * localStorage のキー定数（旧バージョン互換用）
 */
const LEGACY_STORAGE_KEYS = {
  accessToken: "access-token",
  client: "client",
  uid: "uid",
  tokenType: "token-type",
  expiry: "expiry",
} as const;

/**
 * TokenStorage - httpOnly Cookie ベース認証に対応
 *
 * XSS攻撃対策として、認証トークンはhttpOnly Cookieで管理されます。
 * JavaScriptからは直接アクセスできませんが、CSRF対策のためのトークン取得機能を提供します。
 */
class TokenStorage {
  /**
   * 旧バージョンからの移行: localStorage のトークンを削除
   */
  private clearLegacyTokens(): void {
    try {
      Object.values(LEGACY_STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
    } catch {
      // localStorage が使用不可能な環境でもエラーを投げない
    }
  }

  /**
   * CSRF トークンを取得（リクエストヘッダーに含めるため）
   */
  getCsrfToken(): string | undefined {
    return getCookie('XSRF-TOKEN');
  }

  /**
   * 認証Cookieの存在確認（実際の認証状態はサーバーが判断）
   */
  hasAuthCookie(): boolean {
    // httpOnly Cookie は JavaScript から読み取れないため、
    // サーバーレスポンスで認証状態を判断する必要がある
    return getCookie('genba_auth_token') !== undefined;
  }

  /**
   * 後方互換性: load() - 空のオブジェクトを返す
   * httpOnly Cookie ではJavaScriptから読み取れないため
   */
  load(): TokenBundle {
    return {};
  }

  /**
   * 後方互換性: save() - 何もしない
   * トークンはサーバー側でCookieに設定される
   */
  save(_tokens: TokenBundle): void {
    // httpOnly Cookie はサーバー側で自動設定されるため何もしない
  }

  /**
   * ログアウト時の処理
   */
  clear(): void {
    // httpOnly Cookie はサーバー側で削除されるため、
    // クライアント側では旧トークンのみクリア
    this.clearLegacyTokens();
  }

  /**
   * 後方互換性: isValid() - 常にtrueを返す
   * 実際の認証状態はAPIレスポンスで判断
   */
  isValid(_tokens?: TokenBundle): boolean {
    // 認証状態はサーバーレスポンス（401など）で判断
    return true;
  }

  /**
   * 後方互換性: getKey()
   */
  getKey(key: keyof typeof LEGACY_STORAGE_KEYS): string {
    return LEGACY_STORAGE_KEYS[key];
  }
}

/**
 * シングルトンインスタンスをエクスポート
 */
export const tokenStorage = new TokenStorage();

// アプリケーション起動時に旧トークンを削除
if (typeof window !== 'undefined') {
  tokenStorage.clear();
}
