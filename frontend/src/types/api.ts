// types/api.ts - API 入出力型
import type { Task, Status } from "./task";
import type { ISODateString } from "./common";

/** タスク作成時のペイロード */
export type CreateTaskPayload = {
  task: {
    title: string;
    status?: Status;
    progress?: number;
    deadline?: ISODateString | null;
    parent_id?: number | null;
    site?: string | null; // 親タスクでは任意
  };
};

/** タスク更新時のペイロード */
export type UpdateTaskPayload = {
  task: Partial<Pick<Task, "status" | "progress" | "title" | "deadline" | "description">>;
};

/** ユーザー情報レスポンス */
export type MeResponse = {
  id: number;
  email: string;
  name: string | null;
};
