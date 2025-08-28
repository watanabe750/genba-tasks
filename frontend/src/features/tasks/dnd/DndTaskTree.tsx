import { useEffect, useMemo, useState, useCallback } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import type { TaskNode } from "../../../types";
import OutlineRow from "../../../components/outline/OutlineRow";
import { MAX_CHILDREN_PER_NODE } from "../constraints";
import { useUpdateTask } from "../useUpdateTask"; // 親ID更新に使用

type TreeNode = TaskNode;

function cloneTree(nodes: TreeNode[]): TreeNode[] {
  return nodes.map((n) => ({
    ...n,
    children: n.children ? cloneTree(n.children) : [],
  }));
}

function findListAndIndexById(
  nodes: TreeNode[],
  id: number,
  parentId: number | null
): { list: TreeNode[]; index: number } | null {
  if (parentId === null) {
    const idx = nodes.findIndex((n) => n.id === id);
    if (idx >= 0) return { list: nodes, index: idx };
  }
  const stack: TreeNode[] = [...nodes];
  while (stack.length) {
    const cur = stack.pop()!;
    const list = cur.children ?? [];
    const idx = list.findIndex((n) => n.id === id);
    if (idx >= 0) return { list, index: idx };
    if (cur.children?.length) stack.push(...cur.children);
  }
  return null;
}

function findListByParentId(nodes: TreeNode[], parentId: number | null): TreeNode[] | null {
  if (parentId === null) return nodes;
  const stack: TreeNode[] = [...nodes];
  while (stack.length) {
    const cur = stack.pop()!;
    if (cur.id === parentId) return cur.children ?? (cur.children = []);
    if (cur.children?.length) stack.push(...cur.children);
  }
  return null;
}

function canDropTo(list: TreeNode[] | null): boolean {
  if (!list) return false;
  return list.length < MAX_CHILDREN_PER_NODE;
}

type Props = {
  tree: TreeNode[];
  onTreeChange?: (next: TreeNode[]) => void;
};

export default function DndTaskTree({ tree, onTreeChange }: Props) {
  const [uiTree, setUiTree] = useState<TreeNode[]>(() => cloneTree(tree));

  // ★ 折りたたみ状態を ID セットで保持（永続化はお好みで）
  const [collapsed, setCollapsed] = useState<Set<number>>(() => new Set());
  const toggleCollapsed = useCallback((id: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  useEffect(() => setUiTree(cloneTree(tree)), [tree]);

  const { mutate: updateTask } = useUpdateTask();

  // ★ インデント操作（Tab / Shift+Tab）
  const indent = useCallback((id: number) => {
    setUiTree((prev) => {
      const copy = cloneTree(prev);
      // 対象の現在位置
      const where = findListAndIndexById(copy, id, null /* unused here */);
      if (!where) return prev;

      const { list } = where;
      const idx = where.index;
      // 直前の兄弟がいないとインデント不可
      if (idx <= 0) return prev;

      const newParent = list[idx - 1];
      if (!newParent) return prev;
      if ((newParent.children?.length ?? 0) >= MAX_CHILDREN_PER_NODE) return prev;

      const [moved] = list.splice(idx, 1);
      (newParent.children ??= []).push(moved);
      moved.parent_id = newParent.id;
      moved.depth = (newParent.depth ?? 1) + 1;
      setTimeout(() => updateTask({ id, data: { parent_id: newParent.id } }), 0);
      onTreeChange?.(copy);
      return copy;
    });
  }, [onTreeChange, updateTask]);

  const outdent = useCallback((id: number) => {
    setUiTree((prev) => {
      const copy = cloneTree(prev);

      // 親と親の親を探す
      function findParent(nodes: TreeNode[], childId: number, parent: TreeNode | null = null): { parent: TreeNode | null, list: TreeNode[], index: number } | null {
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          if (n.id === childId) {
            return { parent, list: nodes, index: i };
          }
          if (n.children?.length) {
            const r = findParent(n.children, childId, n);
            if (r) return r;
          }
        }
        return null;
      }

      const found = findParent(copy, id, null);
      if (!found || !found.parent) {
        // すでに最上位 → outdent不可
        return prev;
      }

      const { parent, list, index } = found; // list は parent.children
      const grand = findParent(copy, parent.id, null); // 親の親
      const insertList = grand ? grand.list : copy;
      const insertIndex = (grand ? grand.index : copy.indexOf(parent)) + 1;

      const [moved] = list.splice(index, 1);
      moved.parent_id = grand ? grand.parent?.id ?? null : null;
      moved.depth = (parent.depth ?? 2) - 1;

      insertList.splice(insertIndex, 0, moved);

      setTimeout(() => updateTask({ id, data: { parent_id: moved.parent_id ?? null } }), 0);
      onTreeChange?.(copy);
      return copy;
    });
  }, [onTreeChange, updateTask]);

  // ★ Enter で兄弟作成
  const createSibling = useCallback((base: TreeNode, title: string) => {
    // サーバ作成は OutlineRow 側の useCreateTask を使うほうが自然だが
    // UIの差し替え最小のためここでは「発火だけ」行に伝える
    // → 実体作成は OutlineRow から呼んでもらう（下で props 渡す）
  }, []);

  const handleDragEnd = (result: DropResult) => {
    const { draggableId, source, destination } = result;
    if (!destination) return;

    const parseDroppable = (dId: string): number | null =>
      dId === "root" ? null : Number(dId.replace("parent:", ""));

    const srcParentId = parseDroppable(source.droppableId);
    const dstParentId = parseDroppable(destination.droppableId);
    const draggedId = Number(draggableId);

    const next = cloneTree(uiTree);

    const from = findListAndIndexById(next, draggedId, srcParentId);
    const toList = findListByParentId(next, dstParentId);

    if (!from || !toList || (toList !== from.list && !canDropTo(toList))) {
      setUiTree(next);
      return;
    }

    const [moved] = from.list.splice(from.index, 1);
    moved.parent_id = dstParentId ?? null;
    moved.depth = computeDepth(next, moved.id);

    const insertAt = destination.index < 0 ? 0 : destination.index;
    toList.splice(insertAt, 0, moved);

    // 親変更をサーバにも
    updateTask({ id: moved.id, data: { parent_id: moved.parent_id ?? null } });

    setUiTree(next);
    onTreeChange?.(next);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="root" type="TASK">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} role="tree">
            {uiTree.map((node, idx) => (
              <TaskRow
                key={node.id}
                node={node}
                index={idx}
                collapsed={collapsed.has(node.id)}
                onToggle={() => toggleCollapsed(node.id)}
                onIndent={() => indent(node.id)}
                onOutdent={() => outdent(node.id)}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

function TaskRow({
  node, index, collapsed, onToggle, onIndent, onOutdent,
}: {
  node: TreeNode;
  index: number;
  collapsed: boolean;
  onToggle: () => void;
  onIndent: () => void;
  onOutdent: () => void;
}) {
  return (
    <Draggable draggableId={String(node.id)} index={index}>
      {(dragProvided) => (
        <div
          ref={dragProvided.innerRef}
          {...dragProvided.draggableProps}
          style={{ ...dragProvided.draggableProps.style }}
        >
          <OutlineRow
            node={node}
            collapsed={collapsed}
            onToggleCollapsed={onToggle}
            onIndent={onIndent}
            onOutdent={onOutdent}
            dragHandleProps={dragProvided.dragHandleProps}
          />

          {/* 子：折りたたみ時は表示しない */}
          {!collapsed && (
            <Droppable droppableId={`parent:${node.id}`} type="TASK">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {node.children?.map((child, idx) => (
                    <TaskRow
                      key={child.id}
                      node={child}
                      index={idx}
                      collapsed={false}
                      onToggle={() => {}}
                      onIndent={() => onIndent()}
                      onOutdent={() => onOutdent()}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}
        </div>
      )}
    </Draggable>
  );
}

// depth は UI 上で親を辿って再計算（既存）
function computeDepth(tree: TreeNode[], id: number): number {
  function findNode(nodes: TreeNode[]): TreeNode | null {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children?.length) {
        const f = findNode(n.children);
        if (f) return f;
      }
    }
    return null;
  }
  function findParent(nodes: TreeNode[], targetId: number): TreeNode | null {
    for (const n of nodes) {
      if (n.children && n.children.some((c) => c.id === targetId)) return n;
      if (n.children?.length) {
        const f = findParent(n.children, targetId);
        if (f) return f;
      }
    }
    return null;
  }
  const node = findNode(tree);
  if (!node) return 1;
  let d = 1;
  let cur = node;
  while (true) {
    const p = findParent(tree, cur.id);
    if (!p) break;
    d += 1;
    cur = p;
  }
  return d;
}
