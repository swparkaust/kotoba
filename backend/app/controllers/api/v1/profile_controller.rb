module Api
  module V1
    class ProfileController < ApplicationController
      def show
        render json: current_learner.as_json(only: [
          :id, :display_name, :email, :active_language_code,
          :notifications_enabled, :notification_time, :timezone
        ])
      end

      def update
        current_learner.update!(profile_params)
        render json: current_learner.as_json(only: [
          :id, :display_name, :email, :active_language_code
        ])
      end

      private

      def profile_params
        params.permit(:display_name, :active_language_code, :notifications_enabled,
                      :notification_time, :timezone)
      end
    end
  end
end
