import re
from pathlib import Path
from PyPDF2 import PdfWriter, PdfReader

rootdir = Path(__file__).parent
print(rootdir)

TEST = False

for subfolder in rootdir.iterdir():
    if not subfolder.is_dir():
        continue
    if not re.search(r'\d+-', subfolder.name):
        continue

    # Get all PDF files in the subfolder that correspond to PPTX files
    pdf_files = [_pdf for _p in subfolder.glob("*.pptx") if (_pdf := _p.with_suffix('.pdf')).exists() and re.match(r'\d+\.\d+-', _p.name)]
    if not pdf_files:
        print(f"No PDF files found for {subfolder.name}, rerun pptx.ps1")
        continue

    if TEST:
        print(pdf_files)
        continue

    writer = PdfWriter()

    for pdf_file in pdf_files:
        reader = PdfReader(pdf_file)
        page_count = len(reader.pages)

        # Add all pages except the last one
        for page_num in range(page_count - 1):
            writer.add_page(reader.pages[page_num])

    if writer.pages:
        output_path = rootdir / "PDFs" / f"{subfolder.name}.pdf"

        with open(output_path, "wb") as output_file:
            writer.write(output_file)

        print(f"Created: {output_path} with {len(writer.pages)} pages")

    # Clean up the PDF files
    for pdf_file in pdf_files:
        pdf_file.unlink()
        print(f"Deleted: {pdf_file}")
