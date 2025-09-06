import type { SVGProps } from "react";

export default function IllustrationSearch(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 128 128" aria-hidden focusable="false" {...props}>
      {/* 検索バー */}
      <rect x="10" y="34" width="108" height="14" rx="7" fill="#eef2ff" />

      {/* ルーペ（円＋持ち手）。cx を左右にアニメーション */}
      <g>
        <circle cx="24" cy="41" r="7" stroke="#6366f1" strokeWidth="3" fill="none">
          <animate attributeName="cx" values="24;104;24" dur="2.6s" repeatCount="indefinite" />
        </circle>
        <line x1="0" y1="0" x2="0" y2="0"
              stroke="#6366f1" strokeWidth="3" strokeLinecap="round">
          <animate attributeName="x1" values="30;110;30" dur="2.6s" repeatCount="indefinite" />
          <animate attributeName="y1" values="47;47;47" dur="2.6s" repeatCount="indefinite" />
          <animate attributeName="x2" values="34;114;34" dur="2.6s" repeatCount="indefinite" />
          <animate attributeName="y2" values="51;51;51" dur="2.6s" repeatCount="indefinite" />
        </line>
      </g>

      {/* 検索結果の行 */}
      <rect x="10" y="60" width="92" height="8" rx="4" fill="#c7d2fe">
        <animate attributeName="width" values="36;92;36" dur="2.6s" repeatCount="indefinite" />
      </rect>
      <rect x="10" y="74" width="72" height="8" rx="4" fill="#e2e8f0" />
      <rect x="10" y="88" width="84" height="8" rx="4" fill="#e2e8f0" />
    </svg>
  );
}
