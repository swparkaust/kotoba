class JlptMapper
  LEVEL_JLPT_MAP = {
    1 => { label: "Pre-N5", percentage: 0 },
    2 => { label: "N5", percentage: 15 },
    3 => { label: "N5–N4", percentage: 25 },
    4 => { label: "N4", percentage: 35 },
    5 => { label: "N4–N3", percentage: 45 },
    6 => { label: "N3", percentage: 55 },
    7 => { label: "N3–N2", percentage: 63 },
    8 => { label: "N2", percentage: 72 },
    9 => { label: "N2", percentage: 80 },
    10 => { label: "N2–N1", percentage: 87 },
    11 => { label: "N1", percentage: 94 },
    12 => { label: "N1+", percentage: 100 }
  }.freeze

  def current_jlpt(learner:, language:)
    levels = CurriculumLevel.where(language: language).order(:position)
    completed_levels = levels.select do |level|
      lessons = Lesson.joins(curriculum_unit: :curriculum_level)
                      .where(curriculum_levels: { id: level.id })
      progress = LearnerProgress.where(learner: learner, lesson: lessons, status: "completed")
      lessons.count > 0 && progress.count == lessons.count
    end

    highest = completed_levels.last&.position || 0
    current_level_data = LEVEL_JLPT_MAP[highest] || LEVEL_JLPT_MAP[1]

    {
      jlpt_label: current_level_data[:label],
      percentage: current_level_data[:percentage],
      completed_levels: highest,
      total_levels: 12
    }
  end
end
