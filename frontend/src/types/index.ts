// src/type/index.ts
// ---- 基本ユーティリティ ----
export type Brand<T, B extends string> = T & { readonly __brand: B };
export type IsoDateString = Brand<string, "IsoDate">; // "2025-01-02T00:00:00.000Z"

// ---- React ページ型 ----
export type PageComponent = () => JSX.Element;

// ---- ドメイン列挙 ----
export type Status = "not_started" | "in_progress" | "completed";
export type OrderBy = "deadline" | "progress" | "created_at";
export type SortDir = "asc" | "desc";

// ---- API の Task（フラット） ----
export type Task = {
  id: number;
  title: string;
  status: Status;
  progress: number;             // 0..100
  deadline: IsoDateString | null;
  site: string | null;          // 子では null が許容
  parent_id: number | null;     // 親は null
};

// ---- UI 用 Task ツリー ----
export type TaskNode = Task & {
  depth?: number;               // UI 計算用
  children?: TaskNode[];        // UI 計算用
};

// ---- フィルタ ----
export type TaskFilters = {
  site?: string;
  status?: Status[];
  progress_min?: number;
  progress_max?: number;
  order_by?: OrderBy;
  dir?: SortDir;
  parents_only?: "1";
};

// ---- DTO ----
export type CreateTaskPayload = {
  task: {
    title: string;
    status?: Status;
    progress?: number;
    deadline?: IsoDateString | null;
    parent_id?: number | null;
    site?: string;              // 親で必須
  };
};

export type UpdateTaskPayload = {
  task: Partial<Pick<Task, "status" | "progress" | "title" | "deadline">>;
};

// ==== ここから 詳細ドロワー用型を追加 ====

// 直下の子プレビュー（0〜4件想定）
export type ChildPreview = {
  id: number;
  title: string;
  status: Status;
  progress_percent: number;         // 0..100（ロールアップ or 子の進捗）
  deadline: IsoDateString | null;
};

// 詳細ドロワーのレスポンス
export type TaskDetail = {
  id: number;
  title: string;
  status: Status;
  site: string | null;
  deadline: IsoDateString | null;

  // 親視点のロールアップ進捗（0..100）
  progress_percent: number;

  // 直下の子サマリ
  children_count: number;
  children_done_count: number;

  // 孫は件数のみ（名前は出さない）
  grandchildren_count?: number;

  // 直下の子プレビュー（最大4件）
  children_preview?: ChildPreview[];

  // 親のみ1枚の画像（署名URL or null）
  image_url?: string | null;
  image_thumb_url?: string | null;
  
  // 監査情報
  created_by_name: string;
  created_at: IsoDateString;
  updated_at: IsoDateString;
};
