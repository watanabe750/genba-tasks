require "rails_helper"

# /api/tasks/priority が、自分のタスクだけを正しい順序で返す
RSpec.describe "Tasks priority", type: :request do
  let(:me)   { create(:user) }
  let(:them) { create(:user) }

  it "current_userの優先順で返す" do
    # 親タスクは site 必須（factory の :task は site 既定あり）
    mine1 = create(:task, :with_deadline, user: me)          # 期限あり
    mine2 = create(:task, user: me, deadline: nil)           # 期限なし
    _x    = create(:task, :with_deadline, user: them)        # 他人分は混ぜても返ってこない

    get "/api/tasks/priority", headers: auth_headers_for(me)

    expect(response).to have_http_status(:ok)
    ids = JSON.parse(response.body).map { _1["id"] }
    expect(ids).to eq([mine1.id, mine2.id])                  # 期限あり→期限なし
  end

  it "limitパラメータで件数を制限できる" do
    # 10個のタスクを作成
    10.times do |i|
      create(:task, user: me, deadline: Date.today + i.days)
    end

    # limit=3 を指定
    get "/api/tasks/priority?limit=3", headers: auth_headers_for(me)

    expect(response).to have_http_status(:ok)
    tasks = JSON.parse(response.body)
    expect(tasks.length).to eq(3)
  end

  it "limitパラメータで10件を取得できる" do
    # 15個のタスクを作成
    15.times do |i|
      create(:task, user: me, deadline: Date.today + i.days)
    end

    # limit=10 を指定
    get "/api/tasks/priority?limit=10", headers: auth_headers_for(me)

    expect(response).to have_http_status(:ok)
    tasks = JSON.parse(response.body)
    expect(tasks.length).to eq(10)
  end

  it "limitパラメータで15件を取得できる" do
    # 20個のタスクを作成
    20.times do |i|
      create(:task, user: me, deadline: Date.today + i.days)
    end

    # limit=15 を指定
    get "/api/tasks/priority?limit=15", headers: auth_headers_for(me)

    expect(response).to have_http_status(:ok)
    tasks = JSON.parse(response.body)
    expect(tasks.length).to eq(15)
  end
end
