require "rails_helper"

# 子のprogress変更で親/祖先の平均が自動更新される
RSpec.describe Task, type: :model do
  it "子のprogress更新で親の平均が更新される" do
    user = create(:user)
    parent = create(:task, user:, progress: 0)
    c1 = create(:task, user:, parent:, progress: 0)
    c2 = create(:task, user:, parent:, progress: 100)

    c1.update!(progress: 50)
    parent.reload
    expect(parent.progress).to eq(75) # (50+100)/2 を期待
  end
end
