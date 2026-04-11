Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      resources :push_subscriptions, only: [ :create ] do
        collection do
          delete :destroy, action: :destroy
        end
      end

      post "sessions", to: "sessions#create"
      post "sessions/signup", to: "sessions#signup"

      resource :profile, only: [ :show, :update ], controller: :profile

      resources :languages, only: [ :index, :show ], param: :code

      resources :curriculum, only: [ :index, :show ], param: :id

      resources :lessons, only: [ :index, :show ]

      resources :exercises, only: [ :index, :show ] do
        member do
          post :submit
        end
      end

      get "progress", to: "progress#index"
      patch "progress", to: "progress#update"
      get "progress/jlpt_comparison", to: "progress#jlpt_comparison"

      get "reviews", to: "reviews#index"
      get "reviews/stats", to: "reviews#stats"
      post "reviews/:id/submit", to: "reviews#submit"
      post "reviews/:id/reactivate", to: "reviews#reactivate"

      get "placement/questions", to: "placement#questions"
      post "placement", to: "placement#create"
      post "placement/:id/accept", to: "placement#accept"

      post "writing/submit", to: "writing#submit"
      get "writing/history", to: "writing#history"

      post "speaking/submit", to: "speaking#submit"
      get "speaking/history", to: "speaking#history"

      get "library/reading_stats", to: "library#reading_stats"
      resources :library, only: [ :index, :show ] do
        member do
          post :record_session
        end
      end

      get "content_packs/latest", to: "content_packs#latest"
      get "content_packs/check_update", to: "content_packs#check_update"

      post "simulate", to: "simulate#create" if Rails.env.test?
    end
  end

  mount ActionCable.server => "/cable"
end
