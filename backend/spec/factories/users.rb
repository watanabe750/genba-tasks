FactoryBot.define do
    factory :user do
      email { "user_#{SecureRandom.hex(4)}@example.com" }
      password { "password" }
    end
end