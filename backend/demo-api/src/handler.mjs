// Node.js 20 (ESM)
const ORIGIN = process.env.ALLOWED_ORIGIN || "https://app.genba-tasks.com";

// 共通CORSヘッダ
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ORIGIN,
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    // プリフライトで申告され得るヘッダ
    "Access-Control-Allow-Headers":
      "Content-Type,Authorization,X-Auth-Start,access-token,client,uid,token-type,expiry",
    // フロントJSが読み取れるように公開するヘッダ
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
  // デモ用の固定トークン
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
      // 認証系ヘッダを実際に載せる（フロントが保存）
      "access-token": token,
      client,
      uid,
      "token-type": tokenType,
      expiry,
    },
    body: JSON.stringify({
      token, // 任意（デバッグ用）
      user: { id: "guest", name: "Guest User" },
    }),
  };
}

// 任意：手動検証用 OPTIONS
export async function preflight() {
  return { statusCode: 204, headers: corsHeaders(), body: "" };
}
