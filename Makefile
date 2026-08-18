.PHONY: all install shell shell_win code generate-labs gate screenshot site-help clean

all: install

install:
	uv sync

shell:
	uv run zsh

shell_win:
	uv run powershell

code:
	uv run code .

claude:
	npx @anthropic-ai/claude-code

gemini:
	npx @google/gemini-cli@latest

generate-labs:
	uv run code/utils/convert_md.py

# The course site (Astro app in site/). Full target list: `make site-help`.
gate:
	$(MAKE) -C site gate

# make screenshot PAGES="/ /week-04/" PREVIEW=2026-09-08
screenshot:
	$(MAKE) -C site screenshot PAGES="$(PAGES)" PREVIEW="$(PREVIEW)" FULL="$(FULL)"

site-help:
	$(MAKE) -C site help

clean:
	uv cache clean
	Get-ChildItem -Recurse -Filter "__pycache__" | Remove-Item -Recurse -Force
