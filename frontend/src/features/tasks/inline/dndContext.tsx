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
  
  type DndState = {
    draggingId: number | null;
    draggingParentId: number | null;
    draggingDepth: number | null;
  };
  
  type Ctx = {
    state: DndState;
    onDragStart: (task: Task, depth: number) => void;
    onDragEnd: () => void;
  
    // 親またぎ不可（同一親だけ true）
    canAcceptIntoParent: (parentId: number | null) => boolean;
  
    // 同一親内の並べ替え（UIローカル）
    reorderWithinParent: (
      parentId: number | null,
      movingId: number,
      afterId: number | null
    ) => void;
  
    // 親またぎ移動は未対応（no-op）
    moveAcrossParents: (args: {
      fromPid: number | null;
      toPid: number | null;
      movingId: number;
      afterId: number | null;
    }) => void;
  
    // 表示順の取得（プロバイダが保持する順に並べる）
    getOrderedChildren: (parentId: number, children: Task[]) => Task[];
  
    // サーバから受け取った“現在の並び”を登録
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
  
  export function InlineDndProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<DndState>({
      draggingId: null,
      draggingParentId: null,
      draggingDepth: null,
    });
  
    // 親IDごとの“子IDの順序”を UI ローカルに保持
    const [orderMap, setOrderMap] = useState<Record<string, number[]>>({});
  
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
  
    // サーバから受け取った現在の並びを登録
    // 集合が同じなら “順序差” はローカル優先（上書きしない）
    const registerChildren = useCallback(
      (parentId: number | null, childIds: number[]) => {
        console.log("[REGISTER]", { parentId, childIds });
        const k = keyOf(parentId);
        setOrderMap((prev) => {
          const current = prev[k];
          if (!current) return { ...prev, [k]: childIds.slice() };
  
          const sameMembers =
            current.length === childIds.length &&
            current.every((id) => childIds.includes(id));
          if (!sameMembers) return { ...prev, [k]: childIds.slice() };
  
          return prev; // 集合が同じ＝ローカル順を維持
        });
      },
      []
    );
  
    // 同一親内の並べ替え：movingId を afterId の直後に入れる
    const reorderWithinParent = useCallback(
      (parentId: number | null, movingId: number, afterId: number | null) => {
        const k = keyOf(parentId);
        setOrderMap((prev) => {
          const current = prev[k] ?? [];
          console.log("[REORDER start]", {
            k,
            current: current.slice(),
            movingId,
            afterId,
          });
  
          // --- フォールバック初期化：未登録でも動く ---
          let base = current.slice();
          if (base.length === 0) {
            console.warn("[REORDER] current is empty. init base with movingId");
            base = [movingId];
          } else if (!base.includes(movingId)) {
            console.warn("[REORDER] movingId not in current. append movingId");
            base = [...base, movingId];
          }
  
          const next = base.filter((id) => id !== movingId);
          const idx = afterId == null || afterId < 0 ? -1 : next.indexOf(afterId);
          const insertAt = Math.max(0, idx + 1);
          next.splice(insertAt, 0, movingId);
  
          console.log("[REORDER next]", { k, next, insertAt });
          if (eqArray(current, next)) {
            console.log("[REORDER no-change]", { k });
            return prev;
          }
          const out = { ...prev, [k]: next };
          console.log("[REORDER commit]", out);
          return out;
        });
      },
      []
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
  
    const value = useMemo(
      () => ({
        state,
        onDragStart,
        onDragEnd,
        canAcceptIntoParent,
        reorderWithinParent,
        moveAcrossParents,
        getOrderedChildren,
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
        registerChildren,
      ]
    );
  
    return <C.Provider value={value}>{children}</C.Provider>;
  }
  