# frozen_string_literal: true

require "rails_helper"

RSpec.describe TaskProgressService, type: :service do
  let(:user) { create(:user) }

  describe ".calculate_from_children" do
    context "子が存在しない場合" do
      it "0を返す" do
        task = create(:task, user:, progress: 50)
        expect(TaskProgressService.calculate_from_children(task)).to eq(0)
      end
    end

    context "子が1つの場合" do
      it "その子のprogressを返す" do
        parent = create(:task, user:, progress: 0)
        create(:task, user:, parent:, progress: 75)

        expect(TaskProgressService.calculate_from_children(parent)).to eq(75)
      end
    end

    context "子が複数の場合" do
      it "子のprogressの平均値（四捨五入）を返す" do
        parent = create(:task, user:, progress: 0)
        create(:task, user:, parent:, progress: 0)
        create(:task, user:, parent:, progress: 100)

        expect(TaskProgressService.calculate_from_children(parent)).to eq(50)
      end

      it "小数点以下を四捨五入する" do
        parent = create(:task, user:, progress: 0)
        create(:task, user:, parent:, progress: 33)
        create(:task, user:, parent:, progress: 33)
        create(:task, user:, parent:, progress: 33)

        # (33+33+33)/3 = 33.0 → 33
        expect(TaskProgressService.calculate_from_children(parent)).to eq(33)
      end

      it "平均が小数の場合、正しく四捨五入する" do
        parent = create(:task, user:, progress: 0)
        create(:task, user:, parent:, progress: 50)
        create(:task, user:, parent:, progress: 100)

        # (50+100)/2 = 75.0 → 75
        expect(TaskProgressService.calculate_from_children(parent)).to eq(75)
      end
    end
  end

  describe ".all_children_completed?" do
    context "子が存在しない場合" do
      it "falseを返す" do
        task = create(:task, user:)
        expect(TaskProgressService.all_children_completed?(task)).to be false
      end
    end

    context "全ての子が完了している場合" do
      it "trueを返す" do
        parent = create(:task, user:)
        create(:task, user:, parent:, status: :completed)
        create(:task, user:, parent:, status: :completed)

        expect(TaskProgressService.all_children_completed?(parent)).to be true
      end
    end

    context "一部の子が未完了の場合" do
      it "falseを返す" do
        parent = create(:task, user:)
        create(:task, user:, parent:, status: :completed)
        create(:task, user:, parent:, status: :in_progress)

        expect(TaskProgressService.all_children_completed?(parent)).to be false
      end
    end

    context "全ての子が未完了の場合" do
      it "falseを返す" do
        parent = create(:task, user:)
        create(:task, user:, parent:, status: :not_started)
        create(:task, user:, parent:, status: :in_progress)

        expect(TaskProgressService.all_children_completed?(parent)).to be false
      end
    end
  end

  describe ".recalculate_with_propagation!" do
    context "子が存在する場合" do
      it "子のprogressの平均でprogressを更新する" do
        parent = create(:task, user:, progress: 0)
        create(:task, user:, parent:, progress: 50)
        create(:task, user:, parent:, progress: 100)

        TaskProgressService.recalculate_with_propagation!(parent)
        expect(parent.reload.progress).to eq(75)
      end

      it "全子が完了している場合、親のstatusをcompletedにする" do
        parent = create(:task, user:, progress: 0, status: :in_progress)
        create(:task, user:, parent:, progress: 100, status: :completed)
        create(:task, user:, parent:, progress: 100, status: :completed)

        TaskProgressService.recalculate_with_propagation!(parent)
        expect(parent.reload.status).to eq("completed")
      end

      it "未完了の子がある場合、親のstatusをin_progressにする" do
        parent = create(:task, user:, progress: 100, status: :completed)
        create(:task, user:, parent:, progress: 100, status: :completed)
        create(:task, user:, parent:, progress: 50, status: :in_progress)

        TaskProgressService.recalculate_with_propagation!(parent)
        expect(parent.reload.status).to eq("in_progress")
      end
    end

    context "子が存在しない場合" do
      it "progressを0にする" do
        task = create(:task, user:, progress: 50)

        TaskProgressService.recalculate_with_propagation!(task)
        expect(task.reload.progress).to eq(0)
      end

      it "statusは変更しない" do
        task = create(:task, user:, progress: 50, status: :in_progress)

        TaskProgressService.recalculate_with_propagation!(task)
        expect(task.reload.status).to eq("in_progress")
      end
    end

    context "祖先への伝播" do
      it "親の親（祖父）にも伝播する" do
        grandparent = create(:task, user:, progress: 0)
        parent = create(:task, user:, parent: grandparent, progress: 0)
        create(:task, user:, parent:, progress: 100)

        TaskProgressService.recalculate_with_propagation!(parent)

        expect(parent.reload.progress).to eq(100)
        expect(grandparent.reload.progress).to eq(100)
      end

      it "4階層のツリーで最下層から最上層まで伝播する" do
        level1 = create(:task, user:, progress: 0)
        level2 = create(:task, user:, parent: level1, progress: 0)
        level3 = create(:task, user:, parent: level2, progress: 0)
        level4 = create(:task, user:, parent: level3, progress: 100)

        TaskProgressService.recalculate_with_propagation!(level3)

        expect(level3.reload.progress).to eq(100)
        expect(level2.reload.progress).to eq(100)
        expect(level1.reload.progress).to eq(100)
      end
    end

    context "無限ループ対策" do
      it "同じタスクを2回訪問しない" do
        # 通常は循環参照は発生しないが、visited_idsでガード
        parent = create(:task, user:, progress: 0)
        child = create(:task, user:, parent:, progress: 50)

        # visited_idsに親が含まれる場合、処理をスキップ
        expect {
          TaskProgressService.recalculate_with_propagation!(parent, visited_ids: [parent.id])
        }.not_to raise_error

        # 更新されないことを確認
        expect(parent.reload.progress).to eq(0)
      end

      it "深さ制限を超えると処理を停止する" do
        task = create(:task, user:, progress: 50)

        # visited_idsが11個（深さ11）の場合、処理しない
        visited = (1..11).to_a
        expect {
          TaskProgressService.recalculate_with_propagation!(task, visited_ids: visited)
        }.not_to raise_error

        # 更新されないことを確認
        expect(task.reload.progress).to eq(50)
      end
    end

    context "複雑なツリー構造" do
      it "複数の子を持つ親が正しく計算される" do
        parent = create(:task, user:, progress: 0)
        create(:task, user:, parent:, progress: 25)
        create(:task, user:, parent:, progress: 50)
        create(:task, user:, parent:, progress: 75)

        TaskProgressService.recalculate_with_propagation!(parent)

        # (25+50+75)/3 = 50
        expect(parent.reload.progress).to eq(50)
      end

      it "兄弟タスクがある場合でも正しく計算される" do
        grandparent = create(:task, user:, progress: 0)
        parent1 = create(:task, user:, parent: grandparent, progress: 0)
        parent2 = create(:task, user:, parent: grandparent, progress: 0)

        create(:task, user:, parent: parent1, progress: 100)
        create(:task, user:, parent: parent2, progress: 50)

        TaskProgressService.recalculate_with_propagation!(parent1)

        expect(parent1.reload.progress).to eq(100)
        # grandparentは(100+0)/2 = 50（parent2はまだ0）
        expect(grandparent.reload.progress).to eq(50)
      end
    end
  end
end
