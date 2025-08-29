# spec/requests/api/tasks_parent_guard_spec.rb
require "rails_helper"

RSpec.describe "Api::Tasks parent guard", type: :request do
  let!(:user)   { User.create!(email: "u@example.com", password: "password") }
  let!(:p1)     { Task.create!(user:, title: "P1", status: :not_started, site: "S1", depth: 1) }
  let!(:p2)     { Task.create!(user:, title: "P2", status: :not_started, site: "S2", depth: 1) }
  let!(:c1)     { Task.create!(user:, title: "C1", status: :not_started, parent: p1, depth: 2) }
  let!(:c2)     { Task.create!(user:, title: "C2", status: :not_started, parent: p1, depth: 2) }
  let!(:c3)     { Task.create!(user:, title: "C3", status: :not_started, parent: p2, depth: 2) }

  # 認証をモック（プロジェクトの実装に合わせて最低限のスタブ）
  before do
    allow_any_instance_of(Api::BaseController).to receive(:current_user).and_return(user)
    allow_any_instance_of(Api::BaseController).to receive(:authenticate_user!).and_return(true) if
      Api::BaseController.method_defined?(:authenticate_user!)
  end

  def patch_task(id, body)
    patch "/api/tasks/#{id}", params: body, as: :json
  end

  it "同一親内の通常更新（titleなど）は成功する" do
    patch_task c1.id, { task: { title: "C1-renamed" } }
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body)["title"]).to eq("C1-renamed")
  end

  it "parent_id を同値で送ってもOK（実質ノーオペ）" do
    patch_task c1.id, { task: { parent_id: p1.id } }
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body)["parent_id"]).to eq(p1.id)
  end

  it "親をまたぐ parent_id の変更は 422 を返す" do
    patch_task c1.id, { task: { parent_id: p2.id } }
    expect(response).to have_http_status(:unprocessable_entity)
    body = JSON.parse(response.body)
    expect(body["errors"]).to include(/親をまたぐ移動は不可/i)
  end

  it "親を外す（nil へ変更）も 422 を返す（仕様外）" do
    patch_task c1.id, { task: { parent_id: nil } }
    expect(response).to have_http_status(:unprocessable_entity)
  end

  it "別の通常フィールド更新と parent_id 変更を同時指定しても 422（丸ごと拒否）" do
    patch_task c1.id, { task: { title: "x", parent_id: p2.id } }
    expect(response).to have_http_status(:unprocessable_entity)
    # 変更されていないこと
    expect(c1.reload.title).to eq("C1")
  end
end
