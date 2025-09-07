import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Help() {
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    try { setIsDemo(sessionStorage.getItem("auth:demo") === "1"); } catch {}
    document.title = "ヘルプ - Genba Tasks";
  }, []);

  // 開発用：認証キャッシュをクリア（本番では表示しない）
  const showDevTools = import.meta.env.DEV;
  const clearAuthCache = () => {
    try {
      const keys = ["access-token", "client", "uid", "token-type", "expiry"];
      keys.forEach((k) => localStorage.removeItem(k));
      ["auth:from", "auth:expired", "auth:demo"].forEach((k) =>
        sessionStorage.removeItem(k)
      );
      window.dispatchEvent(new Event("auth:refresh"));
      alert("ローカルの認証キャッシュをクリアしました。");
    } catch {}
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">ヘルプ</h1>
      <p className="text-gray-600 mb-6">よく使う機能だけを短くまとめました。</p>

      {/* デモ環境バナー */}
      {isDemo && (
        <div
          role="note"
          className="mb-6 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
          data-testid="help-demo-banner"
        >
          これは<strong>ゲスト環境</strong>です。データは定期的に初期化される場合があります。個人情報の入力は避けてください。
        </div>
      )}

      {/* 目次 */}
      <nav className="mb-6 text-sm text-gray-600">
        <ul className="list-disc list-inside space-y-1">
          <li><a href="#quickstart" className="underline decoration-dotted">クイックスタート</a></li>
          <li><a href="#features" className="underline decoration-dotted">機能の要点</a></li>
          <li><a href="#tips" className="underline decoration-dotted">操作TIPS</a></li>
          <li><a href="#faq" className="underline decoration-dotted">よくある質問</a></li>
          <li><a href="#contact" className="underline decoration-dotted">問い合わせ</a></li>
        </ul>
      </nav>

      {/* クイックスタート */}
      <section id="quickstart" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">クイックスタート</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>
            <Link to="/tasks" className="text-blue-600 underline">タスク画面</Link>で
            上部の「上位タスクを作成」から親タスクを追加
          </li>
          <li>必要に応じて子タスクを追加して階層化</li>
          <li>進捗％・期限を入れて、右側の優先タスクパネルで緊急度を把握</li>
        </ol>
      </section>

      {/* 機能の要点 */}
      <section id="features" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">機能の要点</h2>

        <div className="space-y-4 text-gray-700">
          <div>
            <h3 className="font-medium">優先タスク</h3>
            <p className="mt-1">
              期限が近い順に表示。近日のタスクほど上に来ます。
            </p>
          </div>

          <div>
            <h3 className="font-medium">画像の扱い</h3>
            <ul className="mt-1 list-disc list-inside">
              <li>1ファイル <strong>5MBまで</strong>（jpg / png / webp）</li>
              <li>画像はタスクから<strong>追加・置換・削除</strong>できます</li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium">検索・並び替え・絞り込み</h3>
            <ul className="mt-1 list-disc list-inside">
              <li>検索は<strong>現場名</strong>のみ対象</li>
              <li>絞り込み：<strong>進捗％</strong> と <strong>期限</strong></li>
              <li>並び替え：<strong>進捗 / 期限</strong></li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium">ドラッグ＆ドロップ</h3>
            <p className="mt-1">
              並び替えは<strong>親タスク同士のみ</strong>対応。子タスクの並び替え・階層移動は対象外です。
            </p>
          </div>
        </div>
      </section>

      {/* 操作TIPS */}
      <section id="tips" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">操作TIPS</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li><kbd className="px-1.5 py-0.5 rounded border bg-white">Enter</kbd> で親タスク作成</li>
          <li>親タスクはドラッグで並び替え</li>
          <li>検索・絞り込みは画面上部のバーから</li>
        </ul>
      </section>

      {/* FAQ */}
      <section id="faq" className="mb-10">
        <h2 className="text-xl font-semibold mb-2">よくある質問</h2>
        <div className="space-y-4 text-gray-700">
          <div>
            <p className="font-medium">Q. ドラッグできません</p>
            <p className="mt-1">A. 子タスクはドラッグ対象外です。親タスク同士のみ並び替えできます。</p>
          </div>
          <div>
            <p className="font-medium">Q. 検索でヒットしません</p>
            <p className="mt-1">A. 検索対象は<strong>現場名</strong>のみです。その他の条件は絞り込みをご利用ください。</p>
          </div>
          <div>
            <p className="font-medium">Q. 画像のアップロードに失敗します</p>
            <p className="mt-1">A. 5MB以下、拡張子は jpg / png / webp に対応しています。</p>
          </div>
          <div>
            <p className="font-medium">Q. 「セッションの有効期限が切れました」と出ます</p>
            <p className="mt-1">
              A. 一度ログインし直してください。必要に応じてブラウザのタブを再読み込みしてください。
            </p>
          </div>
          {isDemo && (
            <div>
              <p className="font-medium">Q. 入力したデータが消えました</p>
              <p className="mt-1">
                A. ゲスト環境ではデータが定期的に初期化される場合があります。ご了承ください。
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 問い合わせ */}
      <section id="contact" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">問い合わせ</h2>
        <p className="text-gray-700">
          不具合や要望は GitHub リポジトリへどうぞ：{" "}
          <a
            className="text-blue-600 underline"
            href="https://github.com/your-org-or-user/your-repo"
            target="_blank"
            rel="noreferrer"
          >
            GitHub Repository
          </a>
        </p>
      </section>

      {/* 開発者向けツール */}
      {showDevTools && (
        <div className="mt-8 border-t pt-4">
          <h2 className="text-sm font-semibold text-gray-500 mb-2">Dev only</h2>
          <button
            onClick={clearAuthCache}
            className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
          >
            認証キャッシュをクリア（localStorage / sessionStorage）
          </button>
        </div>
      )}
    </div>
  );
}
