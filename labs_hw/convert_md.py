import re
import time
import base64
from pathlib import Path
import mimetypes
import markdown
from markdown import Extension
from markdown.postprocessors import Postprocessor
from markdown.treeprocessors import Treeprocessor
import xml.etree.ElementTree as etree

CSS = """
<style>
details {
   color: #BE0000;
}
details[open] {
    font-weight: bold;
}
details[open] > p {
    border-left: 5px solid #BE0000;
    margin-left: 1em;
    padding-left: 1em;
}
.detail-image {
    max-height: 500px;
    max-width: 1000px;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin: 10px 0;
}
code {
  font-family: monospace;
  background-color: #f1f1f1;
}
</style>
"""


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
                        raise FileNotFoundError(f"Image file {img_path.absolute()} not found.")

                    mime_type = mimetypes.guess_type(img_path)[0] or "application/octet-stream"
                    img_data = base64.b64encode(img_path.read_bytes()).decode()
                    data_uri = f"data:{mime_type};base64,{img_data}"

                    html = (
                        f"<details> <summary>{title}</summary>"
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


def md_to_html_with_inline_images(md_file):
    md_path = Path(md_file)
    md_root = md_path.parent
    output_path = md_path.with_suffix(".html")

    md = markdown.Markdown(
        extensions=[
            "toc",
            "tables",
            "sane_lists",
            'pymdownx.superfences',
            ExternalLinksExtension(),
            HeadingClassExtension(class_text="ada"),
            ImageWrapperExtension(md_root=md_root),
        ]
    )
    html = md.convert(md_path.read_text(encoding="utf-8")) + "\n" + CSS

    output_path.write_text(html, encoding="utf-8")

    return output_path


if __name__ == "__main__":
    print(f"Starting at: {Path('.').absolute()}")
    first = True

    # Convert the Markdown file to HTML with inline images
    while True:
        for md_file in Path(".").rglob("*.md"):
            html_file = md_file.with_suffix(".html")
            if first or not html_file.exists() or html_file.stat().st_mtime <= md_file.stat().st_mtime:
                print(f"Detected change in {md_file}. Converting to HTML with inline images.")
                md_to_html_with_inline_images(md_file)
        first = False
        try:
            time.sleep(5)
        except KeyboardInterrupt:
            print("\nStopping file watcher...")
            break
