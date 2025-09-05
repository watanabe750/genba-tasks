# spec/requests/task_images_spec.rb
require "rails_helper"
require "base64"
require "tempfile"
require "rack/test"

RSpec.describe "Task Images API", type: :request do
  let(:user) { create(:user) }

  # authヘッダから JSON の Content-Type を外して multipart を優先
  def multipart_headers_for(user)
    h = auth_headers_for(user).dup
    h.delete("Content-Type")
    h.delete("CONTENT_TYPE")
    h
  end

  def tiny_png_upload
        # 1x1 透明PNG（Base64）→ Tempfile → Rack::Test::UploadedFile
        b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAgMBgYp3GjwAAAAASUVORK5CYII="
        bin = Base64.decode64(b64)
        tf = Tempfile.new(["tiny", ".png"]).tap { |f| f.binmode; f.write(bin); f.rewind }
        Rack::Test::UploadedFile.new(tf.path, "image/png", original_filename: "tiny.png")
  end

  it "親タスクに画像を添付/置換でき、URLが返る" do
    parent = create(:task, user: user, site: "現場X")
    post "/api/tasks/#{parent.id}/image",
             params: { image: tiny_png_upload },
             headers: multipart_headers_for(user),
             as: :multipart
    expect(response).to have_http_status(:ok)
    json = JSON.parse(response.body)
    expect(json["image_url"]).to be_present
    expect(json["image_thumb_url"]).to be_present

    # 置換（2回目）
    post "/api/tasks/#{parent.id}/image",
             params: { image: tiny_png_upload },
             headers: multipart_headers_for(user),
             as: :multipart
    expect(response).to have_http_status(:ok)
  end

  it "子タスクには添付できず422" do
    parent = create(:task, user: user, site: "現場X")
    child  = create(:task, user: user, parent: parent, title: "子")
    post "/api/tasks/#{child.id}/image",
             params: { image: tiny_png_upload },
             headers: multipart_headers_for(user),
             as: :multipart
    expect(response).to have_http_status(:unprocessable_entity)
    expect(JSON.parse(response.body)["errors"].join).to match(/(親|上位)タスクにのみ/)
end

  it "不正なファイル形式は422" do
    parent = create(:task, user: user, site: "現場X")
    tf = Tempfile.new(["note", ".txt"]).tap { |f| f.write("hello"); f.rewind }
    txt = Rack::Test::UploadedFile.new(tf.path, "text/plain", original_filename: "note.txt")
    post "/api/tasks/#{parent.id}/image",
             params: { image: txt },
             headers: multipart_headers_for(user),
             as: :multipart
    expect(response).to have_http_status(:unprocessable_entity)
    expect(JSON.parse(response.body)["errors"].join).to match(/無効なファイル形式/)
  end
end
