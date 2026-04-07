.PHONY: setup test test-backend test-frontend test-e2e test-manual test-all start start-test lint build-content build-content-all fill-content import-content

setup:
	cd backend && bundle install && bin/rails db:create db:migrate
	cd frontend && npm ci

test: test-backend test-frontend

test-backend:
	cd backend && bundle exec rspec

test-frontend:
	cd frontend && npm test -- --ci

test-e2e:
	@echo "Ensuring Ollama is running with required models..."
	ollama serve &>/dev/null &
	sleep 2
	ollama pull qwen3:32b || true
	ollama pull qwen3:8b || true
	docker compose -f docker-compose.test.yml up -d --build
	sleep 15
	docker compose -f docker-compose.test.yml exec -T backend bin/rails db:seed
	cd frontend && npx playwright test; ret=$$?; \
	docker compose -f docker-compose.test.yml down; exit $$ret

test-manual:
	@echo "Ensuring Ollama is running with required models..."
	ollama serve &>/dev/null &
	sleep 2
	ollama pull qwen3:32b || true
	ollama pull qwen3:8b || true
	docker compose -f docker-compose.test.yml up -d --build
	sleep 15
	docker compose -f docker-compose.test.yml exec -T backend bin/rails db:seed
	bash scripts/manual_test.sh && cd frontend && npx ts-node ../scripts/manual_e2e.ts; ret=$$?; \
	docker compose -f docker-compose.test.yml down; exit $$ret

test-all: test test-e2e test-manual

start:
	docker compose up --build

start-test:
	docker compose -f docker-compose.test.yml up --build

lint:
	cd backend && bundle exec rubocop
	cd frontend && npx eslint . && npx tsc --noEmit

build-content:
	@echo "Building content for Japanese using the Content Studio..."
	cd kotoba-studio && bin/build --language ja
	@echo "Content generation complete. Import with: make import-content"

build-content-all:
	@echo "Regenerating ALL content (this will take a while)..."
	cd kotoba-studio && bin/build --language ja --rebuild
	@echo "Full rebuild complete. Import with: make import-content"

fill-content:
	@echo "Generating lessons to meet density targets (this will take a long time)..."
	cd kotoba-studio && bin/build --language ja --fill
	@echo "Fill complete. Import with: make import-content"

import-content:
	@echo "Importing content pack into the app..."
	docker compose exec -T backend bin/rails "content_pack:import[kotoba-studio/output/ja_v1]"
	@echo "Content imported successfully."
