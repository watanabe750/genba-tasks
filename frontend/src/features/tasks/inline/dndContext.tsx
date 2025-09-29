// src/features/tasks/inline/dndContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Task } from "../../../types/task";
import { useQueryClient } from "@tanstack/react-query";
import { reorderWithinParentApi } from "../api";

type DndState = {
  draggingId: number | null;
  draggingParentId: number | null;
  draggingDepth: number | null;
};

type Ctx = {
  state: DndState;
  onDragStart: (task: Task, depth: number) => void;
  onDragEnd: () => void;

  canAcceptIntoParent: (parentId: number | null) => boolean;

  reorderWithinParent: (
    parentId: number | null,
    movingId: number,
    afterId: number | null
  ) => void;

  moveAcrossParents: (args: {
    fromPid: number | null;
    toPid: number | null;
    movingId: number;
    afterId: number | null;
  }) => void;

  getOrderedChildren: (parentId: number | null, children: Task[]) => Task[];
  getIndexInParent: (parentId: number | null, id: number) => number | null;
  registerChildren: (parentId: number | null, childIds: number[]) => void;
};

const C = createContext<Ctx | null>(null);

export function useInlineDnd() {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useInlineDnd must be used inside provider");
  return ctx;
}

// ---- helpers ----
const keyOf = (pid: number | null) => (pid == null ? "root" : `p:${pid}`);

const eqArray = (a?: number[], b?: number[]) => {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};

// 集合として同じか（順序は不問）
const sameSet = (a?: number[], b?: number[]) => {
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    const sa = new Set(a), sb = new Set(b);
    if (sa.size !== sb.size) return false;
    for (const x of sa) if (!sb.has(x)) return false;
    return true;
  };
  

export function InlineDndProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<DndState>({ draggingId: null, draggingParentId: null, draggingDepth: null });
    const [orderMap, setOrderMap] = useState<Record<string, number[]>>({});
    const qc = useQueryClient();

  // ドラッグ中フラグ（右ペイン等の当たり判定を殺すためのグローバルフラグ）
  useEffect(() => {
    document.body.classList.toggle("is-dragging", !!state.draggingId);
    if (!state.draggingId) document.body.classList.remove("pre-drag");
    return () => {
      document.body.classList.remove("is-dragging");
      document.body.classList.remove("pre-drag");
    };
  }, [state.draggingId]);

  // ★ Chrome keep-alive：ドラッグ中は常に「どこか」が preventDefault する
  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      if (!state.draggingId) return;
      // これが無いと、最初の dragover までに対象が居ないケースで即 dragend になる
      e.preventDefault();
    };
    window.addEventListener("dragover", onDragOver as any, {
      passive: false,
      capture: true,
    });
    return () =>
      window.removeEventListener("dragover", onDragOver as any, true);
  }, [state.draggingId]);

  // ★ Playwright/ブラウザ差対策：即時 set + 次フレームでも再度 set
  const onDragStart = useCallback((task: Task, depth: number) => {
    const pid = task.parent_id ?? null;
    const next = {
      draggingId: task.id,
      draggingParentId: pid,
      draggingDepth: depth,
    };
    setState(next);
    requestAnimationFrame(() => setState(next));
  }, []);

  const onDragEnd = useCallback(() => {
    const cleared = {
      draggingId: null,
      draggingParentId: null,
      draggingDepth: null,
    };
    setState(cleared);
    requestAnimationFrame(() => setState(cleared));
  }, []);

  const canAcceptIntoParent = useCallback(
    (parentId: number | null) => state.draggingParentId === parentId,
    [state.draggingParentId]
  );

  const registerChildren = useCallback(
    (parentId: number | null, childIds: number[]) => {
      // console.debug("[REGISTER]", { parentId, childIds });
      const k = keyOf(parentId);
      setOrderMap(prev => {
        // 空配列なら削除（unregister）
        if (!childIds || childIds.length === 0) {
          if (!(k in prev)) return prev;
          const next = { ...prev };
          delete next[k];
          return next;
        }

        const current = prev[k];
        // 初回は登録
        if (!current) return { ...prev, [k]: childIds.slice() };
        // ★ メンバーが同じなら既存順を維持（DnD結果を壊さない）
        if (sameSet(current, childIds)) return prev;
        // メンバーが変わった時だけ上書き
        if (!eqArray(current, childIds)) return { ...prev, [k]: childIds.slice() };
        return prev;
      });
    },
    []
  );

  const reorderWithinParent = useCallback(
    (parentId: number | null, movingId: number, afterId: number | null) => {
      const k = keyOf(parentId);
      let prevArr: number[] | undefined;

      setOrderMap((prev) => {
        const current = prev[k] ?? [];
        prevArr = current;

        let base = current.slice();
        if (base.length === 0) base = [movingId];
        else if (!base.includes(movingId)) base = [...base, movingId];

        const next = base.filter((id) => id !== movingId);
        const idx = afterId == null || afterId < 0 ? -1 : next.indexOf(afterId);
        const insertAt = Math.max(0, idx + 1);
        next.splice(insertAt, 0, movingId);

        if (eqArray(current, next)) return prev;
        return { ...prev, [k]: next };
      });

      (async () => {
        try {
          await reorderWithinParentApi(movingId, afterId);
          // ← クエリキーの違いを吸収（"tasks" で始まるもの全部）
          await qc.invalidateQueries({
            predicate: (q) =>
              Array.isArray(q.queryKey) && q.queryKey[0] === "tasks",
          });
        } catch (e) {
          if (prevArr) {
            setOrderMap((prev) => ({ ...prev, [k]: prevArr! }));
          }
        }
      })();
    },
    [qc]
  );

  const moveAcrossParents = useCallback((_args: any) => {
    /* 親またぎ不可なので no-op */
  }, []);

  const getOrderedChildren = useCallback(
    (parentId: number | null, children: Task[]) => {
      const k = keyOf(parentId);
      const ord = orderMap[k];
      if (!ord || ord.length === 0) return children;

      const pos = new Map<number, number>();
      ord.forEach((id, i) => pos.set(id, i));
      const withPos = children.map((c) => ({
        c,
        p: pos.get(c.id) ?? Number.MAX_SAFE_INTEGER,
      }));
      withPos.sort((a, b) => a.p - b.p);
      return withPos.map((x) => x.c);
    },
    [orderMap]
  );

  // （任意）デバッグ用：現在の orderMap を覗けるように
  useEffect(() => {
    // @ts-ignore
    window.__orderMap = orderMap;
  }, [orderMap]);

   // 追加：親内の現在インデックスを返す（なければ null）
   const getIndexInParent = useCallback((parentId: number | null, id: number) => {
     const k = keyOf(parentId);
     const ord = orderMap[k];
     if (!ord) return null;
     const idx = ord.indexOf(id);
     return idx >= 0 ? idx : null;
   }, [orderMap]);

  const value = useMemo(
    () => ({
      state,
      onDragStart,
      onDragEnd,
      canAcceptIntoParent,
      reorderWithinParent,
      moveAcrossParents,
      getOrderedChildren,
      getIndexInParent,
      registerChildren,
    }),
    [
      state,
      onDragStart,
      onDragEnd,
      canAcceptIntoParent,
      reorderWithinParent,
      moveAcrossParents,
      getOrderedChildren,
      getIndexInParent,
      registerChildren,
    ]
  );

  return <C.Provider value={value}>{children}</C.Provider>;
}
