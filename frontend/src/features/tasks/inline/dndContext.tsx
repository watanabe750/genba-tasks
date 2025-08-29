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
    // 親またぎは不可（要件どおり）
    canAcceptIntoParent: (parentId: number | null) => boolean;
    // UI はサーバ再取得で並びが確定するのでここは no-op でOK
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
    getOrderedChildren: (parentId: number, children: Task[]) => Task[];
  };
  
  const C = createContext<Ctx | null>(null);
  
  export function useInlineDnd() {
    const ctx = useContext(C);
    if (!ctx) throw new Error("useInlineDnd must be used inside provider");
    return ctx;
  }
  
  export function InlineDndProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<DndState>({
      draggingId: null,
      draggingParentId: null,
      draggingDepth: null,
    });
  
    // ドラッグ中は body にフラグを付与（右の優先タスク等の当たり判定を殺す）
    useEffect(() => {
      document.body.classList.toggle("is-dragging", !!state.draggingId);
      return () => document.body.classList.remove("is-dragging");
    }, [state.draggingId]);
  
    // ★ ここがポイント：次フレームで state を更新して、ネイティブ drag の開始を壊さない
    const onDragStart = useCallback((task: Task, depth: number) => {
      const pid = task.parent_id ?? null;
      requestAnimationFrame(() => {
        setState({ draggingId: task.id, draggingParentId: pid, draggingDepth: depth });
      });
    }, []);
  
    const onDragEnd = useCallback(() => {
      requestAnimationFrame(() =>
        setState({ draggingId: null, draggingParentId: null, draggingDepth: null })
      );
    }, []);
  
    const canAcceptIntoParent = useCallback(
      (parentId: number | null) => state.draggingParentId === parentId,
      [state.draggingParentId]
    );
  
    const reorderWithinParent = useCallback(
      (_parentId: number | null, _movingId: number, _afterId: number | null) => {
        /* no-op (サーバ側順序で再描画) */
      },
      []
    );
  
    const moveAcrossParents = useCallback(
      (_args: {
        fromPid: number | null;
        toPid: number | null;
        movingId: number;
        afterId: number | null;
      }) => {
        /* 親またぎ不可なので no-op */
      },
      []
    );
  
    const getOrderedChildren = useCallback(
      (_parentId: number, children: Task[]) => children,
      []
    );
  
    const value = useMemo(
      () => ({
        state,
        onDragStart,
        onDragEnd,
        canAcceptIntoParent,
        reorderWithinParent,
        moveAcrossParents,
        getOrderedChildren,
      }),
      [state, onDragStart, onDragEnd, canAcceptIntoParent, reorderWithinParent, moveAcrossParents, getOrderedChildren]
    );
  
    return <C.Provider value={value}>{children}</C.Provider>;
  }
  