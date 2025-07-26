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

    # GET /tasks (関連データ：ユーザーごと)
    describe "GET /tasks (ユーザーごとのスコープ)" do
        it "指定したユーザーのタスクだけ取得できる" do
            user1 = User.create!(email: "user1@example.com", password: "password")
            user2 = User.create!(email: "user2@example.com", password: "password")

            Task.create!(title: "user1のタスク1", status: :not_started, user: user1)
            Task.create!(title: "user1のタスク2", status: :completed, user: user1)
            Task.create!(title: "user2のタスク", status: :in_progress, user: user2)

            get "/tasks", params: { user_id: user1.id } # user1のタスクだけ取得するようにAPIリクエストを送る

            expect(response).to have_http_status(:ok) # HTTPステータスが200(OK)であることを確認

            json = JSON.parse(response.body) # JSONレスポンスをパースして配列化
            expect(json.size).to eq(2) # 取得したタスク数が２件だけであることを確認
            titles = json.map { |task| task["title"]} # タスクのタイトル一覧を配列に抽出
            expect(titles).to include("user1のタスク1", "user1のタスク2") # user1のタスクが含まれていることを確認

            expect(titles).not_to include("user2のタスク") # user2のタスクが含まれていないことを確認
        end
    end


    # タスク生成テスト
    describe "POST /tasks()" do
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
      
      # バリデーションテスト (異常系:タイトルが空の場合)
      describe "POST /tasks (異常系)" do
        it "タイトルが空なら422を返す" do
            # テスト用ユーザーを作成
            user = User.create!(email: "test@example.com", password: "password")
            sign_in user

            # APIにタスク作成リクエストを送信 (タイトルが空)
            post "/tasks", params: {
                task: {
                    title: "", # バリデーションに引っ掛かる値
                    status: :not_started, # enumのステータス
                    user_id: user.id # 関連付けるユーザー
                }
            }

            # HTTPステータスコードの確認
            # コントローラ側で422を返すように実装している前提
            expect(response).to have_http_status(:unprocessable_entity)
            json = JSON.parse(response.body) # レスポンスのJSONをパース
            # エラーメッセージがレスポンスに含まれているか確認
            expect(json["errors"]).to include("Title can't be blank")
        end
    end

    # POST /tasks (認証必須)
    describe "POST /tasks (認証必須)" do
        it "未ログインの場合401を返す" do
            # ログインせずにタスク作成APIを叩く
            post "/tasks", params: {
                task: {
                    title: "未ログインタスク",
                    status: :not_started,
                    user_id: 1 # 指定しているが認証必須なので無視される想定
                }
            }

            expect(response).to have_http_status(:unauthorized)
            json = JSON.parse(response.body)
            expect(json["errors"]).to include("You need to sign in or sign up before continuing.")
        end
    end

    describe "PATCH /tasks/:id" do
        it "タスクを更新できる" do
            user = User.create!(email: "test3@example.com", password: "password")
            sign_in user
            task = Task.create!(title: "更新前タスク", status: :not_started, user: user)

            patch "/tasks/#{task.id}", params: { task: { title: "更新後タスク" } }

            expect(response).to have_http_status(:ok)
            json = JSON.parse(response.body)
            expect(json["title"]).to eq("更新後タスク")
        end
    end

    # PATCH /tasks/:id (異常系)
    describe "PATCH /tasks/:id(異常系)" do
        it "存在しないIDなら404を返す" do
            user = User.create!(email: "patchtest@example.com", password: "password")
            sign_in user
            patch "/tasks/999999", params: {
                task: { title: "更新後タスク" }
            }

            expect(response).to have_http_status(:not_found)
            json = JSON.parse(response.body)
            expect(json["errors"]).to include("Task not found")
        end
    end

    # PATCH /tasks/:id (認証必須)
    describe "PATCH /tasks/:id (認証必須)" do
        it "未ログインの場合401を返す" do
            user = User.create!(email: "patchtest@example.com", password: "password")
            task = Task.create!(title: "未ログイン更新タスク", status: :not_started, user: user)
            # ログインせずにPATCHリクエストを送信
            patch "/tasks/#{task.id}", params: {
                task: { title: "未ログインで更新" }
            }
            # HTTPステータスが401(Unauthorized)であることを確認
            expect(response).to have_http_status(:unauthorized)
            json = JSON.parse(response.body)
            expect(json["errors"]).to include("You need to sign in or sign up before continuing.")
        end
    end

    describe "DELETE /tasks/:id" do
        it "タスクを削除できる" do
            user = User.create!(email: "test4@example.com", password: "password")
            sign_in user
            task = Task.create!(title: "削除タスク", status: :not_started, user: user)

            delete "/tasks/#{task.id}"

            expect(response).to have_http_status(:no_content)
            expect(Task.find_by(id: task.id)).to be_nil
        end
    end

    # DELETE /tasks/:id (異常系)
    describe "DELETE /tasks/:id (異常系)" do
        it "存在しないIDなら404を返す" do
            user = User.create!(email: "test4@example.com", password: "password")
            sign_in user
            delete "/tasks/999999"

            expect(response).to have_http_status(:not_found)
            json = JSON.parse(response.body)
            expect(json["errors"]).to include("Task not found")
        end
    end

    # DELETE /tasks/:id (認証必須)
    describe "DELETE /tasks/:id (認証必須)" do
        it "未ログインの場合401を返す" do
            user = User.create!(email: "deletetest@example.com", password: "password")
            task = Task.create!(title: "未ログイン削除タスク",status: :not_started, user: user)

            # ログインせずにDELETEリクエストを送信
            delete "/tasks/#{task.id}"

            expect(response).to have_http_status(:unauthorized) # HTTPステータスが401(Unauthorized)であることを確認
            json = JSON.parse(response.body)
            expect(json["errors"]).to include("You need to sign in or sign up before continuing.")
        end
    end

end