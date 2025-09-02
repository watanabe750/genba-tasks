Rails.application.routes.draw do
  namespace :api do
    mount_devise_token_auth_for 'User', at: 'auth'

    get "me", to: "users#me"

    resources :tasks do
      collection do
        get :priority
        get :sites
      end
      member do
        patch :reorder
      end
    end
  end
end
