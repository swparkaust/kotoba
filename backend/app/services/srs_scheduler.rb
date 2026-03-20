class SrsScheduler
  MAX_INTERVAL = 180
  BURN_THRESHOLD = 10

  def due_cards(learner:, limit: 20, card_type: nil, level_min: nil, level_max: nil, time_budget_minutes: nil)
    scope = learner.srs_cards.active.due

    scope = scope.by_type(card_type) if card_type.present?
    scope = scope.by_level_range(level_min, level_max) if level_min && level_max

    scope = scope.order(Arel.sql("next_review_at ASC"))

    if time_budget_minutes
      estimated_cards = (time_budget_minutes * 60 / 15.0).floor
      limit = [estimated_cards, limit].min
    end

    scope.limit(limit)
  end

  def record_review(card:, correct:)
    if correct
      card.repetitions += 1
      card.interval_days = [(card.interval_days * card.ease_factor).round, MAX_INTERVAL].min
      card.ease_factor = [card.ease_factor + 0.1, 3.0].min

      if card.repetitions >= BURN_THRESHOLD && card.interval_days >= MAX_INTERVAL
        card.burned = true
      end
    else
      card.repetitions = 0
      card.interval_days = 1
      card.ease_factor = [card.ease_factor - 0.2, 1.3].max
    end

    card.last_reviewed_at = Time.current
    card.next_review_at = Time.current + card.interval_days.days
    card.save!
  end

  def reactivate(card:)
    card.update!(burned: false, interval_days: 1, repetitions: 0, next_review_at: Time.current)
  end

  def stats(learner:)
    cards = learner.srs_cards
    {
      total: cards.count,
      active: cards.active.count,
      burned: cards.burned.count,
      due_now: cards.due.count,
      due_today: cards.active.where("next_review_at <= ?", Time.current.end_of_day).count
    }
  end
end
