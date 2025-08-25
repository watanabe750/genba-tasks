require "rails_helper"

RSpec.describe "Tasks security", type: :request do
  let(:me)   { create(:user) }
  let(:them) { create(:user) }

  it "他人のタスク更新は404/403" do
    # 親タスクなので site 必須。factory の :task は site 既定ありでOK
    other_task = create(:task, user: them)

    patch "/api/tasks/#{other_task.id}",
          params: { task: { title: "hack" } }.to_json,
          headers: auth_headers_for(me).merge(json_headers)

    expect(response).to have_http_status(:not_found).or have_http_status(:forbidden)
  end
end
