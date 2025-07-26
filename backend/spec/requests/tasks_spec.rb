require 'rails_helper'

RSpec.describe "Task API", type: :request do
    include Devise::Test::IntegrationHelpers # Deviseのログインヘルパー (sign_in, sign_outなど) を利用可能にする

    # ---- テスト共有ユーザー ---- #
    let(:user) { User.create!(email: "test@example.com", password: "password") }

    # ---- 共通レスポンス分析 ---- #
    def json
        JSON.parse(response.body)
    end

    # ---- 共有テストパターン(shared_examples) ---- #
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




    # ---- GET /tasks ----#
    describe "GET /tasks" do
        it "タスク一覧を取得できる" do
            # テストデータ作成
            Task.create!(title: "テストタスク1", status: :not_started, user: user)
            Task.create!(title: "テストタスク2", status: :in_progress, user: user)

            # APIリクエスト送信
            get "/tasks"

            # レスポンスの検証
            expect(response).to have_http_status(:ok) # ステータスコード200(OK)？
            expect(json.size).to eq(2) # APIレスポンスで帰ってきたタスク配列の要素が２つか検証
            expect(json[0]["title"]).to eq("テストタスク1") # 1つ目のタスクタイトルが「テストタスク1」か？
        end
    end

    # ---- GET /tasks (ユーザーごとのスコープ) ----#
    describe "GET /tasks (ユーザーごとのスコープ)" do
        it "指定したユーザーのタスクだけ取得できる" do
            user1 = User.create!(email: "user1@example.com", password: "password")
            user2 = User.create!(email: "user2@example.com", password: "password")
            Task.create!(title: "user1のタスク1", status: :not_started, user: user1)
            Task.create!(title: "user1のタスク2", status: :completed, user: user1)
            Task.create!(title: "user2のタスク", status: :in_progress, user: user2)

            get "/tasks", params: { user_id: user1.id } # user1のタスクだけ取得するようにAPIリクエストを送る

            expect(response).to have_http_status(:ok) # HTTPステータスが200(OK)であることを確認
            titles = json.map { |task| task["title"]} # タスクのタイトル一覧を配列に抽出
            expect(titles).to include("user1のタスク1", "user1のタスク2") # user1のタスクが含まれていることを確認
            expect(titles).not_to include("user2のタスク") # user2のタスクが含まれていないことを確認
        end
    end

    # ---- POST/ tasks (タスクを作成できる) ----#
    describe "POST /tasks()" do
        it "タスクを作成できる" do
          sign_in user.reload  # ← ログイン状態を再現
          post "/tasks", params: { task: { 
            title: "新しいタスク", 
            status: :not_started, 
          } }
      
          expect(response).to have_http_status(:created) # ステータス201
          expect(json["title"]).to eq("新しいタスク") # 作成したタスクのタイトルが一致
        end

        # ---- バリデーションテスト (異常系:タイトルが空の場合)
        it "タイトルが空なら422を返す" do
            sign_in user.reload
            # APIにタスク作成リクエストを送信 (タイトルが空)
            post "/tasks", params: {
                task: {
                    title: "", # バリデーションに引っ掛かる値
                    status: :not_started, # enumのステータス
                }
            }
            # HTTPステータスコードの確認
            # コントローラ側で422を返すように実装している前提
            expect(response).to have_http_status(:unprocessable_entity)
            # エラーメッセージがレスポンスに含まれているか確認
            expect(json["errors"]).to include("Title can't be blank")
        end
        
        # ---- POST /tasks (認証必須)
        context "未ログインの場合401を返す" do
            # ログインせずにタスク作成APIを叩く
            before { post "/tasks", params: { 
                task: {
                    title: "未ログインタスク",
                    status: :not_started
                }
            }}
            it_behaves_like "unauthorized request"
        end
    end

    # ---- PATCH /tasks/:id ---- #
    describe "PATCH /tasks/:id" do
        it "タスクを更新できる" do
            sign_in user.reload
            task = Task.create!(title: "更新前タスク", status: :not_started, user: user)

            patch "/tasks/#{task.id}", params: { task: { title: "更新後タスク" } }

            expect(response).to have_http_status(:ok) # ステータス201
            expect(json["title"]).to eq("更新後タスク") # タイトルが更新後の内容になる
        end

        # ---- PATCH /tasks/:id (異常系)
        context "存在しないIDなら404を返す" do
            before do
                sign_in user.reload
                patch "/tasks/999999", params: {
                    task: { title: "更新後タスク" }
                }
            end
            it_behaves_like "not found request"
        end

        # ---- PATCH /tasks/:id (認証必須) 
        context "未ログインの場合401を返す" do
            let(:task) { 
                Task.create!(
                    title: "ログイン必須タスク",
                    status: :not_started,
                    user: user
                )
            }
            before { patch "/tasks/#{task.id}"}
            it_behaves_like "unauthorized request"
        end
    end
    
    # ---- DELETE /tasks/:id ---- #
    describe "DELETE /tasks/:id" do
        it "タスクを削除できる" do
            sign_in user.reload
            task = Task.create!(title: "削除タスク", status: :not_started, user: user)
            
            delete "/tasks/#{task.id}"

            expect(response).to have_http_status(:no_content) # ステータス204
            expect(Task.find_by(id: task.id)).to be_nil # DBから削除されていること
        end

        # ---- DELETE /tasks/:id (異常系)
        context "存在しないIDなら404を返す" do
            before do
                sign_in user.reload
                delete "/tasks/999999"
            end
            it_behaves_like "not found request"
        end

        # ---- DELETE /tasks/:id (認証必須)
        context "未ログインの場合401を返す" do
            let(:task) { Task.create!(title: "未ログイン削除タスク", status: :not_started, user: user) }
            before { delete "/tasks/#{task.id}" }
            it_behaves_like "unauthorized request"
        end
    end
end