# spec/requests/tasks_spec.rb
require 'rails_helper'

RSpec.describe "Task API", type: :request do
  # Devise::Test::IntegrationHelpers はDTA認証では不要（トークンで叩く）
  let(:user) { User.create!(email: "test@example.com", password: "password") }

  def json
    JSON.parse(response.body)
  end

  shared_examples "unauthorized request" do
    it "401を返す" do
      expect(response).to have_http_status(:unauthorized)
      expect(json["errors"]).to include("You need to sign in or sign up before continuing.")
    end
  end

  shared_examples "not found request" do
    it "404を返す" do
      expect(response).to have_http_status(:not_found)
      expect(json["errors"]).to include("Task not found")
    end
  end

  # ---- GET /api/tasks ----
  describe "GET /api/tasks" do
    it "タスク一覧を取得できる" do
      Task.create!(title: "テストタスク1", status: :not_started, user: user)
      Task.create!(title: "テストタスク2", status: :in_progress, user: user)

      get "/api/tasks", headers: auth_headers_for(user)

      expect(response).to have_http_status(:ok)
      expect(json.size).to eq(2)
      expect(json.first["title"]).to eq("テストタスク1")
    end
  end

  # ---- GET /api/tasks（current_userのみ返す想定）----
  describe "GET /api/tasks（current_userのみ）" do
    it "自分のタスクだけ取得できる" do
      user1 = User.create!(email: "user1@example.com", password: "password")
      user2 = User.create!(email: "user2@example.com", password: "password")
      Task.create!(title: "user1のタスク1", status: :not_started, user: user1)
      Task.create!(title: "user1のタスク2", status: :completed,   user: user1)
      Task.create!(title: "user2のタスク",   status: :in_progress, user: user2)

      get "/api/tasks", headers: auth_headers_for(user1)

      expect(response).to have_http_status(:ok)
      titles = json.map { |t| t["title"] }
      expect(titles).to include("user1のタスク1", "user1のタスク2")
      expect(titles).not_to include("user2のタスク")
    end
  end

  # ---- POST /api/tasks ----
  describe "POST /api/tasks" do
    it "タスクを作成できる" do
      post "/api/tasks",
           params: { task: { title: "新しいタスク", status: :not_started } }.to_json,
           headers: auth_headers_for(user).merge(json_headers)

      expect(response).to have_http_status(:created)
      expect(json["title"]).to eq("新しいタスク")
    end

    it "タイトルが空なら422を返す" do
      post "/api/tasks",
           params: { task: { title: "", status: :not_started } }.to_json,
           headers: auth_headers_for(user).merge(json_headers)

      expect(response).to have_http_status(:unprocessable_entity)
      expect(json["errors"]).to include("Title can't be blank")
    end

    context "未ログインの場合401を返す" do
      before do
        post "/api/tasks",
             params: { task: { title: "未ログインタスク", status: :not_started } }.to_json,
             headers: json_headers
      end
      it_behaves_like "unauthorized request"
    end
  end

  # ---- PATCH /api/tasks/:id ----
  describe "PATCH /api/tasks/:id" do
    it "タスクを更新できる" do
      task = Task.create!(title: "更新前タスク", status: :not_started, user: user)

      patch "/api/tasks/#{task.id}",
            params: { task: { title: "更新後タスク" } }.to_json,
            headers: auth_headers_for(user).merge(json_headers)

      expect(response).to have_http_status(:ok)
      expect(json["title"]).to eq("更新後タスク")
    end

    context "存在しないIDなら404を返す" do
      before do
        patch "/api/tasks/999999",
              params: { task: { title: "更新後タスク" } }.to_json,
              headers: auth_headers_for(user).merge(json_headers)
      end
      it_behaves_like "not found request"
    end

    context "未ログインの場合401を返す" do
      let(:task) { Task.create!(title: "ログイン必須タスク", status: :not_started, user: user) }
      before do
        patch "/api/tasks/#{task.id}",
              params: { task: { title: "x" } }.to_json,
              headers: json_headers
      end
      it_behaves_like "unauthorized request"
    end
  end

  # ---- DELETE /api/tasks/:id ----
  describe "DELETE /api/tasks/:id" do
    it "タスクを削除できる" do
      task = Task.create!(title: "削除タスク", status: :not_started, user: user)

      delete "/api/tasks/#{task.id}", headers: auth_headers_for(user)

      expect(response).to have_http_status(:no_content)
      expect(Task.find_by(id: task.id)).to be_nil
    end

    context "存在しないIDなら404を返す" do
      before { delete "/api/tasks/999999", headers: auth_headers_for(user) }
      it_behaves_like "not found request"
    end

    context "未ログインの場合401を返す" do
      let(:task) { Task.create!(title: "未ログイン削除タスク", status: :not_started, user: user) }
      before { delete "/api/tasks/#{task.id}" }
      it_behaves_like "unauthorized request"
    end
  end
end