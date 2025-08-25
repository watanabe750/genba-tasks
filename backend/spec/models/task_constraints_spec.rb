# frozen_string_literal: true
require "rails_helper"

RSpec.describe Task, type: :model do
  let(:user) { create(:user) } # FactoryBot を想定（無ければ User.create! に置き換え可）

  describe "親のみ site 必須" do
    it "親は site が必須 / 子は site 無しでも保存できる" do
      parent = user.tasks.new(title: "親A") # site なし → invalid
      expect(parent).to be_invalid
      expect(parent.errors[:site]).to include("can't be blank")

      parent.site = "現場X"
      expect(parent).to be_valid
      parent.save!

      child = user.tasks.new(title: "子1", parent:)
      expect(child).to be_valid
      child.save!
    end
  end

  describe "子タスク上限（直下最大4件）" do
    it "4件まではOK、5件目は invalid" do
      parent = user.tasks.create!(title: "親", site: "現場X")
      4.times { |i| user.tasks.create!(title: "子#{i + 1}", parent:) }

      fifth = user.tasks.new(title: "子5", parent:)
      expect(fifth).to be_invalid
      expect(fifth.errors.full_messages.join).to include("最大4件")
    end

    it "親付け替えで5件目になる場合も invalid（更新時チェック）" do
      a = user.tasks.create!(title: "A", site: "現場X")
      b = user.tasks.create!(title: "B", site: "現場Y")
      4.times { |i| user.tasks.create!(title: "A-#{i + 1}", parent: a) }
      x = user.tasks.create!(title: "X", parent: b)

      expect {
        x.update!(parent: a) # will_save_change_to_parent_id? が true で検証される
      }.to raise_error(ActiveRecord::RecordInvalid) { |e|
        expect(e.record.errors.full_messages.join).to include("最大4件")
      }
      expect(x.reload.parent).to eq(b) # 付け替わらないこと
    end
  end

  describe "depth の自動計算と上限" do
    it "作成時に depth が 1→4 で自動設定、5階層目は invalid" do
      p1 = user.tasks.create!(title: "1", site: "S")
      p2 = user.tasks.create!(title: "2", parent: p1)
      p3 = user.tasks.create!(title: "3", parent: p2)
      p4 = user.tasks.create!(title: "4", parent: p3)

      expect([p1.depth, p2.depth, p3.depth, p4.depth]).to eq([1, 2, 3, 4])

      p5 = user.tasks.new(title: "5", parent: p4)
      expect(p5).to be_invalid
      expect(p5.errors.full_messages.join).to include("4階層まで")
    end
  end

  describe "DB デフォルト（status / progress）" do
    it "status / progress を指定しなくてもデフォルトが入る（create! 時）" do
      t = user.tasks.create!(title: "親", site: "現場X")
      expect(t.status).to eq("not_started")
      expect(t.progress.to_i).to eq(0)
    end
  end
end
