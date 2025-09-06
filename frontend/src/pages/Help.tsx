import type { PageComponent } from "../types";

const Help: PageComponent = () => {
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-8">
      <header>
        <h1 className="text-xl font-semibold">ヘルプ</h1>
        <p className="text-sm text-gray-600 mt-1">
          よく使う機能だけを短くまとめました。
        </p>
      </header>

      {/* 優先タスク */}
      <section id="priority" className="space-y-2">
        <h2 className="text-lg font-medium flex items-center gap-2">
          優先タスク
          <span
            aria-label="優先タスクの説明"
            title="優先タスク＝期限が近い順で表示されます。"
            className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[11px]"
          >
            i
          </span>
        </h2>
        <p className="text-sm text-gray-700">
          <strong>優先タスク＝期限が近い順</strong>で表示します。近日のタスクほど上に来ます。
        </p>
      </section>

      {/* 画像アップロード */}
      <section id="images" className="space-y-2">
        <h2 className="text-lg font-medium">画像の扱い</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
          <li>1ファイル <strong>5MBまで</strong>（<code>jpg</code>/<code>png</code>/<code>webp</code>）</li>
          <li>画像はタスクから<strong>置換</strong>・<strong>削除</strong>できます</li>
        </ul>
      </section>

      {/* 操作TIPS */}
      <section id="tips" className="space-y-2">
        <h2 className="text-lg font-medium">操作TIPS</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
          <li><kbd className="px-1 py-0.5 rounded border">Enter</kbd> で親タスク作成</li>
          <li>ドラッグ&ドロップで階層の入れ替え</li>
          <li>検索・絞り込みは画面上部のバーから</li>
        </ul>
      </section>

      {/* 問い合わせ */}
      <section id="contact" className="space-y-2">
        <h2 className="text-lg font-medium">問い合わせ</h2>
        <p className="text-sm text-gray-700">
          不具合や要望は GitHub リポジトリへどうぞ：{" "}
          <a
            href={import.meta.env.VITE_REPO_URL || "https://github.com/"}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline underline-offset-2"
          >
            GitHub Repository
          </a>
        </p>
      </section>
    </div>
  );
};

export default Help;
