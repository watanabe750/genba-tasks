require "rails_helper"

RSpec.describe "Tasks security", type: :request do
  let(:me)   { User.create!(email: "me@example.com",   password: "password") }
  let(:them) { User.create!(email: "them@example.com", password: "password") }

  it "他人のタスク更新は404/403" do
    other_task = Task.create!(user: them, title: "x", status: :not_started)
    patch "/api/tasks/#{other_task.id}",
          params: { task: { title: "hack" } }.to_json,
          headers: auth_headers_for(me).merge(json_headers)

    expect(response).to have_http_status(:not_found).or have_http_status(:forbidden)
  end
end
