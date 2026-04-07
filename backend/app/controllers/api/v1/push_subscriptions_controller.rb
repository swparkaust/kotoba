module Api
  module V1
    class PushSubscriptionsController < ApplicationController
      def create
        subscription = PushSubscription.find_or_initialize_by(endpoint: params[:endpoint])
        subscription.learner = current_learner
        subscription.p256dh_key = params.dig(:keys, :p256dh)
        subscription.auth_key = params.dig(:keys, :auth)
        subscription.save!
        render json: subscription, status: :created
      end

      def destroy
        PushSubscription.find_by(endpoint: params[:endpoint], learner: current_learner)&.destroy
        head :no_content
      end
    end
  end
end
