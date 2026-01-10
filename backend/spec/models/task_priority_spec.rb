require "rails_helper"

# 期限ありが前、期限なしが後ろ等の並び保証
RSpec.describe Task, type: :model do
  describe ".priority_order" do
    it "期限ありが先、期限なしが後ろ" do
      user = create(:user)
      with_deadline = create(:task, :with_deadline, user:) # factory が site 付与
      no_deadline   = create(:task, deadline: nil, user:)  # 同上
      expect(Task.where(user:).priority_order(limit: 10).pluck(:id)).to eq([with_deadline.id, no_deadline.id])
    end
  end
end
