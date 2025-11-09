// src/features/tasks/inline/dndContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,   // ★ 追加
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

const DBG = import.meta.env.DEV;
const log = (...args: unknown[]) => DBG && console.log("[DND:Ctx]", ...args);
// ★ drop 直後の“上書き抑止”猶予時間(ms)
const REGISTER_SUPPRESS_MS = 800;

export function InlineDndProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DndState>({
    draggingId: null,
    draggingParentId: null,
    draggingDepth: null,
  });
  const [orderMap, setOrderMap] = useState<Record<string, number[]>>({});
  const qc = useQueryClient();

  // ★ 直近で並べ替えた親キーの時刻（registerChildren の上書きを短時間抑止）
  const lastTouchedAtRef = useRef<Record<string, number>>({});

  // body flag
  useEffect(() => {
    document.body.classList.toggle("is-dragging", !!state.draggingId);
    if (!state.draggingId) document.body.classList.remove("pre-drag");
    return () => {
      document.body.classList.remove("is-dragging");
      document.body.classList.remove("pre-drag");
    };
  }, [state.draggingId]);

  // keep-alive: always preventDefault while dragging
  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      if (!state.draggingId) return;
      e.preventDefault();
    };
    window.addEventListener("dragover", onDragOver as EventListener, {
      passive: false,
      capture: true,
    });
    return () => window.removeEventListener("dragover", onDragOver as EventListener, true);
  }, [state.draggingId]);

  // drag state
  const onDragStart = useCallback((task: Task, depth: number) => {
    const pid = task.parent_id ?? null;
    const next = { draggingId: task.id, draggingParentId: pid, draggingDepth: depth };
    log("start", next);
    setState(next);
    requestAnimationFrame(() => setState(next));
  }, []);

  const onDragEnd = useCallback(() => {
    const cleared = { draggingId: null, draggingParentId: null, draggingDepth: null };
    log("end");
    setState(cleared);
    requestAnimationFrame(() => setState(cleared));
  }, []);

  const canAcceptIntoParent = useCallback(
    (parentId: number | null) => state.draggingParentId === parentId,
    [state.draggingParentId]
  );

  // 現在表示の順で登録（DnDの楽観順は壊さない）
  const registerChildren = useCallback(
    (parentId: number | null, childIds: number[]) => {
      const k = keyOf(parentId);
      setOrderMap((prev) => {
        // unregister
        if (!childIds || childIds.length === 0) {
          if (!(k in prev)) return prev;
          const next = { ...prev };
          delete next[k];
          log("register (unregister)", { k });
          return next;
        }

        const current = prev[k];

        // 初回はそのまま登録
        if (!current) {
          log("register (initial)", { k, childIds });
          return { ...prev, [k]: childIds.slice() };
        }

        // ★ ドラッグ中は上書きしない（チラつき防止）
        if (state.draggingId) return prev;

        // ★ 直近にこの親を並び替えた直後は上書き禁止
        const touchedAt = lastTouchedAtRef.current[k] ?? 0;
        if (Date.now() - touchedAt < REGISTER_SUPPRESS_MS) {
          // 抑止中は現状維持
          return prev;
        }

        // 並びが違えば上書き（昇順/降順の切替等を反映）
        if (!eqArray(current, childIds)) {
          log("register (replace)", { k, childIds });
          return { ...prev, [k]: childIds.slice() };
        }
        return prev;
      });
    },
    [state.draggingId]
  );

  // 同一親内の並べ替え（即時更新→API→invalidate）
  const reorderWithinParent = useCallback(
    (parentId: number | null, movingId: number, afterId: number | null) => {
      const k = keyOf(parentId);
      let prevArr: number[] | undefined;

      log("reorderWithinParent", { k, movingId, afterId });

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

        if (eqArray(current, next)) {
          log("apply order (no change)", { k, next });
          return prev;
        }
        // ★ 並べ替えた親を “直近タッチ” として記録（register の上書きを抑止）
        lastTouchedAtRef.current[k] = Date.now();

        log("apply order", { k, next });
        return { ...prev, [k]: next };
      });

      (async () => {
        try {
          await reorderWithinParentApi(movingId, afterId);
          log("api ok");
          await qc.invalidateQueries({
            predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "tasks",
            // ★ 画面で active なクエリも即 refetch
            refetchType: "active",
          });
        } catch {
          log("api rollback");
          if (prevArr) setOrderMap((prev) => ({ ...prev, [k]: prevArr! }));
        }
      })();
    },
    [qc]
  );

  const moveAcrossParents = useCallback((_args: unknown) => {
    /* 親またぎ不可（no-op） */
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

  const getIndexInParent = useCallback(
    (parentId: number | null, id: number) => {
      const k = keyOf(parentId);
      const ord = orderMap[k];
      if (!ord) return null;
      const idx = ord.indexOf(id);
      return idx >= 0 ? idx : null;
    },
    [orderMap]
  );

  // debug
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
