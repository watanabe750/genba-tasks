require "rails_helper"

RSpec.describe "Tasks depth limit", type: :request do
  let(:user) { create(:user) }

  it "4階層目までは作成可、5階層目は422" do
    p1 = create(:task, user: user, site: "現場X") # depth=1
    p2 = create(:task, user: user, parent: p1)    # 2
    p3 = create(:task, user: user, parent: p2)    # 3
    p4 = create(:task, user: user, parent: p3)    # 4（ここまではOK）

    # 5階層目はエラー
    post "/api/tasks",
         params: { task: { title: "5階層目", parent_id: p4.id } }.to_json,
         headers: auth_headers_for(user).merge(json_headers)
    expect(response).to have_http_status(:unprocessable_entity)
    expect(JSON.parse(response.body)["errors"].join).to match(/4階層まで/)
  end
end
