// src/pages/Home.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../providers/useAuth";
import Header from "../components/Header";

import IllustrationSubtasks from "../components/illustrations/IllustrationSubtasks";
import IllustrationDnd from "../components/illustrations/IllustrationDnd";
import IllustrationSearch from "../components/illustrations/IllustrationSearch";


function setOrUpdateMeta(name: string, content: string, isProperty = false) {
  const sel = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let el = document.head.querySelector<HTMLMetaElement>(sel);
  if (!el) {
    el = document.createElement("meta");
    if (isProperty) el.setAttribute("property", name);
    else el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export default function Home() {
  const nav = useNavigate();
  const { authed, signIn } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (authed) nav("/tasks", { replace: true });
  }, [authed, nav]);

  useEffect(() => {
    document.title = "Genba Tasks – 現場タスクを“見える化”";
    setOrUpdateMeta(
      "description",
      "階層タスク / 期限 & 進捗 / 画像添付 / 優先表示 に対応した現場向けタスク管理。"
    );
    setOrUpdateMeta("og:title", "Genba Tasks", true);
    setOrUpdateMeta(
      "og:description",
      "現場タスクを“見える化”。階層タスク / 期限 & 進捗 / 画像添付 / 優先表示。",
      true
    );
    setOrUpdateMeta(
      "og:image",
      (import.meta.env.VITE_OG_IMAGE as string) || "/og-home.png",
      true
    );
  }, []);

  async function handleGuest() {
    setErr(null);
    const email = import.meta.env.VITE_DEMO_EMAIL as string | undefined;
    const pass = import.meta.env.VITE_DEMO_PASS as string | undefined;
    if (!email || !pass) {
      nav("/login");
      return;
    }
    setBusy(true);
    try {
      await signIn(email, pass);
      try {
        sessionStorage.setItem("auth:demo", "1");
        window.dispatchEvent(new Event("auth:refresh"));
      } catch {}
      nav("/tasks", { replace: true });
    } catch (e: any) {
      setErr(
        e?.response?.data?.errors?.[0] ??
          "ゲストログインに失敗しました。/login からお試しください。"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* ホームではゲストバッジ非表示 */}
      <Header showDemoBadge={false} />

      {/* 背景 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(110deg, rgba(59,130,246,0.06) 0px, rgba(59,130,246,0.06) 12px, transparent 12px, transparent 44px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 -right-40 h-[34rem] w-[34rem] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(99,102,241,0.22), transparent)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-32 h-[30rem] w-[30rem] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(16,185,129,0.18), transparent)",
        }}
      />

      <main className="relative pt-14">
        {/* ヒーロー */}
        <section className="relative">
          <div className="mx-auto max-w-6xl px-4 pt-16 pb-14 md:pt-20 md:pb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
                  現場タスクを
                  <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
                    “見える化”
                  </span>
                </h1>
                <p className="mt-4 text-gray-600 text-base md:text-lg">
                  階層タスク / 期限 &amp; 進捗 / 画像添付 / 優先表示。
                  <br className="hidden md:block" />
                  チームの“今”を素早く把握し、現場の意思決定を加速します。
                </p>

                {err && (
                  <div
                    role="alert"
                    className="mt-4 max-w-lg rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                  >
                    {err}
                  </div>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => nav("/login")}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-white font-medium shadow-sm hover:bg-blue-700 active:scale-[0.99] transition"
                  >
                    今すぐログイン
                  </button>
                  <button
                    onClick={handleGuest}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-gray-900 hover:bg-gray-50 disabled:opacity-60 transition"
                  >
                    ゲストユーザーで試す
                  </button>
                </div>

                <div className="mt-6 flex flex-wrap gap-2 text-xs text-gray-700">
                  {[
                    "親タスク並び替え",
                    "進捗/期限で絞り込み",
                    "画像添付",
                    "現場名で検索",
                  ].map((t) => (
                    <span
                      key={t}
                      className="rounded-full border px-3 py-1 bg-white/70 backdrop-blur"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* 右：UI風SVG */}
              <div className="order-first md:order-last">
                <div className="relative mx-auto max-w-[520px]">
                  <div
                    className="absolute -inset-4 rounded-3xl bg-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur"
                    aria-hidden
                  />
                  <svg
                    className="relative w-full h-auto drop-shadow-sm"
                    viewBox="0 0 680 420"
                    role="img"
                    aria-label="タスク一覧のイラスト"
                  >
                    <rect x="20" y="20" width="640" height="380" rx="18" fill="#fff" />
                    <rect x="40" y="48" width="140" height="16" rx="8" fill="#e5e7eb" />
                    <rect x="200" y="44" width="320" height="24" rx="12" fill="#dbeafe" />
                    <rect x="40" y="100" width="600" height="64" rx="12" fill="#f8fafc" />
                    <rect x="56" y="118" width="260" height="14" rx="7" fill="#94a3b8" />
                    <rect x="56" y="140" width="180" height="10" rx="5" fill="#cbd5e1" />
                    <rect x="40" y="184" width="600" height="64" rx="12" fill="#f8fafc" />
                    <rect x="56" y="202" width="300" height="14" rx="7" fill="#94a3b8" />
                    <rect x="56" y="224" width="220" height="10" rx="5" fill="#cbd5e1" />
                    <rect x="40" y="268" width="600" height="64" rx="12" fill="#f8fafc" />
                    <rect x="56" y="286" width="240" height="14" rx="7" fill="#94a3b8" />
                    <rect x="56" y="308" width="200" height="10" rx="5" fill="#cbd5e1" />
                    {[110, 194, 278].map((y, i) => (
                      <g key={i}>
                        <rect x="560" y={y} width="62" height="12" rx="6" fill="#e5e7eb" />
                        <rect x="560" y={y} width={26 + 12 * i} height="12" rx="6" fill="#60a5fa" />
                      </g>
                    ))}
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 機能紹介 */}
        <section className="relative pb-14 md:pb-20">
          <div className="mx-auto max-w-6xl px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 1. サブタスク管理 */}
            <article className="rounded-3xl bg-white/90 border shadow-sm hover:shadow-md transition p-6 text-center">
              <div className="mb-4">
                <IllustrationSubtasks className="mx-auto h-28 w-28" />
              </div>
              <h3 className="mt-1 text-2xl font-bold">サブタスク管理</h3>
              <p className="mt-2 text-sm text-gray-600 leading-6">
                タスクを親子関係で階層化。<br />
                大きな作業を小さな実行単位へ分割し、担当割りや進捗確認を分かりやすくします。
              </p>
            </article>

            {/* 2. ドラッグ&ドロップ */}
            <article className="rounded-3xl bg-white/90 border shadow-sm hover:shadow-md transition p-6 text-center">
              <div className="mb-4">
                <IllustrationDnd className="mx-auto h-28 w-28" />
              </div>
              <h3 className="mt-1 text-2xl font-bold">ドラッグ&ドロップ</h3>
              <p className="mt-2 text-sm text-gray-600 leading-6">
                並び替えは<strong>親タスク同士のみ</strong>対応。<br />
                子タスクの並び替えや階層移動は対象外です。<br />
                直感操作で上位の順序を素早く整えられます。
              </p>
            </article>

            {/* 3. タスク検索 */}
            <article className="rounded-3xl bg-white/90 border shadow-sm hover:shadow-md transition p-6 text-center">
              <div className="mb-4">
                <IllustrationSearch className="mx-auto h-28 w-28" />
              </div>
              <h3 className="text-2xl font-bold">タスク検索</h3>
              <p className="mt-2 text-sm text-gray-600 leading-6">
                検索は<strong>現場名</strong>を対象。<br />
                絞り込みは<strong>進捗%</strong>と<strong>期限</strong>に対応し、<br />
                並び替えも<strong>進捗 / 期限</strong>から選べます。
              </p>
            </article>
          </div>

          <div className="mx-auto mt-10 max-w-6xl px-4 text-center">
            <button
              onClick={() => nav("/login")}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-white font-medium shadow hover:bg-emerald-700 active:scale-[0.99] transition"
            >
              始める
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
