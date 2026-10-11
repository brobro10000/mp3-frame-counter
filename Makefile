# Portable local entry points. Startup needs Docker Compose and curl; development checks need pinned Node/npm.
# up/build affect only this Compose project; down removes only its containers/network, never global Docker data.
.PHONY: help check build up health local-startup-check down logs logs-backend ps e2e e2e-check smoke validate-sample prepare-release

FRONTEND_PORT ?= 8080
export FRONTEND_PORT

help:
	@echo "Startup: make up | health | ps | logs | logs-backend | down (Docker Compose and curl)."
	@echo "Development: make check | build | e2e | e2e-check (pinned Node/npm for checks)."
	@echo "FRONTEND_PORT=8081 make up changes the published port (default: 8080)."
	@echo "make smoke FILE=path EXPECTED=count [BASE_URL=http://127.0.0.1:8080]"
	@echo "make validate-sample [BASE_URL=http://127.0.0.1:8080]"
	@echo "make prepare-release (archive the tested local images; no deployment or publication)"

check:
	npm ci
	npm run validate
	node scripts/run-ci-phase.mjs

build:
	docker compose build --pull

up: local-startup-check
	docker compose up --build --detach --wait --wait-timeout 90
	@$(MAKE) --no-print-directory health

# Fail before the source build if curl is unavailable or the published port is invalid.
local-startup-check:
	@command -v curl >/dev/null 2>&1 || { printf '%s\n' 'Startup requires curl on PATH.' >&2; exit 1; }
	@port=$${FRONTEND_PORT:-8080}; \
	case "$$port" in *[!0-9]*|'') printf '%s\n' 'FRONTEND_PORT must be an integer from 1 to 65535.' >&2; exit 1 ;; esac; \
	if ! [ "$$port" -ge 1 ] 2>/dev/null || ! [ "$$port" -le 65535 ] 2>/dev/null; then \
		printf '%s\n' 'FRONTEND_PORT must be an integer from 1 to 65535.' >&2; exit 1; \
	fi

# Inspect both services before a bounded HTTP 200 ping; failures leave containers available for diagnosis.
health: local-startup-check
	@set -e; \
	for service in api frontend; do \
		ids=$$(docker compose ps --all --quiet "$$service"); \
		if [ -z "$$ids" ]; then printf '%s\n' "$$service has no container; run make up." >&2; exit 1; fi; \
		for id in $$ids; do \
			state=$$(docker inspect --format '{{.State.Running}} {{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}' "$$id"); \
			if [ "$$state" != 'true healthy' ]; then \
				printf '%s\n' "$$service is not running and healthy (state: $$state)." >&2; exit 1; \
			fi; \
		done; \
		printf '%s\n' "$$service is running and healthy."; \
	done; \
	url="http://127.0.0.1:$${FRONTEND_PORT:-8080}"; \
	status=$$(curl --disable --fail --silent --show-error --noproxy 127.0.0.1 --connect-timeout 2 --max-time 5 \
		--output /dev/null --write-out '%{http_code}' "$$url/healthz"); \
	if [ "$$status" != 200 ]; then printf '%s\n' "HTTP health ping returned $$status; expected 200." >&2; exit 1; fi; \
	printf 'HTTP health ping succeeded.\nApplication: %s/\nAPI docs: %s/docs/\n' "$$url" "$$url"; \
	printf '%s\n' 'Follow backend logs: make logs-backend (Ctrl-C stops following).'

down:
	docker compose down --timeout 7 --remove-orphans

logs:
	docker compose logs --tail 100

# Follow only the API's recent logs; Ctrl-C ends the stream without stopping either service.
logs-backend:
	docker compose logs --follow --tail 100 api

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

# Requires a clean checkout, full Git history and the passed report's exact local images; writes ignored archives.
prepare-release:
	node scripts/prepare-release.mjs
