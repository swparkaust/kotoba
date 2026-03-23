class AudioGenerator
  AudioClip = Struct.new(:asset_type, :text, :voice_id, :language_code,
                         :url, :local_path, :duration_ms, :metadata, keyword_init: true)

  def initialize(language_config:)
    @lang = language_config
    @profiles = symbolize_profiles(language_config.voice_profiles)
  end

  def generate(lesson:, exercises:)
    level = lesson.curriculum_unit&.curriculum_level&.position || 1
    voices = voices_for_level(level)

    exercises.flat_map do |ex|
      clips = []

      if ex.audio_cue
        clips << synthesize(text: ex.audio_cue, voice: voices[:primary], exercise: ex)
      end

      if ex.target_text && ex.exercise_type == "listening"
        clips << synthesize(text: ex.target_text, voice: voices[:secondary] || voices[:primary], exercise: ex)
      end

      clips.compact
    end
  end

  private

  def symbolize_profiles(profiles)
    return {} unless profiles.is_a?(Hash)
    profiles.transform_values do |v|
      v.is_a?(Hash) ? v.transform_keys(&:to_sym) : v
    end
  end

  def synthesize(text:, voice:, exercise:)
    provider = ENV.fetch("TTS_PROVIDER", "piper")

    result = case provider
             when "elevenlabs"
               synthesize_elevenlabs(text, voice)
             when "piper"
               synthesize_piper(text, voice)
             else
               synthesize_piper(text, voice)
             end

    return nil unless result

    AudioClip.new(
      asset_type: "audio",
      text: text,
      voice_id: voice[:id] || voice["id"],
      language_code: @lang.code,
      url: result[:url],
      local_path: result[:local_path],
      duration_ms: result[:duration_ms],
      metadata: { exercise_type: exercise.exercise_type, skill_type: exercise.skill_type }
    )
  end

  def synthesize_elevenlabs(text, voice)
    voice_id = voice[:elevenlabs_id] || voice["elevenlabs_id"]
    return nil unless voice_id

    uri = URI("https://api.elevenlabs.io/v1/text-to-speech/#{voice_id}")
    headers = {
      "Content-Type" => "application/json",
      "xi-api-key" => ENV.fetch("ELEVENLABS_API_KEY")
    }
    body = {
      text: text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.75, similarity_boost: 0.75 }
    }

    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    request = Net::HTTP::Post.new(uri.path, headers)
    request.body = body.to_json
    response = http.request(request)

    return nil unless response.is_a?(Net::HTTPSuccess)

    filename = "el_#{SecureRandom.hex(8)}.mp3"
    path = File.join("tmp", "audio", filename)
    FileUtils.mkdir_p(File.dirname(path))
    File.binwrite(path, response.body)

    { url: nil, local_path: path, duration_ms: nil }
  rescue StandardError
    nil
  end

  def synthesize_piper(text, voice)
    piper_voice = voice[:piper_model] || voice["piper_model"] || "#{@lang.code}_medium"
    piper_host = ENV.fetch("PIPER_HOST", "http://localhost:5000")

    uri = URI("#{piper_host}/synthesize")
    body = { text: text, voice: piper_voice }

    response = Net::HTTP.post(uri, body.to_json, "Content-Type" => "application/json")
    return nil unless response.is_a?(Net::HTTPSuccess)

    filename = "piper_#{SecureRandom.hex(8)}.wav"
    path = File.join("tmp", "audio", filename)
    FileUtils.mkdir_p(File.dirname(path))
    File.binwrite(path, response.body)

    { url: nil, local_path: path, duration_ms: nil }
  rescue StandardError
    nil
  end

  def voices_for_level(level)
    bands = @lang.teaching_bands
    band = if bands[:beginner].include?(level)
             :beginner
           elsif bands[:intermediate].include?(level)
             :intermediate
           else
             :advanced
           end

    band_profiles = @profiles[band.to_s] || @profiles.values.first || {}
    primary = band_profiles.is_a?(Array) ? band_profiles.first : band_profiles

    {
      primary: primary || {},
      secondary: band_profiles.is_a?(Array) ? band_profiles[1] : nil
    }
  end
end
