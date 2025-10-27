/**
 * トークンバンドル型定義
 */
export type TokenBundle = {
  at?: string;
  client?: string;
  uid?: string;
  tokenType?: string;
  expiry?: string;
};

/**
 * localStorage のキー定数
 */
const STORAGE_KEYS = {
  accessToken: "access-token",
  client: "client",
  uid: "uid",
  tokenType: "token-type",
  expiry: "expiry",
} as const;

/**
 * TokenStorage - 認証トークンの永続化を一元管理
 *
 * localStorage操作を抽象化し、エラーハンドリングと型安全性を提供します。
 */
class TokenStorage {
  /**
   * すべての認証トークンを読み込み
   */
  load(): TokenBundle {
    try {
      return {
        at: this.get("accessToken"),
        client: this.get("client"),
        uid: this.get("uid"),
        tokenType: this.get("tokenType"),
        expiry: this.get("expiry"),
      };
    } catch {
      return {};
    }
  }

  /**
   * 認証トークンを保存
   * 値が undefined の場合は該当キーを削除
   */
  save(tokens: TokenBundle): void {
    this.set("accessToken", tokens.at);
    this.set("client", tokens.client);
    this.set("uid", tokens.uid);
    this.set("tokenType", tokens.tokenType);
    this.set("expiry", tokens.expiry);
  }

  /**
   * すべての認証トークンを削除
   */
  clear(): void {
    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
    } catch {
      // localStorage が使用不可能な環境でもエラーを投げない
    }
  }

  /**
   * トークンが有効かチェック（必須項目が揃っているか）
   */
  isValid(tokens: TokenBundle = this.load()): boolean {
    return !!(tokens.at && tokens.client && tokens.uid);
  }

  /**
   * 個別のトークン値を取得（内部用）
   */
  private get(key: keyof typeof STORAGE_KEYS): string | undefined {
    try {
      const value = localStorage.getItem(STORAGE_KEYS[key]);
      return value ?? undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * 個別のトークン値を設定（内部用）
   * 値が undefined または空文字の場合は削除
   */
  private set(key: keyof typeof STORAGE_KEYS, value?: string): void {
    try {
      if (value) {
        localStorage.setItem(STORAGE_KEYS[key], value);
      } else {
        localStorage.removeItem(STORAGE_KEYS[key]);
      }
    } catch {
      // localStorage が使用不可能な環境でもエラーを投げない
    }
  }

  /**
   * ストレージキー名を取得（外部からの直接アクセス用）
   * インターセプタなどで使用
   */
  getKey(key: keyof typeof STORAGE_KEYS): string {
    return STORAGE_KEYS[key];
  }
}

/**
 * シングルトンインスタンスをエクスポート
 */
export const tokenStorage = new TokenStorage();
