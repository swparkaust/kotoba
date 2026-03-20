class LibraryRecommender
  def recommend(learner:, language:, limit: 10)
    known_keys = learner.srs_cards.active.pluck(:card_key).to_set
    highest_level = highest_completed_level(learner, language)

    target_levels = [highest_level, highest_level + 1].select { |l| l.between?(1, 12) }
    return [] if target_levels.empty?

    items = LibraryItem.where(language: language, active: true)
      .for_level_range(target_levels.min, target_levels.max)
      .order(Arel.sql("RANDOM()"))
      .limit(limit)

    items.map do |item|
      item_words = (item.glosses || []).map { |g| g["word"] }
      known_count = item_words.count { |w| known_keys.include?(w) }
      comprehension = item_words.any? ? (known_count.to_f / item_words.size * 100).round : 0

      { item: item, estimated_comprehension: comprehension }
    end
  end

  private

  def highest_completed_level(learner, language)
    # Single query: join through the hierarchy to count completed lessons per level
    levels = CurriculumLevel.where(language: language)
      .joins(curriculum_units: :lessons)
      .left_joins(curriculum_units: { lessons: :learner_progresses })
      .where(learner_progresses: { learner_id: [learner.id, nil] })
      .group("curriculum_levels.id", "curriculum_levels.position")
      .select(
        "curriculum_levels.position",
        "COUNT(DISTINCT lessons.id) AS total_lessons",
        "COUNT(DISTINCT CASE WHEN learner_progresses.status = 'completed' THEN learner_progresses.lesson_id END) AS completed_lessons"
      )
      .order(:position)

    completed_position = 0
    levels.each do |level|
      break unless level.total_lessons > 0 && level.completed_lessons == level.total_lessons

      completed_position = level.position
    end

    # Default to 1 (beginner) if no levels completed, not an arbitrary mid-level
    [completed_position, 1].max
  end
end
