# frozen_string_literal: true
require "rails_helper"

RSpec.describe "Tasks children limit", type: :request do
  let(:me) { create(:user) }

  it "4件までは作成OK、5件目は422（エラーメッセージ含む）" do
    parent = create(:task, user: me, site: "現場X") # 親は site 必須

    1.upto(4) do |i|
      post "/api/tasks",
           params: { task: { title: "子#{i}", parent_id: parent.id } }.to_json,
           headers: auth_headers_for(me).merge(json_headers)
      expect(response).to have_http_status(:created)
      expect(JSON.parse(response.body)["parent_id"]).to eq(parent.id)
    end

    # 5件目はNG
    post "/api/tasks",
         params: { task: { title: "子5", parent_id: parent.id } }.to_json,
         headers: auth_headers_for(me).merge(json_headers)

    expect(response).to have_http_status(:unprocessable_entity)
    expect(JSON.parse(response.body)["errors"].join).to include("最大4件")
  end

  it "親付け替えで5件目になる場合も422" do
    a = create(:task, user: me, site: "現場A")
    b = create(:task, user: me, site: "現場B")
    # A には既に4件
    create_list(:task, 4, user: me, parent: a)
    # B に1件作成 → A に付け替え
    child = create(:task, user: me, parent: b, title: "子X")

    patch "/api/tasks/#{child.id}",
          params: { task: { parent_id: a.id } }.to_json,
          headers: auth_headers_for(me).merge(json_headers)

    expect(response).to have_http_status(:unprocessable_entity)
    expect(JSON.parse(response.body)["errors"].join).to include("最大4件")
  end
end
