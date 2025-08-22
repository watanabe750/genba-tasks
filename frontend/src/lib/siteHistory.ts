const KEY = "siteHistory";
const MAX = 20;

export function readSiteHistory(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return Array.from(new Set(arr.map((x) => String(x).trim()).filter(Boolean))).slice(0, MAX);
  } catch {
    return [];
  }
}

export function pushSiteHistory(site: string): void {
  const s = site.trim();
  if (!s) return;
  const cur = readSiteHistory();
  const next = [s, ...cur.filter((x) => x !== s)].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(next));
}
