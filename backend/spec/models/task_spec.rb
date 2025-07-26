require 'rails_helper'

RSpec.describe Task, type: :model do
    # ---- 共有ユーザー(タスクに紐づけるために用意) ---- #
    let(:user) { User.create!(email: "test@example.com", password: "password") }

    describe "バリデーション" do
        it "タイトル、ステータス、ユーザーが揃っていれば有効" do
            # 全て正しい値を渡した場合、保存できる(有効)
            task = Task.new(title: "有効なタスク", status: :not_started, user: user)
            expect(task).to be_valid
        end

        it "タイトルが空なら無効" do
            # タイトルが空の場合、バリデーションエラーになる
            task = Task.new(title: "", status: :not_started, user: user)
            expect(task).not_to be_valid
            # ActiveRecordが持つerrorsオブジェクトに、タイトル必須のエラーメッセージが入っているか確認
            expect(task.errors[:title]).to include("can't be blank")
        end

        it "ステータスが空なら無効" do
            # status(nil)の場合、enumのpresenceチェックに引っかかる
            task = Task.new(title: "タスク", status: nil, user: user)
            expect(task).not_to be_valid
            expect(task.errors[:status]).to include("can't be blank")
        end

        it "ユーザーが紐付かれていなければ無効" do
            # userがnilの場合、belongs_toの必須チェックに引っかかる
            task = Task.new(title: "タスク", status: :not_started, user: nil)
            expect(task).not_to be_valid
            # belong_toはデフォルトで「関連レコードが存在するか」をチェックする
            expect(task.errors[:user]).to include("must exist")
        end

        it "不正なステータス値なら無効" do
            # enumに存在しない値(99)を渡した場合、即ArgumentErrorが発生する
            expect {
                Task.new(title: "不正ステータス", status: 99, user: user)
            # enumは未定義の値を代入すると例外を投げる仕様    
            }.to raise_error(ArgumentError)
        end
    end
end