require 'rails_helper'

RSpec.describe "Task API", type: :request do
    include Devise::Test::IntegrationHelpers  # ←追加

    # GET /tasks
    describe "GET /tasks" do
        it "タスク一覧を取得できる" do
            # テストデータ作成
            user = User.create!(email: "test@example.com", password: "password")
            Task.create!(title: "テストタスク1", status: :not_started, user: user)
            Task.create!(title: "テストタスク2", status: :in_progress, user: user)

            # APIリクエスト送信
            get "/tasks"

            # レスポンスの検証
            expect(response).to have_http_status(:ok) # ステータスコード200(OK)？
            json = JSON.parse(response.body) # JSON文字列をRubyハッシュに変換
            expect(json.size).to eq(2) # APIレスポンスで帰ってきたタスク配列の要素が２つか検証
            expect(json[0]["title"]).to eq("テストタスク1") # 1つ目のタスクタイトルが「テストタスク1」か？
        end
    end

    describe "POST /tasks" do
        it "タスクを作成できる" do
          user = User.create!(email: "test2@example.com", password: "password")
          sign_in user  # ← ログイン状態を再現
          post "/tasks", params: { task: { 
            title: "新しいタスク", 
            status: :not_started, 
          } }
      
          expect(response).to have_http_status(:created)
          json = JSON.parse(response.body)
          expect(json["title"]).to eq("新しいタスク")
          expect(json["user_id"]).to eq(user.id)
        end
      end
      

    describe "PATCH /tasks/:id" do
        it "タスクを更新できる" do
            user = User.create!(email: "test3@example.com", password: "password")
            task = Task.create!(title: "更新前タスク", status: :not_started, user: user)

            patch "/tasks/#{task.id}", params: { task: { title: "更新後タスク" } }

            expect(response).to have_http_status(:ok)
            json = JSON.parse(response.body)
            expect(json["title"]).to eq("更新後タスク")
        end
    end

    describe "DELETE /tasks/:id" do
        it "タスクを削除できる" do
            user = User.create!(email: "test4@example.com", password: "password")
            task = Task.create!(title: "削除タスク", status: :not_started, user: user)

            delete "/tasks/#{task.id}"

            expect(response).to have_http_status(:no_content)
            expect(Task.find_by(id: task.id)).to be_nil
        end
    end
end


