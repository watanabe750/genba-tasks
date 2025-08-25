# frozen_string_literal: true
require "rails_helper"

RSpec.describe Task, type: :model do
  let(:user) { create(:user) }

  describe ".filter_sort" do
    it "deadline:asc は NULLS LAST になる" do
      early = create(:task, user:, site: "A", deadline: Date.today + 1)
      late  = create(:task, user:, site: "A", deadline: Date.today + 10)
      none  = create(:task, user:, site: "A", deadline: nil)

      ids = Task.filter_sort({ order_by: "deadline", dir: "asc" }, user:).pluck(:id)
      expect(ids).to eq([early.id, late.id, none.id])
    end

    it "progress の範囲で絞り込める（min/max）" do
      t0  = create(:task, user:, site: "A", progress: 0)
      t50 = create(:task, user:, site: "A", progress: 50)
      t90 = create(:task, user:, site: "A", progress: 90)

      ids = Task.filter_sort({ progress_min: 10, progress_max: 60 }, user:).pluck(:id)
      expect(ids).to match_array([t50.id])
      expect(ids).not_to include(t0.id, t90.id)
    end

    it "status は文字列/数値どちらでも指定可能" do
      s0 = create(:task, user:, site: "A", status: :not_started)
      s1 = create(:task, user:, site: "A", status: :in_progress)
      s2 = create(:task, user:, site: "A", status: :completed)

      # 文字列
      ids = Task.filter_sort({ status: ["in_progress"] }, user:).pluck(:id)
      expect(ids).to eq([s1.id])

      # 数値（enum の値）
      ids2 = Task.filter_sort({ status: ["1"] }, user:).pluck(:id)
      expect(ids2).to eq([s1.id])
    end

    it "parents_only=1 で親のみ（子は除外）" do
      parent = create(:task, user:, site: "P")
      _c1    = create(:task, user:, parent: parent)
      _c2    = create(:task, user:, parent: parent)

      ids = Task.filter_sort({ parents_only: "1" }, user:).pluck(:id)
      expect(ids).to eq([parent.id])
    end

    it "order_by=progress の昇降順" do
        a = create(:task, user:, site: "A", progress: 20)
        b = create(:task, user:, site: "A", progress: 80)
        # progress は NOT NULL + default 0 のため、nilではなく 0 を検証
        c = create(:task, user:, site: "A") # => progress はデフォルト 0
  
        asc  = Task.filter_sort({ order_by: "progress", dir: "asc" }, user:).pluck(:id)
        desc = Task.filter_sort({ order_by: "progress", dir: "desc" }, user:).pluck(:id)
  
        # COALESCE(progress,0) で比較される実装に沿った期待値
        expect(asc).to  eq([c.id, a.id, b.id]) # 0 -> 20 -> 80
        expect(desc).to eq([b.id, a.id, c.id]) # 80 -> 20 -> 0
    end
  end
end
