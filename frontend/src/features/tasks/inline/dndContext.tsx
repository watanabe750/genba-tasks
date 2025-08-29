// src/features/tasks/inline/dndContext.tsx
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
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
    getOrderedChildren: (parentId: number, children: Task[]) => Task[];
  };
  
  const C = createContext<Ctx | null>(null);
  
  export function useInlineDnd() {
    const ctx = useContext(C);
    if (!ctx) throw new Error("useInlineDnd must be used inside provider");
    return ctx;
  }
  
  // key 生成（null 親は 'root' 扱い）
  const pidKey = (pid: number | null) => (pid == null ? "root" : String(pid));
  
  export function InlineDndProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<DndState>({
      draggingId: null,
      draggingParentId: null,
      draggingDepth: null,
    });
  
    // 親ごとのローカル順序（子ID配列）を保持
    // useRef: setStateでdraggingフラグだけ更新しても順序は維持したい
    const localOrders = useRef<Record<string, number[]>>({});
  
    useEffect(() => {
      document.body.classList.toggle("is-dragging", !!state.draggingId);
      return () => document.body.classList.remove("is-dragging");
    }, [state.draggingId]);
  
    // dragstart の直後はネイティブD&Dの初期化を壊さないよう次フレームに反映
    const onDragStart = useCallback((task: Task, depth: number) => {
      const pid = task.parent_id ?? null;
      requestAnimationFrame(() => {
        setState({
          draggingId: task.id,
          draggingParentId: pid,
          draggingDepth: depth,
        });
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
  
    // 親内のローカル順序を取り出し（未初期化なら現在の children で初期化）
    const ensureOrder = useCallback(
      (parentId: number | null, children: Task[]) => {
        const k = pidKey(parentId);
        if (!localOrders.current[k]) {
          localOrders.current[k] = children.map((c) => c.id);
        }
        return localOrders.current[k];
      },
      []
    );
  
    // 呼び出し時点の order を元に、movingId を afterId の直後に差し込む
    const reorderWithinParent = useCallback(
      (parentId: number | null, movingId: number, afterId: number | null) => {
        const k = pidKey(parentId);
        const order = localOrders.current[k];
        if (!order) {
          // 初回は getOrderedChildren 側で初期化されるので安全側 return
          return;
        }
        const next = order.filter((id) => id !== movingId);
        const idx = afterId == null || afterId === -1 ? next.length - 1 : next.indexOf(afterId);
        const insertAt = idx < 0 ? next.length : idx + 1;
        next.splice(insertAt, 0, movingId);
        localOrders.current[k] = next;
        // 順序更新だけでOK（draggingフラグは drop 側で onDragEnd が呼ばれる）
        // setState を叩かないと再描画されないので、draggingId を同値で入れて軽くトリガ
        setState((s) => ({ ...s }));
      },
      []
    );
  
    // 親またぎは禁止
    const moveAcrossParents = useCallback((_args: {
      fromPid: number | null;
      toPid: number | null;
      movingId: number;
      afterId: number | null;
    }) => {
      /* no-op: 親またぎ不可 */
    }, []);
  
    // children を localOrders に従って並び替え
    const getOrderedChildren = useCallback(
      (parentId: number, children: Task[]) => {
        const k = pidKey(parentId);
        const order = ensureOrder(parentId, children);
        const pos = new Map<number, number>();
        order.forEach((id, i) => pos.set(id, i));
        // 未登録の子（新規追加など）は末尾に回す
        return [...children].sort((a, b) => {
          const ia = pos.has(a.id) ? pos.get(a.id)! : Number.MAX_SAFE_INTEGER;
          const ib = pos.has(b.id) ? pos.get(b.id)! : Number.MAX_SAFE_INTEGER;
          return ia - ib;
        });
      },
      [ensureOrder]
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
      [
        state,
        onDragStart,
        onDragEnd,
        canAcceptIntoParent,
        reorderWithinParent,
        moveAcrossParents,
        getOrderedChildren,
      ]
    );
  
    return <C.Provider value={value}>{children}</C.Provider>;
  }
  