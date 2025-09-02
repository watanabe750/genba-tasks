import React from "react";
import type { Status } from "../type";

const LABEL: Record<Status, string> = {
  not_started: "未着手",
  in_progress: "進行中",
  completed: "完了",
};

const COLOR: Record<Status, string> = {
  not_started: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
};

export default function StatusPill({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${COLOR[status]}`}>
      {LABEL[status]}
    </span>
  );
}
