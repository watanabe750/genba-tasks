import React from "react";

export default function IllustrationDnd({ className = "h-28 w-28" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label="親タスク同士のドラッグ＆ドロップによる並び替え">
      <defs>
        <linearGradient id="card-bg2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ECF3FF" />
          <stop offset="1" stopColor="#F9FBFF" />
        </linearGradient>
      </defs>

      <rect x="10" y="16" width="180" height="168" rx="16" fill="url(#card-bg2)" />

      {/* 固定行（上） */}
      <g transform="translate(20,44)">
        <rect width="160" height="24" rx="8" fill="#EEF3FF" />
        <g transform="translate(10,6)" fill="#A6B7E8">
          <rect width="3" height="12" rx="1.5" /><rect x="6" width="3" height="12" rx="1.5" />
        </g>
        <rect x="130" y="6" width="30" height="12" rx="6" fill="#C9D7FF" />
      </g>

      {/* 掴んでいる行（アニメで上下へ） */}
      <g>
        <g transform="translate(20,80)">
          <rect width="160" height="24" rx="8" fill="#D7E5FF" stroke="#6EA8FF" />
          <g transform="translate(10,6)" fill="#6EA8FF">
            <rect width="3" height="12" rx="1.5" /><rect x="6" width="3" height="12" rx="1.5" />
          </g>
          <rect x="130" y="6" width="30" height="12" rx="6" fill="#9EC2FF" />
        </g>
        {/* アニメーション（上下移動） */}
        <animateTransform
          attributeName="transform"
          type="translate"
          from="0 0"
          values="0 0; 0 34; 0 0"
          dur="2.2s"
          repeatCount="indefinite"
        />
      </g>

      {/* ドロップ先ガイド（点線） */}
      <g transform="translate(20,114)">
        <rect width="160" height="24" rx="8" fill="none" stroke="#B8C6EA" strokeDasharray="4 4" />
      </g>

      {/* 下矢印（点滅） */}
      <g transform="translate(100,108)">
        <line y1="0" y2="18" stroke="#6EA8FF" strokeWidth="2" />
        <path d="M -5 14 L 0 20 L 5 14" fill="#6EA8FF">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="1.1s" repeatCount="indefinite" />
        </path>
      </g>

      {/* 掴んでいる手 */}
      <g transform="translate(142,86)" opacity="0.9">
        <rect x="0" y="0" width="18" height="16" rx="4" fill="#1F6FEB" opacity="0.15" />
        <rect x="3" y="3" width="12" height="3" rx="1.5" fill="#1F6FEB" />
        <rect x="3" y="8" width="10" height="3" rx="1.5" fill="#1F6FEB" />
      </g>
    </svg>
  );
}
