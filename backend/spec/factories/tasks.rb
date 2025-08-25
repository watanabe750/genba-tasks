FactoryBot.define do
  factory :task do
    association :user
    sequence(:title) { |n| "タスク#{n}" }
    site { "現場X" }             # ← 親タスクは site 必須なのでデフォルト付与
    # status/progress は DB デフォルト（not_started/0）に任せる

    trait :with_deadline do
      deadline { 1.week.from_now.to_date }
    end

    trait :in_progress do
      status   { :in_progress }
      progress { 50 }
    end

    trait :completed do
      status   { :completed }
      progress { 100 }
    end

    # 子タスクを明示的に作るとき
    trait :as_child do
      site { nil } # 子は site 不要
      association :parent, factory: :task
    end
  end
end
