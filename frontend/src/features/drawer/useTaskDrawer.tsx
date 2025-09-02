import React, { createContext, useCallback, useContext, useRef, useState } from "react";

type Ctx = {
  openTaskId: number | null;
  open: (taskId: number, triggerEl?: HTMLElement | null) => void;
  close: () => void;
};

const DrawerCtx = createContext<Ctx | null>(null);

export const TaskDrawerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [openTaskId, setOpenTaskId] = useState<number | null>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);

  const open = useCallback((taskId: number, triggerEl?: HTMLElement | null) => {
    lastTriggerRef.current = triggerEl ?? null;
    setOpenTaskId(taskId);
  }, []);

  const close = useCallback(() => {
    setOpenTaskId(null);
    // フォーカス復帰
    const t = lastTriggerRef.current;
    if (t && typeof t.focus === "function") {
      setTimeout(() => t.focus(), 0);
    }
    lastTriggerRef.current = null;
  }, []);

  return (
    <DrawerCtx.Provider value={{ openTaskId, open, close }}>
      {children}
    </DrawerCtx.Provider>
  );
};

export const useTaskDrawer = (): Ctx => {
  const v = useContext(DrawerCtx);
  if (!v) throw new Error("useTaskDrawer must be used within <TaskDrawerProvider>");
  return v;
};
