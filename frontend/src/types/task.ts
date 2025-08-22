// src/types/task.ts
export type TaskStatus = "not_started" | "in_progress" | "completed";

export type Task = {
  id: number;
  title: string;
  status: TaskStatus;         // ← 余計な | string は排除
  progress?: number;          // APIにより未設定もあるので optional 推奨
  deadline?: string | null;   // ISO or YYYY-MM-DD 文字列
  parent_id?: number | null;  // 子でなければ null/undefined
  site?: string | null;       // ★ 親タスクで必須
  depth?: number;
  description?: string | null;
  children?: Task[];          // APIが返さないなら空/undefinedでOK
};