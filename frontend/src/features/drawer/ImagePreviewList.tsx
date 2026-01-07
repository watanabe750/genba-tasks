// src/features/drawer/ImagePreviewList.tsx
import { memo, useState } from "react";

type Props = { url: string; title?: string; thumbUrl?: string };

/** Drawerの画像プレビュー（hiddenにせず常時描画 / data-testid 付与） */
function ImagePreview({ url, title = "", thumbUrl }: Props) {
  const [failed, setFailed] = useState(false);
  const src = thumbUrl || url;

  if (failed) {
    return (
      <div className="rounded border bg-red-50 p-3 text-xs text-red-700">
        画像の読み込みに失敗しました
      </div>
    );
  }

  return (
    <figure className="rounded-md border bg-white">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
        aria-label="画像を新しいタブで開く"
      >
        <img
          data-testid="drawer-image"
          src={src}
          alt={title ? `${title} の画像` : "画像"}
          className="block h-44 w-full object-contain"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      </a>
      <figcaption className="border-t px-3 py-2 text-[11px] text-gray-600">
        画像プレビュー（クリックで原寸表示）
      </figcaption>
    </figure>
  );
}

export default memo(ImagePreview);
