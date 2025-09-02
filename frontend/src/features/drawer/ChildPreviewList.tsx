// src/features/drawer/ChildPreviewList.tsx
import type { ChildPreview } from "../../types";
import StatusPill from "../../components/StatusPill";
import { toYmd } from "../../utils/date";

type Props = {
  items?: ChildPreview[];
  grandchildrenCount?: number | null;
};

const ariaLabelFor = (c: ChildPreview) => {
  const d = toYmd(c.deadline) ?? "期限なし";
  const prog = Math.round(c.progress_percent ?? 0);
  // 読み上げ用の簡潔文
  return `${c.title}、ステータス ${c.status}、期限 ${d}、進捗 ${prog}パーセント`;
};

export default function ChildPreviewList({ items, grandchildrenCount }: Props) {
  const list = items ?? [];
  const hasGrandkids = typeof grandchildrenCount === "number" && grandchildrenCount > 0;

  if (list.length === 0 && !hasGrandkids) return null;

  return (
    <div className="mt-2">
      {list.length > 0 && (
        <ul role="list" className="divide-y rounded-md border">
          {list.map((c) => {
            const prog = Math.round(c.progress_percent ?? 0);
            return (
              <li
                key={c.id}
                role="listitem"
                aria-label={ariaLabelFor(c)}
                className="flex items-center gap-2 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{c.title}</span>
                    <StatusPill status={c.status} />
                  </div>
                  <div className="mt-0.5 flex gap-3 text-xs text-gray-600">
                    <span>進捗 {prog}%</span>
                    <span>期限 {toYmd(c.deadline) ?? "—"}</span>
                  </div>
                </div>
                {/* クリックしても何も起きない（閲覧専用） */}
              </li>
            );
          })}
        </ul>
      )}

      {hasGrandkids && (
        <div className="mt-2 text-xs text-gray-600">
          孫タスク：<span className="font-medium">{grandchildrenCount}</span> 件
        </div>
      )}
    </div>
  );
}
