# ACCTG 5150 course platform — task runner.
# The Astro app lives in site/; these targets wrap its npm scripts so you can
# drive everything from the repo root. Run `make` (or `make help`) for the list.

SITE := .

.DEFAULT_GOAL := help
.PHONY: help install serve dev build preview check test test-e2e test-all clean

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

test-all: check test test-e2e ## Run type-check + unit + e2e (the CI gate)

clean: ## Remove build output (site/dist, .astro)
	rm -rf $(SITE)/dist $(SITE)/.astro
