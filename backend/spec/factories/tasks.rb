FactoryBot.define do
    factory :task do
      association :user
      title { "タスク#{SecureRandom.hex(3)}" }
      status { :not_started }
      progress { 0 }
      deadline { nil }
  
      trait :with_deadline do
        deadline { 2.days.from_now }
      end
    end
  end