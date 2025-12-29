import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tokenStorage, type TokenBundle } from './tokenStorage';

describe('tokenStorage', () => {
  beforeEach(() => {
    // Cookie をクリア
    document.cookie.split(';').forEach((c) => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
    });

    // localStorage をクリア
    localStorage.clear();
  });

  describe('getCsrfToken', () => {
    it('XSRF-TOKEN Cookie が存在する場合、その値を返す', () => {
      document.cookie = 'XSRF-TOKEN=test-csrf-token';
      expect(tokenStorage.getCsrfToken()).toBe('test-csrf-token');
    });

    it('XSRF-TOKEN Cookie が存在しない場合、undefined を返す', () => {
      expect(tokenStorage.getCsrfToken()).toBeUndefined();
    });

    it('他の Cookie が存在しても XSRF-TOKEN のみを取得する', () => {
      document.cookie = 'other=value';
      document.cookie = 'XSRF-TOKEN=csrf-value';
      document.cookie = 'another=test';
      expect(tokenStorage.getCsrfToken()).toBe('csrf-value');
    });
  });

  describe('hasAuthCookie', () => {
    it('genba_auth_token Cookie が存在する場合、true を返す', () => {
      document.cookie = 'genba_auth_token=some-token';
      expect(tokenStorage.hasAuthCookie()).toBe(true);
    });

    it('genba_auth_token Cookie が存在しない場合、false を返す', () => {
      expect(tokenStorage.hasAuthCookie()).toBe(false);
    });
  });

  describe('load', () => {
    it('常に空のオブジェクトを返す（後方互換性）', () => {
      const result = tokenStorage.load();
      expect(result).toEqual({});
    });

    it('localStorage にトークンがあっても読み込まない', () => {
      localStorage.setItem('access-token', 'test-token');
      localStorage.setItem('client', 'test-client');
      localStorage.setItem('uid', 'test@example.com');

      const result = tokenStorage.load();
      expect(result).toEqual({});
    });
  });

  describe('save', () => {
    it('何もせず正常に完了する（後方互換性）', () => {
      const tokens: TokenBundle = {
        at: 'test-token',
        client: 'test-client',
        uid: 'test@example.com',
      };

      expect(() => tokenStorage.save(tokens)).not.toThrow();
    });

    it('localStorage にトークンを保存しない', () => {
      const tokens: TokenBundle = {
        at: 'test-token',
        client: 'test-client',
        uid: 'test@example.com',
      };

      tokenStorage.save(tokens);

      expect(localStorage.getItem('access-token')).toBeNull();
      expect(localStorage.getItem('client')).toBeNull();
      expect(localStorage.getItem('uid')).toBeNull();
    });
  });

  describe('clear', () => {
    it('localStorage の旧トークンをクリアする', () => {
      localStorage.setItem('access-token', 'test-token');
      localStorage.setItem('client', 'test-client');
      localStorage.setItem('uid', 'test@example.com');
      localStorage.setItem('token-type', 'Bearer');
      localStorage.setItem('expiry', '1234567890');

      tokenStorage.clear();

      expect(localStorage.getItem('access-token')).toBeNull();
      expect(localStorage.getItem('client')).toBeNull();
      expect(localStorage.getItem('uid')).toBeNull();
      expect(localStorage.getItem('token-type')).toBeNull();
      expect(localStorage.getItem('expiry')).toBeNull();
    });

    it('localStorage が使用できない環境でもエラーを投げない', () => {
      const spy = vi.spyOn(Storage.prototype, 'removeItem');
      spy.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      expect(() => tokenStorage.clear()).not.toThrow();

      spy.mockRestore();
    });
  });

  describe('isValid', () => {
    it('常に true を返す（後方互換性）', () => {
      expect(tokenStorage.isValid()).toBe(true);
    });

    it('トークンを渡しても常に true を返す', () => {
      const tokens: TokenBundle = {
        at: 'test-token',
        client: 'test-client',
        uid: 'test@example.com',
      };
      expect(tokenStorage.isValid(tokens)).toBe(true);
    });

    it('空のトークンを渡しても true を返す', () => {
      expect(tokenStorage.isValid({})).toBe(true);
    });
  });

  describe('getKey', () => {
    it('accessToken のキーを返す', () => {
      expect(tokenStorage.getKey('accessToken')).toBe('access-token');
    });

    it('client のキーを返す', () => {
      expect(tokenStorage.getKey('client')).toBe('client');
    });

    it('uid のキーを返す', () => {
      expect(tokenStorage.getKey('uid')).toBe('uid');
    });

    it('tokenType のキーを返す', () => {
      expect(tokenStorage.getKey('tokenType')).toBe('token-type');
    });

    it('expiry のキーを返す', () => {
      expect(tokenStorage.getKey('expiry')).toBe('expiry');
    });
  });

  describe('アプリ起動時の初期化', () => {
    it('既存の localStorage トークンがクリアされる', () => {
      // 旧トークンを設定
      localStorage.setItem('access-token', 'old-token');
      localStorage.setItem('client', 'old-client');

      // モジュール再読み込みをシミュレート
      tokenStorage.clear();

      expect(localStorage.getItem('access-token')).toBeNull();
      expect(localStorage.getItem('client')).toBeNull();
    });
  });
});
