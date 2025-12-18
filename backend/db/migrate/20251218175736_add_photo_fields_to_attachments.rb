class AddPhotoFieldsToAttachments < ActiveRecord::Migration[8.0]
  def change
    add_column :attachments, :photo_tag, :string
    add_column :attachments, :captured_at, :datetime
    add_column :attachments, :note, :text
  end
end
