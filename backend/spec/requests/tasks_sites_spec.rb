# frozen_string_literal: true
require "rails_helper"

RSpec.describe "Tasks sites endpoint", type: :request do
  let(:me)   { create(:user) }
  let(:them) { create(:user) }

  it "/api/tasks/sites は 親タスクの site を distinct で返し、他人/子は除外" do
    # 自分の親（重複含む）
    create(:task, user: me, site: "現場Alpha")
    create(:task, user: me, site: "現場Beta")
    create(:task, user: me, site: "現場Alpha") # 重複は1件化される想定

    # 親Gamma + 子（子は対象外。site 有無に関わらず除外される）
    parent_gamma = create(:task, user: me, site: "現場Gamma")
    create(:task, user: me, parent: parent_gamma)                    # 子（siteなし）
    create(:task, user: me, parent: parent_gamma, site: "子だけのsite") # 子（siteあり）も除外

    # 他人分は弾く
    create(:task, user: them, site: "現場Zeta")

    get "/api/tasks/sites", headers: auth_headers_for(me)

    expect(response).to have_http_status(:ok)
    arr = JSON.parse(response.body)
    # コントローラは LOWER(site) ASC で並べ替え済み
    expect(arr).to eq(%w[現場Alpha 現場Beta 現場Gamma])
  end
end
