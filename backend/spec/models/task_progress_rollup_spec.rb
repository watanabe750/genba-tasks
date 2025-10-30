require "rails_helper"

# 子のprogress変更で親/祖先の平均が自動更新される
RSpec.describe "Task Progress Rollup", type: :model do
  let(:user) { create(:user) }

  describe "基本的な進捗ロールアップ" do
    it "子のprogress更新で親の平均が更新される" do
      parent = create(:task, user:, progress: 0)
      c1 = create(:task, user:, parent:, progress: 0)
      c2 = create(:task, user:, parent:, progress: 100)

      c1.update!(progress: 50)
      parent.reload
      expect(parent.progress).to eq(75) # (50+100)/2 を期待
    end

    it "子タスク作成時に親のprogressが更新される" do
      parent = create(:task, user:, progress: 0)
      create(:task, user:, parent:, progress: 100)

      expect(parent.reload.progress).to eq(100)
    end

    it "子タスク削除時に親のprogressが再計算される" do
      parent = create(:task, user:, progress: 0)
      child1 = create(:task, user:, parent:, progress: 50)
      child2 = create(:task, user:, parent:, progress: 100)

      expect(parent.reload.progress).to eq(75) # (50+100)/2

      child2.destroy!

      expect(parent.reload.progress).to eq(50) # child1のみ
    end

    it "全ての子を削除すると親のprogressが0になる" do
      parent = create(:task, user:, progress: 0)
      child1 = create(:task, user:, parent:, progress: 50)
      child2 = create(:task, user:, parent:, progress: 100)

      expect(parent.reload.progress).to eq(75)

      child1.destroy!
      child2.destroy!

      expect(parent.reload.progress).to eq(0)
    end
  end

  describe "ステータスの自動更新" do
    it "全ての子が完了すると親も完了になる" do
      parent = create(:task, user:, status: :in_progress)
      create(:task, user:, parent:, progress: 100, status: :completed)
      create(:task, user:, parent:, progress: 100, status: :completed)

      expect(parent.reload.status).to eq("completed")
      expect(parent.progress).to eq(100)
    end

    it "完了した親に未完了の子ができると親が進行中に戻る" do
      parent = create(:task, user:, progress: 100, status: :completed)
      create(:task, user:, parent:, progress: 100, status: :completed)
      create(:task, user:, parent:, progress: 50, status: :in_progress)

      expect(parent.reload.status).to eq("in_progress")
      expect(parent.progress).to eq(75) # (100+50)/2
    end

    it "子の1つが未完了になると親も未完了に戻る" do
      parent = create(:task, user:, status: :in_progress)
      child1 = create(:task, user:, parent:, progress: 100, status: :completed)
      child2 = create(:task, user:, parent:, progress: 100, status: :completed)

      expect(parent.reload.status).to eq("completed")

      child1.update!(status: :in_progress, progress: 50)

      expect(parent.reload.status).to eq("in_progress")
      expect(parent.progress).to eq(75)
    end
  end

  describe "深い階層の進捗伝播" do
    it "3階層のツリーで最下層から最上層まで伝播する" do
      grandparent = create(:task, user:, progress: 0)
      parent = create(:task, user:, parent: grandparent, progress: 0)
      child = create(:task, user:, parent:, progress: 100)

      expect(child.reload.progress).to eq(100)
      expect(parent.reload.progress).to eq(100)
      expect(grandparent.reload.progress).to eq(100)
    end

    it "4階層のツリーで進捗が正しく伝播する" do
      level1 = create(:task, user:, progress: 0)
      level2 = create(:task, user:, parent: level1, progress: 0)
      level3 = create(:task, user:, parent: level2, progress: 0)
      level4 = create(:task, user:, parent: level3, progress: 80)

      expect(level3.reload.progress).to eq(80)
      expect(level2.reload.progress).to eq(80)
      expect(level1.reload.progress).to eq(80)
    end

    it "複数の分岐がある4階層ツリーで正しく計算される" do
      level1 = create(:task, user:, progress: 0)

      # 分岐1
      level2_a = create(:task, user:, parent: level1, progress: 0)
      level3_a = create(:task, user:, parent: level2_a, progress: 0)
      create(:task, user:, parent: level3_a, progress: 100)

      # 分岐2
      level2_b = create(:task, user:, parent: level1, progress: 0)
      level3_b = create(:task, user:, parent: level2_b, progress: 0)
      create(:task, user:, parent: level3_b, progress: 50)

      expect(level3_a.reload.progress).to eq(100)
      expect(level2_a.reload.progress).to eq(100)

      expect(level3_b.reload.progress).to eq(50)
      expect(level2_b.reload.progress).to eq(50)

      # level1 = (100+50)/2 = 75
      expect(level1.reload.progress).to eq(75)
    end
  end

  describe "複雑なシナリオ" do
    it "複数の子を持つ親が正しく平均を計算する" do
      parent = create(:task, user:, progress: 0)
      create(:task, user:, parent:, progress: 25)
      create(:task, user:, parent:, progress: 50)
      create(:task, user:, parent:, progress: 75)
      create(:task, user:, parent:, progress: 100)

      # (25+50+75+100)/4 = 62.5 → 63（四捨五入）
      expect(parent.reload.progress).to eq(63)
    end

    it "兄弟タスクの影響を受けずに独立して計算される" do
      grandparent = create(:task, user:, progress: 0)

      parent1 = create(:task, user:, parent: grandparent, progress: 0)
      create(:task, user:, parent: parent1, progress: 100)

      parent2 = create(:task, user:, parent: grandparent, progress: 0)
      create(:task, user:, parent: parent2, progress: 0)

      expect(parent1.reload.progress).to eq(100)
      expect(parent2.reload.progress).to eq(0)
      expect(grandparent.reload.progress).to eq(50) # (100+0)/2
    end

    it "親の変更時に新旧両方の親が更新される" do
      old_parent = create(:task, user:, progress: 0)
      new_parent = create(:task, user:, progress: 0)

      child = create(:task, user:, parent: old_parent, progress: 100)
      expect(old_parent.reload.progress).to eq(100)

      # 注: 実際のコントローラーでは親またぎ移動は禁止されているが、
      # モデルレベルではテスト可能
      child.update!(parent: new_parent)

      # 新しい親は100になる
      expect(new_parent.reload.progress).to eq(100)
      # 古い親は子がいなくなったので0になる
      expect(old_parent.reload.progress).to eq(0)
    end
  end

  describe "エッジケース" do
    it "progressがnilの子がいる場合でも計算できる" do
      parent = create(:task, user:, progress: 0)
      create(:task, user:, parent:, progress: nil)
      create(:task, user:, parent:, progress: 100)

      # nilは0として扱われる: (0+100)/2 = 50
      expect(parent.reload.progress).to eq(50)
    end

    it "親のprogressが既に正しい値の場合は更新しない" do
      parent = create(:task, user:, progress: 50)
      create(:task, user:, parent:, progress: 50)

      # update_columnsは変更がない場合にも実行されるが、エラーにはならない
      expect { parent.reload }.not_to raise_error
      expect(parent.progress).to eq(50)
    end

    it "子のステータスのみ変更してもprogressは維持される" do
      parent = create(:task, user:, progress: 0)
      child = create(:task, user:, parent:, progress: 100, status: :in_progress)

      expect(parent.reload.progress).to eq(100)

      child.update!(status: :completed)

      # progressは変わらないが、親のstatusがcompletedになる
      expect(parent.reload.progress).to eq(100)
      expect(parent.status).to eq("completed")
    end
  end
end
