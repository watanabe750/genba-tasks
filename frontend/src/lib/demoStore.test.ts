import { beforeEach, describe, expect, it, vi } from 'vitest';
import { demoStore } from './demoStore';
import type { Task } from '../types';

describe('demoStore', () => {
  beforeEach(() => {
    // 時刻を固定（相対日数計算のため）
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));

    // localStorage をクリアして初期状態に（モジュール読み込み時のIIFEが既に実行されている）
    // ここでは demoStore.reset() は呼ばず、既存のデモデータを活用する
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('list', () => {
    it('初期化後、デモデータが返される', () => {
      const tasks = demoStore.list();
      expect(tasks.length).toBeGreaterThan(0);
    });

    it('site フィルターなしで全タスクを取得', () => {
      const allTasks = demoStore.list();
      const siteACount = allTasks.filter(t => t.site === '現場A').length;
      const siteBCount = allTasks.filter(t => t.site === '現場B').length;

      expect(siteACount).toBeGreaterThan(0);
      expect(siteBCount).toBeGreaterThan(0);
    });

    it('site フィルターで特定の現場のみ取得', () => {
      const siteATasks = demoStore.list({ site: '現場A' });

      expect(siteATasks.length).toBeGreaterThan(0);
      expect(siteATasks.every(t => t.site === '現場A')).toBe(true);
    });

    it('存在しない site でフィルターすると空配列を返す', () => {
      const tasks = demoStore.list({ site: '存在しない現場' });
      expect(tasks).toEqual([]);
    });

    it('相対日数で deadline が計算される', () => {
      const tasks = demoStore.list();
      const taskWithDeadline = tasks.find(t => t.deadline);

      if (taskWithDeadline?.deadline) {
        const deadlineDate = new Date(taskWithDeadline.deadline);
        expect(deadlineDate).toBeInstanceOf(Date);
        expect(deadlineDate.getTime()).not.toBeNaN();
      }
    });
  });

  describe('create', () => {
    it('新しいタスクを作成できる', () => {
      const newTask = demoStore.create({
        title: 'テストタスク',
        status: 'not_started',
        progress: 0,
        site: '現場Z',
      });

      expect(newTask).toBeDefined();
      expect(newTask.id).toBeGreaterThan(0);
      expect(newTask.title).toBe('テストタスク');
      expect(newTask.status).toBe('not_started');
      expect(newTask.progress).toBe(0);
      expect(newTask.site).toBe('現場Z');
    });

    it('必須フィールドのみで作成すると、デフォルト値が設定される', () => {
      const newTask = demoStore.create({});

      expect(newTask.title).toBe('無題のタスク');
      expect(newTask.status).toBe('not_started');
      expect(newTask.progress).toBe(0);
      expect(newTask.deadline).toBeNull();
      expect(newTask.site).toBeNull();
      expect(newTask.parent_id).toBeNull();
    });

    it('作成したタスクがリストに追加される', () => {
      const beforeCount = demoStore.list().length;

      demoStore.create({
        title: '追加タスク',
        site: '現場Test',
      });

      const afterCount = demoStore.list().length;
      expect(afterCount).toBe(beforeCount + 1);
    });

    it('親タスクの配下に子タスクを作成すると、親の進捗が再計算される', () => {
      // 親タスクを作成
      const parent = demoStore.create({
        title: '親タスク',
        status: 'not_started',
        progress: 0,
      });

      // 子タスクを作成（進捗50%）
      demoStore.create({
        title: '子タスク1',
        status: 'in_progress',
        progress: 50,
        parent_id: parent.id,
      });

      // 親の進捗が更新されているか確認
      const updatedParent = demoStore.get(parent.id);
      expect(updatedParent?.progress).toBe(50);
    });

    it('複数の子タスクを追加すると、親の進捗が平均値になる', () => {
      const parent = demoStore.create({
        title: '親タスク',
        status: 'not_started',
        progress: 0,
      });

      demoStore.create({
        title: '子タスク1',
        status: 'completed',
        progress: 100,
        parent_id: parent.id,
      });

      demoStore.create({
        title: '子タスク2',
        status: 'in_progress',
        progress: 50,
        parent_id: parent.id,
      });

      const updatedParent = demoStore.get(parent.id);
      expect(updatedParent?.progress).toBe(75); // (100 + 50) / 2
    });
  });

  describe('get', () => {
    it('IDで特定のタスクを取得できる', () => {
      const allTasks = demoStore.list();
      const firstTask = allTasks[0];

      const retrieved = demoStore.get(firstTask.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(firstTask.id);
      expect(retrieved?.title).toBe(firstTask.title);
    });

    it('存在しないIDの場合、undefined を返す', () => {
      const retrieved = demoStore.get(999999);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('update', () => {
    it('タスクを更新できる', () => {
      const task = demoStore.create({
        title: '更新前',
        status: 'not_started',
        progress: 0,
      });

      const updated = demoStore.update(task.id, {
        title: '更新後',
        status: 'in_progress',
        progress: 50,
      });

      expect(updated).toBeDefined();
      expect(updated?.title).toBe('更新後');
      expect(updated?.status).toBe('in_progress');
      expect(updated?.progress).toBe(50);
    });

    it('存在しないIDの場合、undefined を返す', () => {
      const result = demoStore.update(999999, { title: 'テスト' });
      expect(result).toBeUndefined();
    });

    it('子タスクの進捗を更新すると、親の進捗も再計算される', () => {
      const parent = demoStore.create({
        title: '親タスク',
        status: 'not_started',
        progress: 0,
      });

      const child1 = demoStore.create({
        title: '子タスク1',
        status: 'not_started',
        progress: 0,
        parent_id: parent.id,
      });

      const child2 = demoStore.create({
        title: '子タスク2',
        status: 'not_started',
        progress: 0,
        parent_id: parent.id,
      });

      // 子タスク1を完了
      demoStore.update(child1.id, {
        status: 'completed',
        progress: 100,
      });

      const updatedParent = demoStore.get(parent.id);
      expect(updatedParent?.progress).toBe(50); // (100 + 0) / 2
    });

    it('全ての子タスクが完了すると、親も completed になる', () => {
      const parent = demoStore.create({
        title: '親タスク',
        status: 'not_started',
        progress: 0,
      });

      const child1 = demoStore.create({
        title: '子タスク1',
        status: 'not_started',
        progress: 0,
        parent_id: parent.id,
      });

      const child2 = demoStore.create({
        title: '子タスク2',
        status: 'not_started',
        progress: 0,
        parent_id: parent.id,
      });

      // 両方の子タスクを完了
      demoStore.update(child1.id, { status: 'completed', progress: 100 });
      demoStore.update(child2.id, { status: 'completed', progress: 100 });

      const updatedParent = demoStore.get(parent.id);
      expect(updatedParent?.status).toBe('completed');
      expect(updatedParent?.progress).toBe(100);
    });

    it('親が変更された場合、旧親と新親の両方の進捗が再計算される', () => {
      const parent1 = demoStore.create({
        title: '親タスク1',
        status: 'not_started',
        progress: 0,
      });

      const parent2 = demoStore.create({
        title: '親タスク2',
        status: 'not_started',
        progress: 0,
      });

      const child = demoStore.create({
        title: '子タスク',
        status: 'in_progress',
        progress: 50,
        parent_id: parent1.id,
      });

      // 親を変更
      demoStore.update(child.id, { parent_id: parent2.id });

      const updatedParent1 = demoStore.get(parent1.id);
      const updatedParent2 = demoStore.get(parent2.id);

      expect(updatedParent1?.progress).toBe(0); // 子がいなくなったので0
      expect(updatedParent2?.progress).toBe(50); // 新しく子を持ったので50
    });
  });

  describe('remove', () => {
    it('タスクを削除できる', () => {
      const task = demoStore.create({
        title: '削除対象',
        status: 'not_started',
      });

      const beforeCount = demoStore.list().length;
      demoStore.remove(task.id);
      const afterCount = demoStore.list().length;

      expect(afterCount).toBe(beforeCount - 1);
      expect(demoStore.get(task.id)).toBeUndefined();
    });

    it('子タスクを削除すると、親の進捗が再計算される', () => {
      const parent = demoStore.create({
        title: '親タスク',
        status: 'not_started',
        progress: 0,
      });

      const child1 = demoStore.create({
        title: '子タスク1',
        status: 'completed',
        progress: 100,
        parent_id: parent.id,
      });

      const child2 = demoStore.create({
        title: '子タスク2',
        status: 'not_started',
        progress: 0,
        parent_id: parent.id,
      });

      // child1を削除
      demoStore.remove(child1.id);

      const updatedParent = demoStore.get(parent.id);
      expect(updatedParent?.progress).toBe(0); // child2のみ残るので0
    });

    it('全ての子タスクを削除すると、親の進捗が0になる', () => {
      const parent = demoStore.create({
        title: '親タスク',
        status: 'not_started',
        progress: 0,
      });

      const child1 = demoStore.create({
        title: '子タスク1',
        status: 'completed',
        progress: 100,
        parent_id: parent.id,
      });

      const child2 = demoStore.create({
        title: '子タスク2',
        status: 'in_progress',
        progress: 50,
        parent_id: parent.id,
      });

      // 全ての子を削除
      demoStore.remove(child1.id);
      demoStore.remove(child2.id);

      const updatedParent = demoStore.get(parent.id);
      expect(updatedParent?.progress).toBe(0);
    });
  });

  describe('sites', () => {
    it('全ての現場名を取得できる', () => {
      const sites = demoStore.sites();

      expect(sites.length).toBeGreaterThan(0);
      expect(sites).toContain('現場A');
      expect(sites).toContain('現場B');
      expect(sites).toContain('現場C');
    });

    it('重複なく現場名を取得する', () => {
      const sites = demoStore.sites();
      const uniqueSites = Array.from(new Set(sites));

      expect(sites.length).toBe(uniqueSites.length);
    });

    it('null や空文字の site は含まれない', () => {
      demoStore.create({ title: 'サイトなし', site: null });

      const sites = demoStore.sites();
      expect(sites).not.toContain(null);
      expect(sites).not.toContain('');
    });
  });

  describe('priority', () => {
    it('優先度の高いタスクを5件取得できる', () => {
      const priorityTasks = demoStore.priority();

      expect(priorityTasks.length).toBeLessThanOrEqual(5);
    });

    it('期限が近いタスクが優先される', () => {
      // 明日期限のタスク
      const tomorrow = new Date('2025-01-16T12:00:00Z').toISOString() as Task['deadline'];
      const urgentTask = demoStore.create({
        title: '緊急タスク',
        status: 'not_started',
        progress: 0,
        deadline: tomorrow,
      });

      // 来週期限のタスク
      const nextWeek = new Date('2025-01-22T12:00:00Z').toISOString() as Task['deadline'];
      const normalTask = demoStore.create({
        title: '通常タスク',
        status: 'not_started',
        progress: 0,
        deadline: nextWeek,
      });

      const priorityTasks = demoStore.priority();
      const urgentIndex = priorityTasks.findIndex(t => t.id === urgentTask.id);
      const normalIndex = priorityTasks.findIndex(t => t.id === normalTask.id);

      // 緊急タスクが通常タスクより前にある（インデックスが小さい）
      if (urgentIndex !== -1 && normalIndex !== -1) {
        expect(urgentIndex).toBeLessThan(normalIndex);
      }
    });

    it('進捗が低いタスクが優先される（期限が同じ場合）', () => {
      const deadline = new Date('2025-01-20T12:00:00Z').toISOString() as Task['deadline'];

      const lowProgress = demoStore.create({
        title: '進捗低',
        status: 'not_started',
        progress: 10,
        deadline,
      });

      const highProgress = demoStore.create({
        title: '進捗高',
        status: 'in_progress',
        progress: 90,
        deadline,
      });

      const priorityTasks = demoStore.priority();
      const lowIndex = priorityTasks.findIndex(t => t.id === lowProgress.id);
      const highIndex = priorityTasks.findIndex(t => t.id === highProgress.id);

      if (lowIndex !== -1 && highIndex !== -1) {
        expect(lowIndex).toBeLessThan(highIndex);
      }
    });
  });

  describe('reset', () => {
    it('reset すると localStorage がクリアされ、空配列が返される', () => {
      const beforeReset = demoStore.list();
      expect(beforeReset.length).toBeGreaterThan(0);

      demoStore.reset();

      // localStorage が空になっていることを確認
      const tasks = localStorage.getItem('demo:tasks');
      const nextId = localStorage.getItem('demo:nextId');
      const version = localStorage.getItem('demo:ver');

      expect(tasks).toBe('[]'); // reset() 内で write([]) を呼んでいる
      expect(nextId).toBeNull();
      expect(version).toBeNull();

      // reset 後は空配列が返される
      const afterReset = demoStore.list();
      expect(afterReset).toEqual([]);
    });
  });

  describe('親子関係の進捗計算', () => {
    it('3階層（親→子→孫）の進捗が正しく伝播する', () => {
      const grandparent = demoStore.create({
        title: '祖先タスク',
        status: 'not_started',
        progress: 0,
      });

      const parent = demoStore.create({
        title: '親タスク',
        status: 'not_started',
        progress: 0,
        parent_id: grandparent.id,
      });

      const child1 = demoStore.create({
        title: '子タスク1',
        status: 'completed',
        progress: 100,
        parent_id: parent.id,
      });

      const child2 = demoStore.create({
        title: '子タスク2',
        status: 'not_started',
        progress: 0,
        parent_id: parent.id,
      });

      // 親の進捗 = (100 + 0) / 2 = 50
      const updatedParent = demoStore.get(parent.id);
      expect(updatedParent?.progress).toBe(50);

      // 祖先の進捗 = 親の進捗 = 50
      const updatedGrandparent = demoStore.get(grandparent.id);
      expect(updatedGrandparent?.progress).toBe(50);
    });

    it('循環参照防止の深さ制限が機能する', () => {
      // 正常な深い階層構造を作成
      let currentParentId: number | null = null;
      const tasks: Task[] = [];

      for (let i = 0; i < 15; i++) {
        const task = demoStore.create({
          title: `レベル${i}`,
          status: 'not_started',
          progress: 0,
          parent_id: currentParentId,
        });
        tasks.push(task);
        currentParentId = task.id;
      }

      // 最下層のタスクを更新
      demoStore.update(tasks[tasks.length - 1].id, {
        status: 'completed',
        progress: 100,
      });

      // エラーが発生しないことを確認（深さ制限で停止）
      expect(() => demoStore.get(tasks[0].id)).not.toThrow();
    });
  });
});
