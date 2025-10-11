const KEY = "demo:images"; // { [taskId: string]: string }  // ←URLでもdataURLでもOK
type Map = Record<string, string>;
const read = (): Map => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };
const write = (m: Map) => localStorage.setItem(KEY, JSON.stringify(m));
export const demoImageStore = {
  get(taskId: number): string | undefined { return read()[String(taskId)]; },
  set(taskId: number, src: string) { const m = read(); m[String(taskId)] = src; write(m); },
  remove(taskId: number) { const m = read(); delete m[String(taskId)]; write(m); },
  reset() { write({}); },
};
