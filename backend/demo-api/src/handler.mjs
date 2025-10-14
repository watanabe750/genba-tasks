// backend/demo-api/src/handler.mjs
// Node.js 20 (ESM)
const ORIGIN = process.env.ALLOWED_ORIGIN || "https://app.genba-tasks.com";

// 共通 CORS ヘッダ（← ここに Expose-Headers を必ず入れる）
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ORIGIN,
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type,Authorization,x-auth-start,X-Auth-Start,access-token,client,uid,token-type,expiry",
    // これが無いとブラウザ JS から access-token 等が読めません
    "Access-Control-Expose-Headers":
      "access-token,client,uid,token-type,expiry",
    Vary: "Origin",
  };
}

export async function health() {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
    body: JSON.stringify({ ok: true, ts: Date.now() }),
  };
}

// ゲスト開始（POST /guest/login）
export async function guestLogin(event) {
  // デモ用固定トークン（ヘッダで返す）
  const token = "guest-demo-token";
  const client = "guest-demo-client";
  const uid = "guest@example.com";
  const tokenType = "Bearer";
  const expiry = String(Math.floor(Date.now() / 1000) + 3600);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
      // フロントが保存する認証系ヘッダ（Expose-Headers で公開済）
      "access-token": token,
      client,
      uid,
      "token-type": tokenType,
      expiry,
    },
    // フォールバックとしてボディにも載せておくと更に堅牢（任意）
    body: JSON.stringify({
      token,
      client,
      uid,
      token_type: tokenType,
      expiry,
      user: { id: "guest", name: "Guest User" },
    }),
  };
}

// 事前フライト（任意）
export async function preflight() {
  return { statusCode: 204, headers: corsHeaders(), body: "" };
}
