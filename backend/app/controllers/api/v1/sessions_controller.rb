module Api
  module V1
    class SessionsController < ApplicationController
      skip_before_action :authenticate_learner!

      def create
        learner = Learner.find_by(email: params[:email])
        if learner&.authenticate(params[:password])
          learner.update!(auth_token: SecureRandom.hex(32)) unless learner.auth_token
          render json: { auth_token: learner.auth_token, learner: learner.as_json(only: [ :id, :display_name, :email ]) }
        else
          render json: { error: "Invalid email or password" }, status: :unauthorized
        end
      end

      def signup
        learner = Learner.new(
          display_name: params[:display_name],
          email: params[:email],
          password: params[:password],
          auth_token: SecureRandom.hex(32)
        )

        if learner.save
          render json: { auth_token: learner.auth_token, learner: learner.as_json(only: [ :id, :display_name, :email ]) }, status: :created
        else
          render json: { errors: learner.errors.full_messages }, status: :unprocessable_entity
        end
      end
    end
  end
end
