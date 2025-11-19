.PHONY: all install shell shell_win code generate-labs clean

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

clean:
	uv cache clean
	Get-ChildItem -Recurse -Filter "__pycache__" | Remove-Item -Recurse -Force
