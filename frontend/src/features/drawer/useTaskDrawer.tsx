import React, { createContext, useCallback, useContext, useRef, useState } from "react";

type OpenOpts = { section?: "image" };

type Ctx = {
  openTaskId: number | null;
  openSection: "image" | null;
  open: (taskId: number, triggerEl?: HTMLElement | null, opts?: OpenOpts) => void;
  close: () => void;
};

const DrawerCtx = createContext<Ctx | null>(null);

export const TaskDrawerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [openTaskId, setOpenTaskId] = useState<number | null>(null);
  const [openSection, setOpenSection] = useState<"image" | null>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);

  const open = useCallback((taskId: number, triggerEl?: HTMLElement | null, opts?: OpenOpts) => {
    lastTriggerRef.current = triggerEl ?? null;
    setOpenSection(opts?.section ?? null);
    setOpenTaskId(taskId);
  }, []);

  const close = useCallback(() => {
    setOpenTaskId(null);
    setOpenSection(null);
    const t = lastTriggerRef.current;
    if (t && typeof t.focus === "function") setTimeout(() => t.focus(), 0);
    lastTriggerRef.current = null;
  }, []);

  return (
    <DrawerCtx.Provider value={{ openTaskId, openSection, open, close }}>
      {children}
    </DrawerCtx.Provider>
  );
};

export const useTaskDrawer = (): Ctx => {
  const v = useContext(DrawerCtx);
  if (!v) throw new Error("useTaskDrawer must be used within <TaskDrawerProvider>");
  return v;
};
