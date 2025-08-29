// src/features/tasks/inline/InlineTaskTree.tsx
import InlineTaskRow from "./InlineTaskRow";
import type { Task } from "../../../types/task";

type Props = { tree: Task[] };

export default function InlineTaskTree({ tree }: Props) {
  return (
    <div role="tree" aria-label="タスク">
      {tree.map((t) => (
        <InlineTaskRow key={t.id} task={t} depth={t.depth ?? 1} />
      ))}
    </div>
  );
}
