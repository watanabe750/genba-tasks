// Node.js 20 (ESM)
const ORIGIN = process.env.ALLOWED_ORIGIN || "https://app.genba-tasks.com";

// 共通CORSヘッダ
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ORIGIN,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    // ブラウザから送ってくる可能性のあるヘッダ
    "Access-Control-Allow-Headers":
      "Content-Type,Authorization,access-token,client,uid,token-type,expiry",
    // ブラウザJSから読み取りを許可するレスポンスヘッダ
    "Access-Control-Expose-Headers":
      "access-token,client,uid,token-type,expiry",
    "Vary": "Origin",
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
  // デモ用の固定トークン（フロントはヘッダから保存）
  const token = "guest-demo-token";
  const client = "guest-demo-client";
  const uid = "guest@example.com";
  const tokenType = "Bearer";
  const expiry = String(Math.floor(Date.now() / 1000) + 3600);

  const headers = {
    "Content-Type": "application/json",
    ...corsHeaders(),
    // ← 実際に“認証系ヘッダ”をのせる
    "access-token": token,
    "client": client,
    "uid": uid,
    "token-type": tokenType,
    "expiry": expiry,
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      token, // デバッグ用（無くても可）
      user: { id: "guest", name: "Guest User" },
    }),
  };
}

// 事前フライト（OPTIONS）※HttpApiのCORSが有効なら不要。残しても害はなし。
export async function preflight() {
  return { statusCode: 204, headers: corsHeaders(), body: "" };
}
