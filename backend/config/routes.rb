Rails.application.routes.draw do
  namespace :api do
    mount_devise_token_auth_for 'User', at: 'auth'
    
    resources :tasks, only: [:index, :show, :create, :update, :destroy] do
      collection {get :priority}
    end
  end
end