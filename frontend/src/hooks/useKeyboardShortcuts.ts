// hooks/useKeyboardShortcuts.ts - キーボードショートカット管理フック
import { useEffect, useCallback, useRef } from "react";

export type ShortcutKey = string;

export type Shortcut = {
  key: ShortcutKey;
  description: string;
  action: () => void;
  /**
   * 修飾キー（Ctrl/Cmd/Shift/Alt）が必要な場合
   */
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  /**
   * 連続入力（例: G → T）
   */
  sequence?: ShortcutKey[];
};

/**
 * キーボードショートカットを登録するフック
 * @param shortcuts ショートカット設定の配列
 * @param enabled ショートカットを有効にするかどうか（デフォルト: true）
 */
export function useKeyboardShortcuts(
  shortcuts: Shortcut[],
  enabled: boolean = true
) {
  const sequenceRef = useRef<string[]>([]);
  const sequenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // 入力フィールド内では無効化
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // シーケンスタイムアウトをクリア
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }

      // 現在のシーケンスに追加
      sequenceRef.current.push(key);

      // 1秒後にシーケンスをリセット
      sequenceTimeoutRef.current = setTimeout(() => {
        sequenceRef.current = [];
      }, 1000);

      // ショートカットをチェック
      for (const shortcut of shortcuts) {
        // 修飾キーのチェック
        if (shortcut.ctrl && !e.ctrlKey && !e.metaKey) continue;
        if (shortcut.shift && !e.shiftKey) continue;
        if (shortcut.alt && !e.altKey) continue;

        // シーケンスショートカットの場合
        if (shortcut.sequence && shortcut.sequence.length > 0) {
          const expectedSequence = shortcut.sequence.map((k) => k.toLowerCase());
          const currentSequence = sequenceRef.current.slice(-expectedSequence.length);

          if (
            currentSequence.length === expectedSequence.length &&
            currentSequence.every((k, i) => k === expectedSequence[i])
          ) {
            e.preventDefault();
            shortcut.action();
            sequenceRef.current = [];
            return;
          }
        }
        // 単一キーショートカットの場合
        else if (key === shortcut.key.toLowerCase()) {
          e.preventDefault();
          shortcut.action();
          sequenceRef.current = [];
          return;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }
    };
  }, [handleKeyDown]);
}
