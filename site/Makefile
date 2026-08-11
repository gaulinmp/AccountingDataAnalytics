# ACCTG 5150 course platform — task runner for the Astro app.
# Run from site/ (`make gate`), or from the repo root via the passthrough
# targets in ../Makefile. Run `make` (or `make help`) for the list.

SITE := .

# Pages for `make screenshot`, space-separated; PREVIEW simulates a date.
PAGES ?= /
PREVIEW ?=

.DEFAULT_GOAL := help
.PHONY: help install serve dev build preview check test test-e2e gate test-all screenshot clean

help: ## Show this help
	@echo "ACCTG 5150 — make targets:"
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

# Auto-install deps the first time (and whenever package.json changes).
$(SITE)/node_modules: $(SITE)/package.json
	cd $(SITE) && npm install
	@touch $(SITE)/node_modules

install: $(SITE)/node_modules ## Install site dependencies

serve: $(SITE)/node_modules ## Serve locally with the dev server (http://localhost:4321)
	cd $(SITE) && npm run dev

dev: serve ## Alias for `serve`

build: $(SITE)/node_modules ## Build the static site to site/dist
	cd $(SITE) && npm run build

preview: build ## Build, then serve the production output locally
	cd $(SITE) && npm run preview

check: $(SITE)/node_modules ## Type-check the project (astro check)
	cd $(SITE) && npm run check

test: $(SITE)/node_modules ## Run unit tests (vitest)
	cd $(SITE) && npm test

test-e2e: $(SITE)/node_modules ## Run end-to-end tests (playwright)
	cd $(SITE) && npm run test:e2e

gate: $(SITE)/node_modules ## Check + build + unit + e2e; quiet unless something fails
	cd $(SITE) && npm run --silent gate

test-all: gate ## Alias for `gate` (the CI gate)

screenshot: $(SITE)/node_modules ## Screenshot pages: make screenshot PAGES="/ /week-04/" PREVIEW=2026-09-08
	cd $(SITE) && npm run --silent screenshot -- $(PAGES) $(if $(PREVIEW),--preview=$(PREVIEW),) $(if $(FULL),--full,)

clean: ## Remove build output (site/dist, .astro, .screenshots)
	rm -rf $(SITE)/dist $(SITE)/.astro $(SITE)/.screenshots
