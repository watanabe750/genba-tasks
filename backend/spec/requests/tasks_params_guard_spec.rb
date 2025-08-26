# spec/requests/tasks_params_guard_spec.rb
require "rails_helper"

RSpec.describe "Tasks params guard", type: :request do
  let(:user) { create(:user) }

  def j
    JSON.parse(response.body)
  end

  it "status に無効値(99)を与えると422" do
    post "/api/tasks",
      params: { task: { title: "x", status: 99, site: "現場X" } }.to_json,
      headers: auth_headers_for(user).merge(json_headers)

    expect(response).to have_http_status(:unprocessable_entity)
    expect(j["errors"].join).to match(/Invalid parameter|invalid/i)
  end

  it "status に無効値(文字列foo)を与えると422" do
    post "/api/tasks",
      params: { task: { title: "x", status: "foo", site: "現場X" } }.to_json,
      headers: auth_headers_for(user).merge(json_headers)

    expect(response).to have_http_status(:unprocessable_entity)
    expect(j["errors"].join).to match(/Invalid parameter|invalid/i)
  end

  it "progress < 0 は422" do
    post "/api/tasks",
    params: { task: { title: "x", status: :not_started, progress: -1, site: "現場X" } }.to_json,
      headers: auth_headers_for(user).merge(json_headers)

    expect(response).to have_http_status(:unprocessable_entity)
    expect(j["errors"].join).to match(/Progress/i)
  end

  it "progress > 100 は422" do
    post "/api/tasks",
    params: { task: { title: "x", status: :not_started, progress: 101, site: "現場X" } }.to_json,
      headers: auth_headers_for(user).merge(json_headers)

    expect(response).to have_http_status(:unprocessable_entity)
    expect(j["errors"].join).to match(/Progress/i)
  end

  it "status の整数(0/1/2)は有効" do
    post "/api/tasks",
    params: { task: { title: "ok", status: 0, site: "現場X" } }.to_json,
      headers: auth_headers_for(user).merge(json_headers)

    expect(response).to have_http_status(:created)
    expect(j["status"]).to eq("not_started")
    expect(j["site"]).to eq("現場X")
  end

  it "status の文字列(not_started 等)は有効" do
    post "/api/tasks",
    params: { task: { title: "ok", status: "in_progress", site: "現場X" } }.to_json,
      headers: auth_headers_for(user).merge(json_headers)

    expect(response).to have_http_status(:created)
    expect(j["status"]).to eq("in_progress")
    expect(j["site"]).to eq("現場X")
  end
end
