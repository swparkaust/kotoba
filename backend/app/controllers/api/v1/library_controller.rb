module Api
  module V1
    class LibraryController < ApplicationController
      def index
        learner = current_learner
        language = Language.find_by!(code: params[:language_code] || current_learner.active_language_code)

        if params[:recommended]
          recommender = LibraryRecommender.new
          results = recommender.recommend(learner: learner, language: language, limit: params[:limit]&.to_i || 10)
          render json: results.map { |r| r[:item].as_json.merge(estimated_comprehension: r[:estimated_comprehension]) }
        else
          items = LibraryItem.where(language: language, active: true)
          items = items.for_level_range(params[:level_min]&.to_i || 5, params[:level_max]&.to_i || 12)
          items = items.where(item_type: params[:item_type]) if params[:item_type].present?
          items = items.order(difficulty_level: :asc).limit(params[:limit]&.to_i || 20)
          render json: items
        end
      end

      def show
        item = LibraryItem.find(params[:id])
        render json: item
      end

      def record_session
        learner = current_learner
        item = LibraryItem.find(params[:id])

        session = ReadingSession.create!(
          learner: learner,
          library_item: item,
          session_type: params[:session_type] || (item.audio_url.present? ? "listening" : "reading"),
          duration_seconds: params[:duration_seconds],
          words_read: params[:words_read] || 0,
          progress_pct: params[:progress_pct] || 0.0,
          new_srs_cards: params[:new_srs_cards] || []
        )

        (params[:new_srs_cards] || []).each do |card_data|
          SrsCard.find_or_create_by!(
            learner: learner,
            card_type: "vocabulary",
            card_key: card_data["word"]
          ) do |card|
            card.card_data = { front: card_data["word"], back: card_data["definition_ja"], source_level: item.difficulty_level }
            card.next_review_at = Time.current + 1.day
          end
        end

        render json: session, status: :created
      end

      def reading_stats
        learner = current_learner
        sessions = learner.reading_sessions

        render json: {
          total_reading_minutes: (sessions.where(session_type: "reading").sum(:duration_seconds) / 60.0).round(1),
          total_listening_minutes: (sessions.where(session_type: "listening").sum(:duration_seconds) / 60.0).round(1),
          total_words_read: sessions.sum(:words_read),
          items_started: sessions.select(:library_item_id).distinct.count,
          items_completed: sessions.where("progress_pct >= 0.95").select(:library_item_id).distinct.count
        }
      end
    end
  end
end
