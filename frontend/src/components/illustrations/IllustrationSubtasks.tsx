import type { SVGProps } from "react";

export default function IllustrationSubtasks(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 128 128" aria-hidden focusable="false" {...props}>
      <defs>
        <linearGradient id="subtasks-g" x1="0" x2="1">
          <stop offset="0" stopColor="#60a5fa" />
          <stop offset="1" stopColor="#34d399" />
        </linearGradient>
      </defs>

      {/* 背景カード */}
      <rect x="6" y="18" width="116" height="92" rx="12" fill="#eef2ff" />

      {/* 子カード（上下へふわっと移動） */}
      <rect x="18" y="34" width="30" height="18" rx="4" fill="url(#subtasks-g)" opacity="0.9">
        <animate attributeName="y" values="34;52;34" dur="2.8s" repeatCount="indefinite" />
      </rect>

      {/* タイトル行（幅がほんのり伸縮） */}
      <rect x="52" y="36" width="60" height="6" rx="3" fill="#a5b4fc">
        <animate attributeName="width" values="60;48;60" dur="2.8s" repeatCount="indefinite" />
      </rect>
      <rect x="52" y="46" width="44" height="5" rx="2.5" fill="#c7d2fe" />

      {/* 区切り線 & 説明行 */}
      <rect x="18" y="66" width="92" height="6" rx="3" fill="#dbeafe" />
      <rect x="18" y="78" width="70" height="6" rx="3" fill="#e2e8f0" />
    </svg>
  );
}
