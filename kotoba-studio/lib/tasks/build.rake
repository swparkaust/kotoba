namespace :content do
  desc "Enqueue ContentBuildJob for all lessons with content_status 'pending'"
  task build: :environment do
    language_code = ENV.fetch("LANGUAGE", "ja")
    pending = Lesson.joins(curriculum_unit: { curriculum_level: :language })
                    .where(languages: { code: language_code }, content_status: "pending")
    puts "Enqueuing #{pending.count} pending #{language_code} lessons for content generation..."
    pending.find_each do |lesson|
      ContentBuildJob.perform_async(lesson.id, language_code)
    end
    puts "Done. Sidekiq will process jobs and run QA verification."
  end

  desc "Show content build status"
  task status: :environment do
    counts = Lesson.group(:content_status).count
    total = counts.values.sum
    puts "Content build status:"
    counts.each { |status, count| puts "  #{status}: #{count} (#{(count * 100.0 / total).round(1)}%)" }
    puts "  total: #{total}"
  end
end
