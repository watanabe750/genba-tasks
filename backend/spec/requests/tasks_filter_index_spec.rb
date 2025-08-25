require "rails_helper"

RSpec.describe "Tasks filter/sort on index", type: :request do
  let(:user) { create(:user) }

  it "site/status/progress/parents_only/order_by=deadline asc（期限なしは後ろ）" do
    # 親3つ（親だけ site 必須）
    a = create(:task, user: user, site: "Alpha", status: :in_progress, progress: 20, deadline: "2025-12-31")
    b = create(:task, user: user, site: "Beta",  status: :not_started, progress: 0,  deadline: "2025-10-15")
    c = create(:task, user: user, site: "Alpha", status: :completed,   progress: 100, deadline: nil)
    # 子は site 任意
    create(:task, user: user, parent: a, title: "A-child", progress: 20)

    # 1) site=Alpha & parents_only=1 & status=in_progress & progress 10..50
    get "/api/tasks",
        params: {
          site: "Alpha",
          parents_only: "1",
          status: ["in_progress"],
          progress_min: 10,
          progress_max: 50,
          order_by: "deadline",
          dir: "asc"
        },
        headers: auth_headers_for(user)
    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body.map { _1["id"] }).to eq([a.id])

    # 2) site解除 + status = in_progress, not_started + progress 0..100
    get "/api/tasks",
        params: {
          parents_only: "1",
          status: ["not_started", "in_progress"],
          progress_min: 0,
          progress_max: 100,
          order_by: "deadline",
          dir: "asc"
        },
        headers: auth_headers_for(user)
    expect(response).to have_http_status(:ok)
    ids = JSON.parse(response.body).map { _1["id"] }
    expect(ids).to eq([b.id, a.id]) # 10/15 → 12/31

    # 3) completed も含める（期限なしは末尾）
    get "/api/tasks",
        params: {
          parents_only: "1",
          status: ["not_started", "in_progress", "completed"],
          progress_min: 0,
          progress_max: 100,
          order_by: "deadline",
          dir: "asc"
        },
        headers: auth_headers_for(user)
    expect(response).to have_http_status(:ok)
    ids = JSON.parse(response.body).map { _1["id"] }
    expect(ids).to eq([b.id, a.id, c.id]) # c(deadline=nil) は最後
  end
end
