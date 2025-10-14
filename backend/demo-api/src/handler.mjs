// Node.js 20 (ESM)
const ORIGIN = process.env.ALLOWED_ORIGIN || "https://app.genba-tasks.com";

// CORSヘッダ
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ORIGIN,
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
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

// ※必要最小限の“ゲスト開始”API（POST /guest/login）
export async function guestLogin(event) {
  // ここではダミーのトークンを返すだけ（書き込み不要・コスト0運用）
  const body = {
    token: "guest-demo-token",
    user: { id: "guest", name: "Guest User" },
  };
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
    body: JSON.stringify(body),
  };
}

// 事前フライト（OPTIONS）
export async function preflight() {
  return { statusCode: 204, headers: corsHeaders(), body: "" };
}
