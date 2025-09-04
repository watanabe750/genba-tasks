// tests/fixtures.ts
export const listResponse = [
    {
      id: 1001,
      title: "親A",
      status: "in_progress",
      progress: 40,
      deadline: "2025-09-10T00:00:00.000Z",
      site: "site-1",
      parent_id: null,
      depth: 1,
      position: 1,
    },
  ];
  
  export const detailOk = {
    id: 1001,
    parent_id: null,
    title: "親A",
    status: "in_progress",
    site: "site-1",
    deadline: "2025-09-10T00:00:00.000Z",
    progress_percent: 67,
    children_count: 4,
    children_done_count: 2,
    grandchildren_count: 3,
    children_preview: [
      { id: 2001, title: "子1", status: "in_progress", progress_percent: 50, deadline: "2025-09-05T00:00:00.000Z" },
      { id: 2002, title: "子2", status: "completed",   progress_percent: 100, deadline: "2025-09-04T00:00:00.000Z" },
      { id: 2003, title: "子3", status: "not_started",  progress_percent: 0,  deadline: null },
      { id: 2004, title: "子4", status: "in_progress",  progress_percent: 30, deadline: null },
    ],
    image_url: null,
    created_by_name: "現場長",
    created_at: "2025-09-01T00:00:00.000Z",
    updated_at: "2025-09-02T00:00:00.000Z",
  };
  
  export const detail5xx = { errors: ["boom"] };
  export const detail404 = { errors: ["Task not found"] };
  