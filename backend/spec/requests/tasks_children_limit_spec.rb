# spec/requests/tasks_children_limit_spec.rb
require "rails_helper"

RSpec.describe "Tasks children limit", type: :request do
  let(:user) { create(:user) }

  it "同じ親の直下は4件まで、5件目は422" do
    parent = create(:task, user: user, site: "現場X")

    4.times do |i|
      post "/api/tasks",
           params: { task: { title: "子#{i + 1}", parent_id: parent.id } }.to_json,
           headers: auth_headers_for(user).merge(json_headers)
      expect(response).to have_http_status(:created)
    end

    post "/api/tasks",
         params: { task: { title: "子5", parent_id: parent.id } }.to_json,
         headers: auth_headers_for(user).merge(json_headers)
    expect(response).to have_http_status(:unprocessable_entity)
    expect(JSON.parse(response.body)["errors"].join).to match(/最大4件/)
  end

  it "親またぎ移動は常に422（仕様：親またぎ不可）" do
    a = create(:task, user: user, site: "A")
    b = create(:task, user: user, site: "B")
    4.times { |i| create(:task, user: user, parent: a, title: "A子#{i + 1}") }
    moving = create(:task, user: user, parent: b, title: "移動対象")

    # 満杯の a へ → 422（満杯かどうかに関係なくNG）
    patch "/api/tasks/#{moving.id}",
          params: { task: { parent_id: a.id } }.to_json,
          headers: auth_headers_for(user).merge(json_headers)
    expect(response).to have_http_status(:unprocessable_entity)
    expect(JSON.parse(response.body)["errors"].join).to match(/親をまたぐ移動は不可/)

    # 空きのある c へ → 422（仕様上、親またぎは常にNG）
    c = create(:task, user: user, site: "C")
    patch "/api/tasks/#{moving.id}",
          params: { task: { parent_id: c.id } }.to_json,
          headers: auth_headers_for(user).merge(json_headers)
    expect(response).to have_http_status(:unprocessable_entity)
    expect(JSON.parse(response.body)["errors"].join).to match(/親をまたぐ移動は不可/)
  end
end
