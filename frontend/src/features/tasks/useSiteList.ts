// src/features/tasks/useSiteList.ts
import { useMemo } from "react";
import type { Task } from "../../types/task";

interface SiteWithCount {
  site: string;
  count: number;
  firstId: number;
}

/**
 * タスクリストから現場名を抽出する共通フック
 * - カレンダーページ: シンプルなソート済み現場リスト
 * - サイドバー: タスク数と追加順を含む詳細リスト
 */
export function useSiteList(tasks: Task[]) {
  // 現場名のみのシンプルなリスト（アルファベット順）
  const sites = useMemo(() => {
    const siteSet = new Set<string>();
    tasks.forEach((task) => {
      if (task.site) siteSet.add(task.site);
    });
    return Array.from(siteSet).sort();
  }, [tasks]);

  // タスク数と追加順を含む詳細リスト（サイドバー用）
  const sitesWithCount = useMemo(() => {
    const siteMap = new Map<string, { count: number; firstId: number }>();

    tasks.forEach((task) => {
      if (task.site && task.site.trim()) {
        const site = task.site.trim();
        const existing = siteMap.get(site);
        if (existing) {
          existing.count++;
          // より小さいIDを保持（追加順の早い方）
          existing.firstId = Math.min(existing.firstId, task.id);
        } else {
          siteMap.set(site, { count: 1, firstId: task.id });
        }
      }
    });

    // 追加順（firstId昇順）でソート
    return Array.from(siteMap.entries())
      .map(([site, data]) => ({ site, count: data.count, firstId: data.firstId }))
      .sort((a, b) => a.firstId - b.firstId);
  }, [tasks]);

  return { sites, sitesWithCount };
}

export type { SiteWithCount };
