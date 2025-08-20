export type Task = {
    id: number;
    title: string;
    status: "not_started" | "in_progress" | "completed" | string;
    progress: number;
    deadline: string | null;
    parent_id: number | null;
    depth?: number;
    description?: string | null;
    children?: Task[];
  };