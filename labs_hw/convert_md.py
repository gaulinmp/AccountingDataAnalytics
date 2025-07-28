import re
import base64
from pathlib import Path
import mimetypes
import markdown
from markdown import Extension
from markdown.postprocessors import Postprocessor


class ExternalLinksPostprocessor(Postprocessor):
    def run(self, text):
        return re.sub(r'href="(http[^"]*)"', r'href="\1" target="_blank"', text)

class ExternalLinksExtension(Extension):
    def extendMarkdown(self, md):
        md.postprocessors.register(
            ExternalLinksPostprocessor(md), 'external_links', 15
        )

def md_to_html_with_inline_images(md_file):
    md_path = Path(md_file)
    md_root = md_path.parent
    content = md_path.read_text(encoding='utf-8')

    def replace_image(match):
        alt_text = match.group(1)
        img_path = md_root / match.group(2)

        if not img_path.exists():
            raise FileNotFoundError(f"Image file {img_path} not found.")

        mime_type = mimetypes.guess_type(img_path)[0] or 'application/octet-stream'
        img_data = base64.b64encode(img_path.read_bytes()).decode()
        data_uri = f"data:{mime_type};base64,{img_data}"

        return (f"<details> <summary>Screenshot</summary>"
                f'<p><img src="{data_uri}" alt="{alt_text}"'
                f' style="border:black solid 1pt;max-height:500px;max-width:1000px;" /></p>'
                f"</details>")

    content = re.sub(r'!\[([^\]]+)\]\(([^)]+)\)', replace_image, content)

    md = markdown.Markdown(extensions=['toc', ExternalLinksExtension()])
    html = md.convert(content)
    output_path = md_path.with_suffix('.html')
    output_path.write_text(html, encoding='utf-8')

    return output_path

if __name__ == "__main__":
    print(f"Starting at: {Path('.').absolute()}")
    # Convert the Markdown file to HTML with inline images
    for md_file in Path('.').rglob('*.md'):
        print(f"Converting {md_file} to HTML with inline images.")
        md_to_html_with_inline_images(md_file)
