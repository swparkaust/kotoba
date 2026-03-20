module Api
  module V1
    class PushSubscriptionsController < ApplicationController
      def create
        subscription = PushSubscription.find_or_create_by!(
          endpoint: params[:endpoint]
        ) do |sub|
          sub.learner_id = current_learner.id
          sub.p256dh_key = params.dig(:keys, :p256dh)
          sub.auth_key = params.dig(:keys, :auth)
        end
        render json: subscription, status: :created
      end

      def destroy
        PushSubscription.find_by(endpoint: params[:endpoint], learner: current_learner)&.destroy
        head :no_content
      end
    end
  end
end
