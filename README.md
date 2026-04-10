# Kotoba (ことば)

A free, ad-free Japanese language learning PWA that teaches adults Japanese the way native-speaking children learn in official state public schools. The curriculum mirrors the MEXT Kokugo syllabus from first grade through high school.

## Quick Start

```bash
# Prerequisites: Docker, Node.js 18+, Ruby 3.3+
make setup
make start
# App runs at http://localhost:8080
```

## Architecture

| Layer | Technology |
|-------|-----------|
| Backend API | Ruby on Rails 7.2 (API mode), PostgreSQL, Sidekiq, Redis |
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| AI Engine | Anthropic Claude, OpenAI GPT (cloud) or Ollama (local) |
| Content Studio | Standalone Ruby project for offline content generation |

The app consists of three projects:

- **`backend/`** — Rails API serving learner data, progress, SRS, and AI-powered evaluation (writing, speaking, placement)
- **`frontend/`** — Next.js PWA with 33 components, 14 hooks, and 13 pages
- **`kotoba-studio/`** — Offline content generation pipeline that produces exercises, illustrations, and audio

## Curriculum

12 levels covering elementary through high school, mapped to JLPT N5 through N1+:

| Level | MEXT Grade | JLPT | Content |
|-------|-----------|------|---------|
| 1 | Grade 1 (first half) | Pre-N5 | 46 hiragana, greetings, numbers |
| 2 | Grade 1 (second half) | N5 | 46 katakana, 80 Grade-1 kanji |
| 3 | Grade 2 (first half) | N5-N4 | Dakuten, verb basics, adjectives |
| 4 | Grade 2 (second half) | N4 | Te-form, daily conversation |
| 5 | Grade 3 | N4-N3 | Potential/conditional, reading |
| 6 | Grade 4 | N3 | Passive/causative, keigo basics |
| 7 | Grade 5-6 | N3-N2 | Full keigo, formal writing |
| 8 | Junior High 1 | N2 | Essays, news, kanbun intro |
| 9 | Junior High 2-3 | N2 | Literary analysis, kobun intro |
| 10 | High School 1 | N2-N1 | Business, technical writing |
| 11 | High School 2 | N1 | Classical Japanese, academic writing |
| 12 | High School 3+ | N1+ | Native-level fluency, dialects |

Kanji data: 1,026 Kyouiku Kanji verified against the 2020 MEXT revision.

## Content Generation

Content is pre-generated, never created at request time:

```bash
make build-content    # Build 142 seed lessons
make fill-content     # Generate to 1,400 target lessons
make import-content   # Import into the app
```

The pipeline: `ContentBuildJob` generates exercises and assets, `QualityReviewJob` verifies each one, content transitions to `ready` only after passing QA.

## AI Provider

Switch between cloud and local AI with one environment variable:

```bash
AI_PROVIDER=anthropic  # Claude Opus/Sonnet (cloud)
AI_PROVIDER=openai     # GPT-4o/o3 (cloud)
AI_PROVIDER=ollama     # Qwen/DeepSeek/Llama (local, free)
```

For local development on a Mac with 36GB+ RAM:

```bash
brew install ollama
ollama serve &
ollama pull qwen3:32b
ollama pull qwen3:8b
```

## Testing

```bash
make test             # RSpec + Jest
make test-e2e         # Playwright against live services
make test-manual      # Integration test + browser verification
make test-all         # Everything
```

## Key Design Principles

- **No English in lessons.** Meaning conveyed through images, audio, and graded Japanese.
- **No guilt.** No streaks, no penalties for absence, no "you're falling behind."
- **Placement test anytime.** Server-generated questions, server-side grading.
- **SRS without pressure.** Reviews recommended, never required. Burn threshold at 10 correct.
- **Progressive disclosure.** Beginners see only the current lesson. Features surface as relevant.
- **Language-agnostic data model.** Add a new language by creating `curricula/<code>/curriculum.yml`.

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE).
