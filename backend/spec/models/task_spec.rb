# spec/models/task_spec.rb
require 'rails_helper'

RSpec.describe Task, type: :model do
  let(:user) { create(:user) }  # FactoryBot

  describe "バリデーション" do
    it "タイトル、ステータス、ユーザーが揃っていれば有効" do
      task = described_class.new(title: "有効なタスク", status: :not_started, user: user, site: "現場X")
      expect(task).to be_valid
    end

    it "タイトルが空なら無効" do
      task = described_class.new(title: "", status: :not_started, user: user, site: "現場X")
      expect(task).not_to be_valid
      expect(task.errors[:title]).to include("can't be blank")
    end

    it "ステータスが空なら無効" do
      task = described_class.new(title: "タスク", status: nil, user: user, site: "現場X")
      expect(task).not_to be_valid
      expect(task.errors[:status]).to include("can't be blank")
    end

    it "ユーザーが紐付かれていなければ無効" do
      task = described_class.new(title: "タスク", status: :not_started, user: nil, site: "現場X")
      expect(task).not_to be_valid
      expect(task.errors[:user]).to include("must exist")
    end

    it "不正なステータス値なら無効" do
      # enum に未定義の値を渡すと ArgumentError
      expect {
        described_class.new(title: "不正ステータス", status: 99, user: user, site: "現場X")
      }.to raise_error(ArgumentError)
    end
  end
end
