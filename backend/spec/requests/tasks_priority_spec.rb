require "rails_helper"

# /api/tasks/priority が、自分のタスクだけを正しい順序で返す
RSpec.describe "Tasks priority", type: :request do
    let(:me)   { User.create!(email: "me@example.com",   password: "password") }
    let(:them) { User.create!(email: "them@example.com", password: "password") }

    it "current_userの優先順で返す" do
        mine1 = Task.create!(user: me,   title: "a", status: :not_started, deadline: 1.day.from_now)
        mine2 = Task.create!(user: me,   title: "b", status: :not_started, deadline: nil)
        _x    = Task.create!(user: them, title: "c", status: :not_started, deadline: 1.hour.from_now)
    
        get "/api/tasks/priority", headers: auth_headers_for(me)
    
        expect(response).to have_http_status(:ok)
        ids = JSON.parse(response.body).map { _1["id"] }
        expect(ids).to eq([mine1.id, mine2.id])
    end
end
