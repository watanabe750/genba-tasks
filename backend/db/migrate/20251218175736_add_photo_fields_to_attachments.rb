class AddPhotoFieldsToAttachments < ActiveRecord::Migration[8.0]
  def change
    add_column :attachments, :photo_tag, :string unless column_exists?(:attachments, :photo_tag)
    add_column :attachments, :captured_at, :datetime unless column_exists?(:attachments, :captured_at)
    add_column :attachments, :note, :text unless column_exists?(:attachments, :note)
  end
end
