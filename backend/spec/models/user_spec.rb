require 'rails_helper'

RSpec.describe User, type: :model do
    describe "バリデーション" do
        # 正常系
        it "メールとパスワードがあれば有効" do
            # 正しい値が揃っていたら保存できる(バリデーション通過)
            user = User.new(email: "valid@example.com", password: "password")
            expect(user).to be_valid
        end

        # 異常系(メール空)
        it "メールが空なら無効" do
            # emailが空ならバリデーションエラーになる
            user = User.new(email: "", password: "password" )
            expect(user).not_to be_valid # 無効であること
            expect(user.errors[:email]).to include("can't be blank") # email必須のエラーが出ていること
        end

        # 異常系(パスワード空)
        it "パスワードが空なら無効" do
            # passwordが空ならバリデーションエラーになる
            user = User.new(email: "valid@example.com", password: "")
            expect(user).not_to be_valid # 無効であること
            expect(user.errors[:password]).to include("can't be blank") # password必須のエラーが出てること
        end

        # 異常系(メール重複)
        it "メールが重複していたら無効" do
            # すでに保存されているemailと同じemailの場合、バリデーションエラーになる
            User.create!(email: "duplicate@example.com", password: "password")
            user = User.new(email: "duplicate@example.com", password: "password")
            expect(user).not_to be_valid # 無効であること
            expect(user.errors[:email]).to include("has already been taken") # email一意制約のエラーが出ていること
        end
    end
end