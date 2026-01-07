// src/pages/Home.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../providers/useAuth";
import Header from "../components/Header";
import { getUserMessage, logError } from "../lib/errorHandler";

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
  const heroPills = [
    "工程・検査の進捗を一覧化",
    "写真・図面を現場で即共有",
    "期限と優先度でソート/絞り込み",
    "ドラッグで親タスクを並び替え",
  ];
  const heroTasks = [
    { title: "基礎配筋検査", meta: "今日 15:00 / 現場A・施工管理", progress: 76, badge: "検査" },
    { title: "足場安全点検", meta: "安全担当・図面 A-12", progress: 38, badge: "安全" },
    { title: "是正報告アップロード", meta: "写真 6 件添付 / 現場B", progress: 82, badge: "共有" },
  ];
  const heroStats = [
    { label: "本日の完了工程", value: "12件", diff: "+3 vs 昨日", tone: "from-emerald-400 to-emerald-500" },
    { label: "期限超過タスク", value: "2件", diff: "是正進行中", tone: "from-amber-300 to-orange-400" },
    { label: "レビュー待ち", value: "5件", diff: "更新 08:10", tone: "from-sky-400 to-cyan-300" },
  ];

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
    } catch (e: unknown) {
      logError(e, 'Home - Guest Login');
      const msg = getUserMessage(e);
      setErr(msg || "ゲストログインに失敗しました。/login からお試しください。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* ホームではゲストバッジ非表示 */}
      <Header showDemoBadge={false} />

      <main className="relative pt-14">
        {/* ヒーロー */}
        <section className="relative isolate overflow-hidden">
          {/* Enhanced Background Layers */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-100"
            style={{
              background:
                "conic-gradient(from 140deg at 20% 30%, rgba(56,189,248,0.28), rgba(16,185,129,0.2), transparent 45%), radial-gradient(circle at 18% 20%, rgba(59,130,246,0.3), transparent 38%), radial-gradient(circle at 82% 18%, rgba(16,185,129,0.28), transparent 35%), radial-gradient(circle at 38% 88%, rgba(59,130,246,0.22), transparent 35%), radial-gradient(circle at 65% 85%, rgba(245,158,11,0.15), transparent 28%), linear-gradient(135deg, #020617 0%, #0c1428 40%, #0f172a 100%)",
            }}
          />
          {/* Animated Grid */}
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.08)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(56,189,248,0.08)_1.5px,transparent_1.5px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_30%,#000_20%,transparent_100%)]"
          />
          {/* Floating Gradient Orbs */}
          <div
            aria-hidden
            className="absolute left-[10%] top-[20%] h-[600px] w-[600px] rounded-full bg-gradient-to-br from-sky-400/30 via-cyan-400/20 to-transparent blur-[100px] animate-pulse"
            style={{ animationDuration: "8s" }}
          />
          <div
            aria-hidden
            className="absolute right-[5%] top-[10%] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-emerald-400/25 via-green-400/15 to-transparent blur-[90px] animate-pulse"
            style={{ animationDuration: "10s", animationDelay: "1s" }}
          />

          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-16 lg:grid-cols-12 min-h-[calc(100svh-56px)] py-16 lg:py-24">
              {/* 左カラム */}
              <div className="space-y-8 lg:col-span-5 z-10">
                {/* Badge Section */}
                <div className="flex flex-wrap items-center gap-3 animate-[fadeIn_0.6s_ease-out]">
                  <div className="inline-flex items-center gap-2.5 rounded-full border border-sky-400/30 bg-gradient-to-r from-sky-500/15 via-emerald-500/10 to-sky-500/15 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.35em] text-sky-100 shadow-lg shadow-sky-500/20 backdrop-blur-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                    </span>
                    Construction Ops
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
                    階層タスク / 期限・進捗 / 画像添付
                  </div>
                </div>

                {/* Main Heading */}
                <h1
                  className="font-extrabold leading-[1.2] tracking-tight drop-shadow-2xl animate-[fadeIn_0.8s_ease-out_0.1s_both]"
                  style={{ fontFamily: "\"Space Grotesk\", \"Noto Sans JP\", system-ui, -apple-system, sans-serif" }}
                >
                  <span className="block text-white text-[clamp(32px,4.5vw,54px)]">現場のすべてを</span>
                  <span className="block text-[clamp(28px,4vw,48px)] text-white/90">１つに</span>
                  <span className="block bg-gradient-to-r from-sky-400 via-emerald-300 to-emerald-500 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(56,189,248,0.5)] text-[clamp(48px,7vw,88px)] mt-1">
                    見える化
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="max-w-xl text-base md:text-lg text-slate-200/90 leading-relaxed font-medium animate-[fadeIn_1s_ease-out_0.2s_both]">
                  工程・是正・安全のタスクを階層管理。期限・進捗・写真・図面をまとめて共有し、
                  <br className="hidden sm:block" />
                  現場の温度感をリアルタイムに可視化。判断を早く、漏れなく。
                </p>

                {err && (
                  <div
                    role="alert"
                    className="mt-3 max-w-xl rounded-2xl border border-red-500/40 bg-red-500/15 px-5 py-4 text-sm text-red-50 backdrop-blur-sm shadow-lg shadow-red-500/10"
                  >
                    {err}
                  </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl animate-[fadeIn_1.2s_ease-out_0.3s_both]">
                  {heroStats.map((stat, idx) => (
                    <div
                      key={stat.label}
                      className="group relative rounded-2xl border border-white/15 bg-gradient-to-br from-white/10 via-white/5 to-transparent px-5 py-4 shadow-xl hover:shadow-2xl hover:border-white/25 hover:scale-105 transition-all duration-300 backdrop-blur-md"
                      style={{ animationDelay: `${0.4 + idx * 0.1}s` }}
                    >
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-sky-400/0 to-emerald-400/0 group-hover:from-sky-400/10 group-hover:to-emerald-400/10 transition-all duration-500" />
                      <div className="relative">
                        <p className="text-[10px] uppercase tracking-[0.25em] text-white/70 font-semibold">{stat.label}</p>
                        <p className="mt-2.5 text-3xl font-bold text-white bg-gradient-to-br from-white to-white/80 bg-clip-text">{stat.value}</p>
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/90 font-medium border border-white/10">
                          <span
                            className={`inline-block h-2 w-2 rounded-full bg-gradient-to-r ${stat.tone} shadow-lg`}
                          />
                          {stat.diff}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-wrap items-center gap-4 pt-4 animate-[fadeIn_1.4s_ease-out_0.5s_both]">
                  <button
                    onClick={() => nav("/register")}
                    className="group relative inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-sky-400 via-emerald-300 to-emerald-500 px-8 py-4 text-base font-bold text-slate-900 shadow-[0_20px_60px_-20px_rgba(52,211,153,1)] hover:shadow-[0_25px_70px_-15px_rgba(52,211,153,1)] transition-all duration-300 hover:translate-y-[-2px] hover:scale-105 active:scale-100"
                  >
                    <span className="relative z-10">今すぐ始める</span>
                    <span aria-hidden className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400 to-sky-400 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                  </button>
                  <button
                    onClick={handleGuest}
                    disabled={busy}
                    className="group inline-flex items-center gap-2.5 rounded-2xl border border-white/25 bg-white/10 hover:bg-white/15 px-6 py-4 text-base font-semibold text-white disabled:opacity-60 transition-all duration-300 hover:border-white/40 hover:scale-105 active:scale-100 backdrop-blur-sm"
                  >
                    ゲストユーザーで試す
                  </button>
                </div>

                <p className="text-sm text-slate-300 font-medium animate-[fadeIn_1.6s_ease-out_0.6s_both]">
                  すでにアカウントをお持ちの方は{" "}
                  <button
                    onClick={() => nav("/login")}
                    className="text-sky-300 hover:text-sky-200 underline decoration-sky-400/50 hover:decoration-sky-300 underline-offset-4 transition-colors font-semibold"
                  >
                    ログイン
                  </button>
                </p>

                {/* Feature Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 max-w-2xl animate-[fadeIn_1.8s_ease-out_0.7s_both]">
                  {heroPills.map((t) => (
                    <div
                      key={t}
                      className="group rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 px-4 py-3 text-xs text-slate-100 font-medium shadow-lg hover:shadow-xl hover:border-white/25 transition-all duration-300 backdrop-blur-sm hover:scale-105"
                    >
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              {/* 右カラム：Enhanced Dashboard Preview */}
              <div className="order-first lg:order-last lg:col-span-7 z-10 lg:pl-8">
                <div className="relative lg:ml-auto max-w-3xl animate-[fadeIn_1s_ease-out_0.4s_both]">
                  {/* Glow Effects */}
                  <div
                    aria-hidden
                    className="absolute -left-12 -top-16 h-64 w-64 rounded-full bg-sky-400/40 blur-[120px] animate-pulse"
                    style={{ animationDuration: "6s" }}
                  />
                  <div
                    aria-hidden
                    className="absolute -right-12 -bottom-20 h-72 w-72 rounded-full bg-emerald-400/35 blur-[120px] animate-pulse"
                    style={{ animationDuration: "8s", animationDelay: "1s" }}
                  />

                  {/* Main Dashboard Card */}
                  <div className="group relative rounded-[32px] border border-white/20 bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-3xl shadow-[0_50px_120px_-40px_rgba(0,0,0,0.9)] hover:shadow-[0_60px_140px_-30px_rgba(0,0,0,0.95)] transition-all duration-500 overflow-hidden hover:scale-[1.02]">
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-[shimmer_2s_ease-in-out] pointer-events-none" />

                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 bg-white/5 px-6 py-5 backdrop-blur-sm">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-sky-300/90 font-semibold">Ops Dashboard</p>
                        <p className="text-xl font-bold bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">現場タスクの進捗</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="relative inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500/25 to-emerald-400/20 px-3 py-1.5 text-[11px] font-bold text-emerald-100 border border-emerald-400/40 shadow-lg shadow-emerald-500/20">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-300"></span>
                          </span>
                          Live Sync
                        </span>
                        <span className="rounded-full bg-white/15 px-3 py-1.5 text-[11px] text-white/80 font-medium border border-white/15 backdrop-blur-sm">
                          期限 / 進捗 / 添付
                        </span>
                      </div>
                    </div>

                    {/* Content Grid */}
                    <div className="grid gap-5 px-6 py-6 lg:grid-cols-[1.1fr_0.9fr]">
                      {/* Task Cards */}
                      <div className="space-y-3">
                        {heroTasks.map((task, idx) => (
                          <div
                            key={task.title}
                            className="group/task rounded-2xl border border-white/15 bg-slate-950/60 hover:bg-slate-950/70 px-5 py-4 shadow-lg hover:shadow-xl hover:border-white/25 transition-all duration-300 backdrop-blur-sm hover:scale-[1.02]"
                            style={{ animationDelay: `${0.6 + idx * 0.1}s` }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">{task.title}</p>
                                <p className="text-xs text-slate-300/90 mt-1.5 font-medium">{task.meta}</p>
                              </div>
                              <span className="flex-shrink-0 rounded-full bg-white/15 group-hover/task:bg-white/20 px-3 py-1 text-[11px] text-white/80 font-semibold border border-white/15 transition-colors">
                                {task.badge}
                              </span>
                            </div>
                            <div className="mt-4 h-2 rounded-full bg-white/15 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-sky-400 via-emerald-300 to-emerald-400 shadow-lg shadow-emerald-500/30 transition-all duration-500 group-hover/task:shadow-emerald-500/50"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Info Panels */}
                      <div className="space-y-4">
                        {/* Risk Panel */}
                        <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-white/10 to-white/5 px-5 py-4 shadow-lg backdrop-blur-sm hover:border-white/25 transition-all duration-300">
                          <p className="text-xs uppercase tracking-[0.25em] text-sky-300/90 font-semibold">今日のリスク</p>
                          <div className="mt-3 space-y-2.5 text-sm text-white/90">
                            <div className="flex items-center justify-between rounded-xl bg-white/10 hover:bg-white/15 px-3 py-2.5 transition-colors group/risk">
                              <span className="font-medium">期限超過</span>
                              <span className="rounded-full bg-gradient-to-r from-amber-400/30 to-orange-400/20 px-3 py-1 text-amber-50 text-xs font-bold border border-amber-400/30">2件</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-white/10 hover:bg-white/15 px-3 py-2.5 transition-colors group/risk">
                              <span className="font-medium">レビュー待ち</span>
                              <span className="rounded-full bg-gradient-to-r from-sky-400/30 to-cyan-400/20 px-3 py-1 text-sky-50 text-xs font-bold border border-sky-400/30">5件</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-white/10 hover:bg-white/15 px-3 py-2.5 transition-colors group/risk">
                              <span className="font-medium">画像添付あり</span>
                              <span className="rounded-full bg-gradient-to-r from-emerald-400/30 to-green-400/20 px-3 py-1 text-emerald-50 text-xs font-bold border border-emerald-400/30">6件</span>
                            </div>
                          </div>
                        </div>

                        {/* Filter Panel */}
                        <div className="rounded-2xl border border-white/15 bg-slate-950/70 px-5 py-4 shadow-lg backdrop-blur-sm hover:border-white/25 transition-all duration-300">
                          <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/90 font-semibold">検索・絞り込み</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {["現場名で検索", "進捗%", "期限", "優先表示", "親タスク並び替え"].map((f) => (
                              <span
                                key={f}
                                className="rounded-full bg-white/15 hover:bg-white/20 px-3 py-1.5 text-[11px] text-white/90 font-medium border border-white/15 transition-colors hover:border-white/25"
                              >
                                {f}
                              </span>
                            ))}
                          </div>
                          <p className="mt-3 text-[10px] text-white/60 leading-relaxed">実装済みの絞り込み機能だけを表示しています。</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 機能紹介 */}
        <section className="relative isolate mt-20 rounded-t-[48px] pb-24 md:pb-32 bg-slate-950 text-white border-t border-white/20 overflow-hidden">
          {/* Enhanced Background */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-90"
            style={{
              background:
                "radial-gradient(circle at 20% 0%, rgba(56,189,248,0.18), transparent 38%), radial-gradient(circle at 80% 0%, rgba(52,211,153,0.16), transparent 35%), radial-gradient(circle at 50% 100%, rgba(99,102,241,0.12), transparent 40%), linear-gradient(180deg, rgba(2,6,23,0.95) 0%, rgba(15,23,42,0.98) 100%)",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px]"
          />
          <div className="absolute inset-x-0 -top-16 h-24 bg-gradient-to-b from-transparent via-slate-900/70 to-slate-950 rounded-t-[48px]" aria-hidden />

          {/* Floating Orbs */}
          <div
            aria-hidden
            className="absolute left-[15%] top-[20%] h-96 w-96 rounded-full bg-gradient-to-br from-violet-500/20 to-transparent blur-[100px] animate-pulse"
            style={{ animationDuration: "7s" }}
          />
          <div
            aria-hidden
            className="absolute right-[10%] bottom-[30%] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-sky-500/15 to-transparent blur-[110px] animate-pulse"
            style={{ animationDuration: "9s", animationDelay: "2s" }}
          />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
            {/* Section Header */}
            <div className="text-center pt-20 pb-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-sky-200 mb-6 backdrop-blur-sm">
                Features
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                現場を変える
                <span className="block mt-2 bg-gradient-to-r from-sky-400 via-emerald-300 to-emerald-500 bg-clip-text text-transparent">
                  3つのコア機能
                </span>
              </h2>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
                施工管理の複雑さをシンプルに。直感的な操作で現場の生産性を最大化します。
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* 1. サブタスク管理 */}
              <article className="group relative rounded-3xl bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/15 shadow-2xl hover:shadow-[0_30px_90px_-30px_rgba(56,189,248,0.4)] hover:border-sky-400/40 hover:-translate-y-2 transition-all duration-500 p-8 text-center backdrop-blur-md overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/0 via-sky-400/0 to-transparent group-hover:from-sky-500/10 group-hover:via-sky-400/5 transition-all duration-500 rounded-3xl" />
                <div className="relative">
                  <div className="mb-6 relative">
                    <div className="absolute inset-0 bg-sky-400/20 blur-2xl rounded-full scale-75 group-hover:scale-100 transition-transform duration-500" />
                    <IllustrationSubtasks className="relative mx-auto h-32 w-32 drop-shadow-2xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 bg-gradient-to-br from-white to-white/90 bg-clip-text">
                    サブタスク管理
                  </h3>
                  <p className="text-sm text-slate-200/90 leading-7 font-medium">
                    タスクを親子関係で階層化。
                    <br />
                    大きな作業を小さな実行単位へ分割し、担当割りや進捗確認を分かりやすくします。
                  </p>
                  <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-sky-400/20 border border-sky-400/30 px-4 py-2 text-xs font-semibold text-sky-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                    階層構造で整理
                  </div>
                </div>
              </article>

              {/* 2. ドラッグ&ドロップ */}
              <article className="group relative rounded-3xl bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/15 shadow-2xl hover:shadow-[0_30px_90px_-30px_rgba(52,211,153,0.4)] hover:border-emerald-400/40 hover:-translate-y-2 transition-all duration-500 p-8 text-center backdrop-blur-md overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-400/0 to-transparent group-hover:from-emerald-500/10 group-hover:via-emerald-400/5 transition-all duration-500 rounded-3xl" />
                <div className="relative">
                  <div className="mb-6 relative">
                    <div className="absolute inset-0 bg-emerald-400/20 blur-2xl rounded-full scale-75 group-hover:scale-100 transition-transform duration-500" />
                    <IllustrationDnd className="relative mx-auto h-32 w-32 drop-shadow-2xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 bg-gradient-to-br from-white to-white/90 bg-clip-text">
                    ドラッグ&ドロップ
                  </h3>
                  <p className="text-sm text-slate-200/90 leading-7 font-medium">
                    並び替えは<strong className="text-emerald-300">親タスク同士のみ</strong>対応。
                    <br />
                    子タスクの並び替えや階層移動は対象外です。
                    <br />
                    直感操作で上位の順序を素早く整えられます。
                  </p>
                  <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-400/20 border border-emerald-400/30 px-4 py-2 text-xs font-semibold text-emerald-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    直感的な操作
                  </div>
                </div>
              </article>

              {/* 3. タスク検索 */}
              <article className="group relative rounded-3xl bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/15 shadow-2xl hover:shadow-[0_30px_90px_-30px_rgba(168,85,247,0.4)] hover:border-purple-400/40 hover:-translate-y-2 transition-all duration-500 p-8 text-center backdrop-blur-md overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-violet-400/0 to-transparent group-hover:from-purple-500/10 group-hover:via-violet-400/5 transition-all duration-500 rounded-3xl" />
                <div className="relative">
                  <div className="mb-6 relative">
                    <div className="absolute inset-0 bg-purple-400/20 blur-2xl rounded-full scale-75 group-hover:scale-100 transition-transform duration-500" />
                    <IllustrationSearch className="relative mx-auto h-32 w-32 drop-shadow-2xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 bg-gradient-to-br from-white to-white/90 bg-clip-text">
                    タスク検索
                  </h3>
                  <p className="text-sm text-slate-200/90 leading-7 font-medium">
                    検索は<strong className="text-purple-300">現場名</strong>を対象。
                    <br />
                    絞り込みは<strong className="text-purple-300">進捗%</strong>と<strong className="text-purple-300">期限</strong>に対応し、
                    <br />
                    並び替えも<strong className="text-purple-300">進捗 / 期限</strong>から選べます。
                  </p>
                  <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-purple-400/20 border border-purple-400/30 px-4 py-2 text-xs font-semibold text-purple-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                    高速検索・絞り込み
                  </div>
                </div>
              </article>
            </div>

            {/* CTA Section */}
            <div className="mx-auto mt-20 max-w-3xl text-center relative">
              <div className="relative rounded-3xl border border-white/20 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-12 backdrop-blur-xl shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 via-emerald-500/10 to-purple-500/10 opacity-50" />
                <div className="relative">
                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
                    今すぐ始めて、
                    <span className="block mt-2 bg-gradient-to-r from-sky-400 via-emerald-300 to-emerald-500 bg-clip-text text-transparent">
                      現場の生産性を向上
                    </span>
                  </h3>
                  <p className="text-slate-200 mb-8 text-lg font-medium">
                    無料で始められます。クレジットカード不要。
                  </p>
                  <button
                    onClick={() => nav("/register")}
                    className="group relative inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-sky-400 via-emerald-300 to-emerald-500 px-10 py-5 text-lg font-bold text-slate-900 shadow-[0_25px_70px_-20px_rgba(52,211,153,1)] hover:shadow-[0_30px_80px_-15px_rgba(52,211,153,1)] transition-all duration-300 hover:translate-y-[-3px] hover:scale-105 active:scale-100"
                  >
                    <span className="relative z-10">今すぐ始める</span>
                    <span aria-hidden className="text-2xl group-hover:translate-x-2 transition-transform duration-300">→</span>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400 to-sky-400 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
