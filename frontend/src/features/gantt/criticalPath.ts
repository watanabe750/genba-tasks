// features/gantt/criticalPath.ts - クリティカルパス計算ロジック
import type { Task, TaskDependency, GanttTask } from "../../types";

/**
 * タスクの期間（日数）を計算
 */
function calculateDuration(start_date: string | null, deadline: string | null): number {
  if (!start_date || !deadline) return 1; // デフォルト1日

  const start = new Date(start_date);
  const end = new Date(deadline);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(1, diffDays);
}

/**
 * 日付にN日を加算
 */
function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * クリティカルパスを計算してGanttTask配列を返す
 *
 * アルゴリズム:
 * 1. フォワードパス: 各タスクの最早開始日・最早完了日を計算
 * 2. バックワードパス: 各タスクの最遅開始日・最遅完了日を計算
 * 3. スラック（余裕日数）を計算
 * 4. スラックが0のタスクがクリティカルパス上のタスク
 */
export function calculateCriticalPath(
  tasks: Task[],
  dependencies: TaskDependency[]
): GanttTask[] {
  // 親タスク（site有り）のみを対象
  const parentTasks = tasks.filter(t => t.parent_id === null && t.site);

  if (parentTasks.length === 0) {
    return [];
  }

  // タスクIDをキーとしたマップ
  const taskMap = new Map(parentTasks.map(t => [t.id, t]));

  // 依存関係マップ
  const predecessorsMap = new Map<number, number[]>(); // successor_id -> predecessor_ids[]
  const successorsMap = new Map<number, number[]>();   // predecessor_id -> successor_ids[]

  for (const dep of dependencies) {
    // 両方のタスクが親タスクの場合のみ依存関係を考慮
    if (!taskMap.has(dep.predecessor_id) || !taskMap.has(dep.successor_id)) {
      continue;
    }

    if (!predecessorsMap.has(dep.successor_id)) {
      predecessorsMap.set(dep.successor_id, []);
    }
    predecessorsMap.get(dep.successor_id)!.push(dep.predecessor_id);

    if (!successorsMap.has(dep.predecessor_id)) {
      successorsMap.set(dep.predecessor_id, []);
    }
    successorsMap.get(dep.predecessor_id)!.push(dep.successor_id);
  }

  // GanttTask初期化
  const ganttTasks = new Map<number, GanttTask>();

  for (const task of parentTasks) {
    const duration = calculateDuration(task.start_date ?? null, task.deadline);

    ganttTasks.set(task.id, {
      id: task.id,
      title: task.title,
      start_date: task.start_date ?? task.deadline,
      deadline: task.deadline,
      status: task.status,
      progress: task.progress,
      site: task.site,
      duration_days: duration,
      earliest_start: null,
      earliest_finish: null,
      latest_start: null,
      latest_finish: null,
      slack_days: 0,
      is_critical: false,
    });
  }

  // 1. フォワードパス: 最早開始日・最早完了日を計算
  const visited = new Set<number>();
  const queue: number[] = [];

  // 開始ノード（前任者がいないタスク）を探す
  for (const task of parentTasks) {
    const hasPredecessors = predecessorsMap.get(task.id)?.length ?? 0;
    if (hasPredecessors === 0) {
      queue.push(task.id);
      const gt = ganttTasks.get(task.id)!;
      gt.earliest_start = gt.start_date ?? new Date().toISOString().split('T')[0];
      gt.earliest_finish = addDays(gt.earliest_start, gt.duration_days);
    }
  }

  // BFS でフォワードパス
  while (queue.length > 0) {
    const taskId = queue.shift()!;
    if (visited.has(taskId)) continue;
    visited.add(taskId);

    const successors = successorsMap.get(taskId) ?? [];

    for (const successorId of successors) {
      const successor = ganttTasks.get(successorId)!;
      const current = ganttTasks.get(taskId)!;

      // 後続タスクの最早開始日は、全ての前任者の最早完了日の最大値
      const newEarliestStart = current.earliest_finish!;

      if (!successor.earliest_start || newEarliestStart > successor.earliest_start) {
        successor.earliest_start = newEarliestStart;
        successor.earliest_finish = addDays(successor.earliest_start, successor.duration_days);
      }

      // 全ての前任者を処理済みなら次へ
      const preds = predecessorsMap.get(successorId) ?? [];
      const allPredsDone = preds.every(p => visited.has(p));
      if (allPredsDone && !visited.has(successorId)) {
        queue.push(successorId);
      }
    }
  }

  // プロジェクト完了日（全タスクの最早完了日の最大値）
  let projectFinish = "";
  for (const gt of ganttTasks.values()) {
    if (gt.earliest_finish && gt.earliest_finish > projectFinish) {
      projectFinish = gt.earliest_finish;
    }
  }

  // 2. バックワードパス: 最遅開始日・最遅完了日を計算
  visited.clear();
  const reverseQueue: number[] = [];

  // 終了ノード（後続者がいないタスク）を探す
  for (const task of parentTasks) {
    const hasSuccessors = successorsMap.get(task.id)?.length ?? 0;
    if (hasSuccessors === 0) {
      reverseQueue.push(task.id);
      const gt = ganttTasks.get(task.id)!;
      gt.latest_finish = projectFinish;
      gt.latest_start = addDays(gt.latest_finish, -gt.duration_days);
    }
  }

  // BFS でバックワードパス
  while (reverseQueue.length > 0) {
    const taskId = reverseQueue.shift()!;
    if (visited.has(taskId)) continue;
    visited.add(taskId);

    const predecessors = predecessorsMap.get(taskId) ?? [];

    for (const predecessorId of predecessors) {
      const predecessor = ganttTasks.get(predecessorId)!;
      const current = ganttTasks.get(taskId)!;

      // 前任者の最遅完了日は、全ての後続者の最遅開始日の最小値
      const newLatestFinish = current.latest_start!;

      if (!predecessor.latest_finish || newLatestFinish < predecessor.latest_finish) {
        predecessor.latest_finish = newLatestFinish;
        predecessor.latest_start = addDays(predecessor.latest_finish, -predecessor.duration_days);
      }

      // 全ての後続者を処理済みなら次へ
      const succs = successorsMap.get(predecessorId) ?? [];
      const allSuccsDone = succs.every(s => visited.has(s));
      if (allSuccsDone && !visited.has(predecessorId)) {
        reverseQueue.push(predecessorId);
      }
    }
  }

  // 3. スラック（余裕日数）とクリティカルパスを計算
  for (const gt of ganttTasks.values()) {
    if (gt.earliest_start && gt.latest_start) {
      const start1 = new Date(gt.earliest_start);
      const start2 = new Date(gt.latest_start);
      const diffTime = start2.getTime() - start1.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      gt.slack_days = Math.max(0, diffDays);
      gt.is_critical = gt.slack_days === 0;
    }
  }

  return Array.from(ganttTasks.values());
}
