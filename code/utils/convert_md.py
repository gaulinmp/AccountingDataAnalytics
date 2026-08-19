# stdlib imports
import re
import sys
from datetime import datetime as dt
import time
import base64
from pathlib import Path

# third-party imports
import click
import mimetypes
import markdown
from markdown import Extension
from markdown.postprocessors import Postprocessor
from markdown.treeprocessors import Treeprocessor
import xml.etree.ElementTree as etree

# project imports
_code_dir = Path(__file__).parent # Assumes this is in code/utils/
sys.path.append(str(_code_dir.parent))
from src import LAB_DIR

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Instructions</title>
    {css}
</head>
<body>
    {content}
</body>
</html>
"""

def load_css(file_name="default", wrap_in_style_tag=False):
    css_file = _code_dir / "themes" / f"{file_name}.css"
    if not css_file.exists():
        raise FileNotFoundError(f"CSS file {css_file} not found.")
    if wrap_in_style_tag:
        return f"<style>\n{css_file.read_text(encoding='utf-8')}\n</style>"
    return css_file.read_text(encoding="utf-8")


# Add a custom class to each heading
class HeadingClassProcessor(Treeprocessor):
    def run(self, root):
        for elem in root.iter():
            if elem.tag in ("h1", "h2", "h3", "h4", "h5", "h6"):
                elem.set("class", f"{self.class_text}-{elem.tag}")


class HeadingClassExtension(Extension):
    def __init__(self, class_text="heading", **kwargs):
        self.class_text = class_text
        super().__init__(**kwargs)

    def extendMarkdown(self, md):
        processor = HeadingClassProcessor(md)
        processor.class_text = self.class_text
        md.treeprocessors.register(processor, "heading_class", 15)


# Add target="_blank" to external links
class ExternalLinksPostprocessor(Postprocessor):
    def run(self, text):
        return re.sub(r'href="(http[^"]*)"', r'href="\1" target="_blank"', text)


class ExternalLinksExtension(Extension):
    def extendMarkdown(self, md):
        md.postprocessors.register(ExternalLinksPostprocessor(md), "external_links", 15)


# Wrap images in details tag
class ImageWrapperProcessor(Treeprocessor):
    def run(self, root):
        for parent in root.iter():
            for i, elem in enumerate(list(parent)):
                if elem.tag == "img":
                    src = elem.get("src", "")
                    alt = elem.get("alt", "")
                    title = elem.get("title") or "Screenshot"

                    img_path = self.md_root / src

                    if not img_path.exists():
                        if 'http' in src:
                            # Skip external images
                            continue
                        raise FileNotFoundError(f"Image file {img_path.absolute()} not found.")

                    mime_type = mimetypes.guess_type(img_path)[0] or "application/octet-stream"
                    img_data = base64.b64encode(img_path.read_bytes()).decode()
                    data_uri = f"data:{mime_type};base64,{img_data}"

                    html = (
                        f'<details class="inline-image"> <summary>{title}</summary>'
                        f'<p><img alt="{alt}" class="detail-image" src="{data_uri}" /></p>'
                        f"</details>"
                    )

                    placeholder = self.md.htmlStash.store(html)

                    raw_elem = etree.Element("p")
                    raw_elem.text = placeholder

                    parent.remove(elem)
                    parent.insert(i, raw_elem)


class ImageWrapperExtension(Extension):
    def __init__(self, md_root="heading", **kwargs):
        self.md_root = md_root
        super().__init__(**kwargs)

    def extendMarkdown(self, md):
        processor = ImageWrapperProcessor(md)
        processor.md_root = self.md_root
        md.treeprocessors.register(processor, "image_wrapper", 15)


# Add custom CSS class to inline code blocks
class InlineCodeClassProcessor(Treeprocessor):
    def run(self, root):
        # Build a parent map since etree doesn't have getparent()
        parent_map = {c: p for p in root.iter() for c in p}

        for elem in root.iter():
            if elem.tag == "code":
                # Check if this is inline code (not part of a pre block)
                parent = parent_map.get(elem)
                if parent is not None and parent.tag != "pre":
                    elem.set("class", self.code_class)


class InlineCodeClassExtension(Extension):
    def __init__(self, code_class="inline-code", **kwargs):
        self.code_class = code_class
        super().__init__(**kwargs)

    def extendMarkdown(self, md):
        processor = InlineCodeClassProcessor(md)
        processor.code_class = self.code_class
        md.treeprocessors.register(processor, "inline_code_class", 15)


# Add CSS class attributes using {: .classname} syntax
class AttributeClassProcessor(Treeprocessor):
    def run(self, root):
        pattern = re.compile(r"\{\:\s+\.([^}]+)\}")
        # Build a parent map since etree doesn't have getparent()
        parent_map = {c: p for p in root.iter() for c in p}

        for elem in root.iter():
            # Check text content
            if elem.text:
                match = pattern.search(elem.text)
                if match:
                    class_name = match.group(1)
                    elem.text = pattern.sub("", elem.text).strip()
                    existing_class = elem.get("class", "")
                    elem.set("class", f"{existing_class} {class_name}".strip())

            # Check tail content (text after a child element)
            if elem.tail:
                match = pattern.search(elem.tail)
                if match:
                    class_name = match.group(1)
                    elem.tail = pattern.sub("", elem.tail).strip()
                    parent = parent_map.get(elem)
                    if parent is not None:
                        existing_class = parent.get("class", "")
                        parent.set("class", f"{existing_class} {class_name}".strip())


class AttributeClassExtension(Extension):
    def extendMarkdown(self, md):
        processor = AttributeClassProcessor(md)
        md.treeprocessors.register(processor, "attribute_class", 5)


def md_to_html_with_inline_images(md_file):
    md_path = Path(md_file)
    md_root = md_path.parent
    output_path = md_path.with_suffix(".html")
    css = load_css("default", wrap_in_style_tag=True)
    css += load_css("code", wrap_in_style_tag=True)

    md = markdown.Markdown(
        extensions=[
            "toc",
            "tables",
            "codehilite",
            "sane_lists",
            "pymdownx.details",
            "pymdownx.superfences",
            ExternalLinksExtension(),
            HeadingClassExtension(class_text="ada"),
            ImageWrapperExtension(md_root=md_root),
            InlineCodeClassExtension(code_class="fixed-width"),
            AttributeClassExtension(),
        ]
    )
    html = HTML_TEMPLATE.format(content=md.convert(md_path.read_text(encoding="utf-8")), css=css)

    output_path.write_text(html, encoding="utf-8")

    return output_path


def convert_md(md_file, update_if_html_older=True, debug=False, raise_on_error=False):
    """
    Convert a single markdown file to HTML if needed.

    Returns the written .html path, or None if the file was skipped as
    up-to-date (or failed while `raise_on_error` is False — the watcher must
    survive a bad file rather than die on it).
    """
    md_file = Path(md_file)
    html_file = md_file.with_suffix(".html")

    if not update_if_html_older:
        # Force update
        pass
    elif html_file.exists() and html_file.stat().st_mtime > md_file.stat().st_mtime:
        # HTML is newer, skip
        return None

    print(f"{dt.now():%H:%M:%S} - Converting {md_file}")
    try:
        output_path = md_to_html_with_inline_images(md_file)
    except Exception as e:
        if raise_on_error:
            raise
        print(f"Error processing {md_file}: {e}")
        return None

    if debug:
        print(f"  -> {output_path}")
    return output_path


def convert_all_md_in_dir(root_dir, update_if_html_older=True, debug=False):
    """
    Scan directory and convert all markdown files. Returns the paths written.
    """
    written = []
    for md_file in sorted(Path(root_dir).rglob("*.md")):
        out = convert_md(md_file, update_if_html_older=update_if_html_older, debug=debug)
        if out is not None:
            written.append(out)
    return written


def watch(root_dir, debug=False, interval=5):
    """Convert on change, forever, until interrupted."""
    print(f"Watching {Path(root_dir).absolute()} (Ctrl-C to stop)")
    try:
        while True:
            convert_all_md_in_dir(root_dir, update_if_html_older=True, debug=debug)
            time.sleep(interval)
    except KeyboardInterrupt:
        print("\nStopping file watcher...")


@click.command(context_settings={"help_option_names": ["-h", "--help"]})
@click.argument(
    "target",
    required=False,
    type=click.Path(exists=True, path_type=Path),
)
@click.option("--watch/--once", "watch_mode", default=None,
              help="Watch for changes, or make a single pass. Default: watch when "
                   "TARGET is omitted or a directory, once when TARGET is a file.")
@click.option("--force", is_flag=True, default=False,
              help="Rebuild even when the .html is newer than its .md.")
@click.option("--debug", is_flag=True, default=False, help="Print each file written.")
def main(target, watch_mode, force, debug):
    """Convert lab/homework Markdown to standalone HTML with inlined images.

    \b
    TARGET is a .md file    -> convert just that file, once
    TARGET is a directory   -> convert every .md under it
    TARGET omitted          -> watch labs_hw/ and convert on change

    \b
    Examples:
      convert_md.py                                   # watch labs_hw/
      convert_md.py labs_hw/week1_opening-data/Lab-1_Instructions.md
      convert_md.py labs_hw/week3_visualization --once
    """
    # A named .md file is an explicit instruction: convert it, once, regardless
    # of mtimes. Anything else defaults to watching, which is the old behavior.
    single_file = target is not None and target.is_file()
    if watch_mode is None:
        watch_mode = not single_file
    if single_file and watch_mode:
        raise click.UsageError("--watch needs a directory, not a single file.")

    if single_file:
        if target.suffix.lower() != ".md":
            raise click.UsageError(f"{target} is not a .md file.")
        try:
            out = convert_md(target, update_if_html_older=False, debug=debug,
                             raise_on_error=True)
        except Exception as e:
            raise click.ClickException(f"{target}: {e}") from e
        print(f"Wrote {out}")
        return

    root_dir = target if target is not None else Path(LAB_DIR)
    if watch_mode:
        watch(root_dir, debug=debug)
    else:
        written = convert_all_md_in_dir(root_dir, update_if_html_older=not force, debug=debug)
        print(f"Wrote {len(written)} file(s).")


if __name__ == "__main__":
    main()
