class User < ApplicationRecord
       # Devise modules: 必要最低限。trackable入れるならカラム追加済みが前提
       devise :database_authenticatable, :registerable,
              :recoverable, :rememberable, :validatable

       include DeviseTokenAuth::Concerns::User

       has_many :tasks, dependent: :destroy
end