require "rails_helper"

RSpec.describe "GET /up", type: :request do
  it "returns 200 and health json without auth" do
    get "/up"
    expect(response).to have_http_status(:ok)
    json = JSON.parse(response.body)
    expect(json["status"]).to eq("ok")
    expect(json).to include("app", "sha", "rails_env", "time", "db")
  end
end
