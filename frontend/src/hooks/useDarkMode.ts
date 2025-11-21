import { useEffect, useState } from "react";

export function useDarkMode() {
  // 初期状態: デフォルトでダークモード有効
  const [isDark, setIsDark] = useState(() => {
    try {
      const stored = localStorage.getItem("darkMode");
      return stored !== null ? stored === "true" : true; // デフォルトでtrue
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    try {
      localStorage.setItem("darkMode", String(isDark));
    } catch {
      // ignore
    }
  }, [isDark]);

  const toggle = () => setIsDark((prev) => !prev);

  return { isDark, toggle };
}
