# config/routes.rb
Rails.application.routes.draw do
  get "/up", to: "health#show"

  # ゲストログイン
  post "/guest/login", to: "guest#login"

  namespace :api do
    mount_devise_token_auth_for 'User', at: 'auth'

    get "me", to: "users#me"
    get "gallery", to: "gallery#index"

    resources :tasks do
      collection do
        get :priority
        get :sites
      end
      member do
        patch :reorder
        post   :image, to: "task_images#create"
        delete :image, to: "task_images#destroy"
      end
      resources :attachments, only: [:index, :show, :create, :destroy]
    end
  end
end
