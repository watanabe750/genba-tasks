import { useEffect } from "react";

const tabbableSelector =
  'a[href],button,textarea,input,select,[tabindex]:not([tabindex="-1"])';

export const useFocusTrap = (container: HTMLElement | null, enabled: boolean) => {
  useEffect(() => {
    if (!enabled || !container) return;

    const focusables = Array.from(
      container.querySelectorAll<HTMLElement>(tabbableSelector)
    ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);

    if (focusables.length > 0) {
      // 初期フォーカス
      focusables[0].focus();
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const list = Array.from(
        container.querySelectorAll<HTMLElement>(tabbableSelector)
      ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
      if (list.length === 0) return;

      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (active === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener("keydown", onKeyDown);
    return () => container.removeEventListener("keydown", onKeyDown);
  }, [container, enabled]);
};
