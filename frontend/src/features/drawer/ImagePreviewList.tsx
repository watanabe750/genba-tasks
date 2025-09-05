import React, { useState } from "react";

type Props = {
  url: string;        // 原寸URL
  title: string;
  thumbUrl?: string;  // 追加: サムネURL（あれば優先）
};

export default function ImagePreview({ url, title, thumbUrl }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState<Error | null>(null);

  const display = thumbUrl || url;

  if (err) {
    return (
      <figure className="rounded-md border bg-gray-50">
        <div className="flex h-44 items-center justify-center text-xs text-gray-500">
          画像を読み込めませんでした
        </div>
        <figcaption className="border-t px-3 py-2 text-[11px] text-gray-600">
          画像プレビュー（クリックで原寸表示）
        </figcaption>
      </figure>
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
          src={display}
          alt={`${title} の画像`}
          className={`block h-44 w-full object-cover ${loaded ? "" : "hidden"}`}
          onLoad={() => setLoaded(true)}
          onError={() => setErr(new Error("image load failed"))}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />
        {!loaded && <div className="h-44 w-full animate-pulse bg-gray-200" aria-hidden />}
      </a>
      <figcaption className="border-t px-3 py-2 text-[11px] text-gray-600">
        画像プレビュー（クリックで原寸表示）
      </figcaption>
    </figure>
  );
}
