import type { Task } from "./task";

export type ApiListResponse<T> = { data: T[] };
export type ApiItemResponse<T> = { data: T };

export type MeResponse = {
  id: number;
  email: string;
  name: string | null;
};

export type TasksIndexResponse = ApiListResponse<Task>;
export type TaskItemResponse = ApiItemResponse<Task>;
