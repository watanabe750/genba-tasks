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
end
