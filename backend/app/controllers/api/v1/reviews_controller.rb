module Api
  module V1
    class ReviewsController < ApplicationController
      def index
        learner = current_learner
        scheduler = SrsScheduler.new
        cards = scheduler.due_cards(
          learner: learner,
          limit: params[:limit]&.to_i || 20,
          card_type: params[:card_type],
          level_min: params[:level_min]&.to_i,
          level_max: params[:level_max]&.to_i,
          time_budget_minutes: params[:time_budget]&.to_i
        )
        render json: cards
      end

      def stats
        learner = current_learner
        scheduler = SrsScheduler.new
        render json: scheduler.stats(learner: learner)
      end

      def submit
        learner = current_learner
        card = learner.srs_cards.find(params[:id])
        scheduler = SrsScheduler.new
        scheduler.record_review(card: card, correct: params[:correct])
        render json: card
      end

      def reactivate
        learner = current_learner
        card = learner.srs_cards.find(params[:id])
        scheduler = SrsScheduler.new
        scheduler.reactivate(card: card)
        render json: card
      end
    end
  end
end
