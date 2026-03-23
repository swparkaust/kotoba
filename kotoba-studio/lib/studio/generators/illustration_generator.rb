class IllustrationGenerator
  IMAGE_PROVIDER = ENV.fetch("IMAGE_PROVIDER", "dalle")

  Illustration = Struct.new(:asset_type, :prompt, :url, :local_path,
                            :width, :height, :metadata, keyword_init: true)

  def initialize(router:, language_config:)
    @router = router
    @lang = language_config
  end

  def generate(lesson:, exercises:)
    image_cues = exercises.select { |ex| ex.image_cue }.map.with_index do |ex, idx|
      { exercise: ex, index: idx }
    end

    image_cues.map do |item|
      ex = item[:exercise]
      prompt = build_image_prompt(ex.image_cue, lesson)
      dims = dimensions_for(ex.exercise_type)

      url = case IMAGE_PROVIDER
            when "dalle"
              generate_dalle(prompt, dims)
            when "stable_diffusion"
              generate_stable_diffusion(prompt, dims)
            else
              generate_dalle(prompt, dims)
            end

      Illustration.new(
        asset_type: "illustration_png",
        prompt: prompt,
        url: url,
        local_path: nil,
        width: dims[:width],
        height: dims[:height],
        metadata: { exercise_index: item[:index], image_cue: ex.image_cue }
      )
    end
  end

  private

  def build_image_prompt(image_cue, lesson)
    art = @lang.art_direction
    style = art["illustration_style"] || "colorful, child-friendly anime style"
    palette = art["color_palette"] || "bright, warm colors"

    "#{image_cue}. Style: #{style}. Color palette: #{palette}. " \
      "Educational illustration for language learning app. No text in image."
  end

  def generate_dalle(prompt, dims)
    require "openai"
    client = OpenAI::Client.new(access_token: ENV.fetch("OPENAI_API_KEY"))
    size = "#{dims[:width]}x#{dims[:height]}"

    response = client.images.generate(
      parameters: {
        model: "dall-e-3",
        prompt: prompt,
        size: size,
        quality: "standard",
        n: 1
      }
    )

    response.dig("data", 0, "url")
  rescue StandardError => e
    Rails.logger.error("DALL-E generation failed: #{e.message}") if defined?(Rails)
    nil
  end

  def generate_stable_diffusion(prompt, dims)
    uri = URI("#{ENV.fetch("SD_HOST", "http://localhost:7860")}/sdapi/v1/txt2img")

    body = {
      prompt: prompt,
      negative_prompt: "text, words, letters, watermark, blurry",
      width: dims[:width],
      height: dims[:height],
      steps: 20,
      cfg_scale: 7
    }

    response = Net::HTTP.post(uri, body.to_json, "Content-Type" => "application/json")
    data = JSON.parse(response.body)

    image_b64 = data.dig("images", 0)
    return nil unless image_b64

    filename = "sd_#{SecureRandom.hex(8)}.png"
    path = File.join("tmp", "illustrations", filename)
    FileUtils.mkdir_p(File.dirname(path))
    File.binwrite(path, Base64.decode64(image_b64))
    path
  rescue StandardError => e
    nil
  end

  def post_process(url_or_path)
    url_or_path
  end

  def dimensions_for(exercise_type)
    case exercise_type
    when "picture_match"
      { width: 512, height: 512 }
    when "trace"
      { width: 256, height: 256 }
    else
      { width: 768, height: 512 }
    end
  end
end
