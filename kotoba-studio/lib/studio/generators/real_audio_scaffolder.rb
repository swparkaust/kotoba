class RealAudioScaffolder
  ScaffoldedAudio = Struct.new(:transcript, :annotated_transcript, :vocabulary,
                               :listening_tasks, :cultural_notes, :difficulty_rating,
                               :metadata, keyword_init: true)

  def initialize(router:, language_config:)
    @router = router
    @lang = language_config
  end

  def scaffold(audio_clip:, level:)
    clip = normalize_clip(audio_clip)

    response = @router.call(
      task: :real_audio_scaffolding,
      system: system_prompt(level),
      prompt: build_prompt(clip, level)
    )

    parse_scaffolding(response.text, clip)
  end

  private

  def normalize_clip(clip)
    if clip.is_a?(Hash)
      clip.transform_keys(&:to_s)
    else
      {
        "title" => clip.respond_to?(:title) ? clip.title : "",
        "transcription" => clip.respond_to?(:transcript) ? clip.transcript : (clip.respond_to?(:transcription) ? clip.transcription : ""),
        "url" => clip.respond_to?(:url) ? clip.url : "",
        "metadata" => clip.respond_to?(:metadata) ? clip.metadata : {}
      }
    end
  end

  def system_prompt(level)
    lang = @lang
    <<~PROMPT
      You are a #{lang.name} language educator creating pedagogical scaffolding for authentic audio content.
      Language: #{lang.name} (#{lang.native_name})
      Target level: #{level}

      Create comprehensive listening comprehension scaffolding that makes authentic
      #{lang.name} audio accessible to learners at level #{level}.
      Return valid JSON only.
    PROMPT
  end

  def build_prompt(clip, level)
    title = clip["title"] || ""
    transcription = clip["transcription"] || clip["transcript"] || ""
    metadata = clip["metadata"] || {}

    <<~PROMPT
      Create listening scaffolding for this authentic #{@lang.name} audio clip:

      Title: #{title}
      Transcript: #{transcription}
      Duration: #{metadata["duration_seconds"] || "unknown"}s
      Formality: #{metadata["formality"] || "unknown"}
      Speed: #{metadata["speed"] || "natural"}

      Target level: #{level}

      Return JSON:
      {
        "transcript": "full transcript",
        "annotated_transcript": [
          { "text": "segment", "reading": "reading", "notes": "notes", "timestamp_start": 0, "timestamp_end": 0 }
        ],
        "vocabulary": [
          { "word": "word", "reading": "reading", "meaning": "meaning in simple #{@lang.name}", "context": "usage in clip" }
        ],
        "listening_tasks": [
          { "task_type": "gist|detail|inference", "question": "question in #{@lang.name}", "answer": "answer", "difficulty": 1-5 }
        ],
        "cultural_notes": "cultural context",
        "difficulty_rating": #{level},
        "metadata": { "speech_rate": "slow|natural|fast", "register": "formal|informal|casual" }
      }
    PROMPT
  end

  def parse_scaffolding(text, clip)
    return nil if text.nil? || text.strip.empty?

    json_match = text.match(/\{[\s\S]*\}/)
    return nil unless json_match

    data = JSON.parse(json_match[0])
    ScaffoldedAudio.new(
      transcript: data["transcript"] || clip["transcription"] || clip["transcript"],
      annotated_transcript: data["annotated_transcript"] || [],
      vocabulary: data["vocabulary"] || [],
      listening_tasks: data["listening_tasks"] || [],
      cultural_notes: data["cultural_notes"],
      difficulty_rating: data["difficulty_rating"],
      metadata: data["metadata"] || {}
    )
  rescue JSON::ParserError
    nil
  end
end
