# Portable local entry points. Requires the pinned Node/npm and Docker with Compose; errors stop their target.
# up/build affect only this Compose project; down removes only its containers/network, never global Docker data.
.PHONY: help check build up down logs ps e2e e2e-check smoke validate-sample

help:
	@echo "Use pinned Node/npm and Docker Compose. All runtime commands below are local."
	@echo "make check | build | up | down | logs | ps | e2e | e2e-check"
	@echo "make smoke FILE=path EXPECTED=count [BASE_URL=http://127.0.0.1:8080]"
	@echo "make validate-sample [BASE_URL=http://127.0.0.1:8080]"

check:
	npm ci
	npm run validate
	node scripts/run-ci-phase.mjs

build:
	docker compose build --pull

up:
	docker compose up --build --detach --wait --wait-timeout 90

down:
	docker compose down --timeout 7 --remove-orphans

logs:
	docker compose logs --tail 100

ps:
	docker compose ps

# The phase controller extracts the independent baseline and runs the full lifecycle without selectors.
e2e:
	node scripts/run-ci-phase.mjs

# Harness discovery/negative controls are explicitly separate from real application acceptance.
e2e-check:
	npm --prefix tests/acceptance ci
	npm --prefix tests/acceptance run check

# Make exports command-line variables without embedding untrusted paths into shell command text.
export FILE EXPECTED BASE_URL
smoke:
	node scripts/smoke-local.mjs

validate-sample:
	SAMPLE_BASELINE=1 node scripts/smoke-local.mjs
