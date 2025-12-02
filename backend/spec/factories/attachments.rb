FactoryBot.define do
  factory :attachment do
    task { nil }
    file_type { "MyString" }
    title { "MyString" }
    description { "MyText" }
    category { "MyString" }
    display_order { 1 }
  end
end
