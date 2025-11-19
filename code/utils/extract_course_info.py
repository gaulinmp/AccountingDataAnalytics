import os
import PyPDF2

def extract_text_from_pdf(pdf_path, max_pages=5):
    text = ""
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            num_pages = len(reader.pages)

            # Extract first few pages for outline
            for i in range(min(num_pages, max_pages)):
                page = reader.pages[i]
                text += page.extract_text() + "\n"

            # Search for "Lab" or "Homework" in the rest
            for i in range(max_pages, num_pages):
                page = reader.pages[i]
                page_text = page.extract_text()
                if "Lab" in page_text or "Homework" in page_text or "Assignment" in page_text:
                    text += f"\n--- Page {i+1} ---\n" + page_text + "\n"

    except Exception as e:
        text += f"Error reading {pdf_path}: {e}\n"
    return text

def main():
    base_dir = os.getcwd()
    slides_dir = os.path.join(base_dir, "slides", "PDFs")
    syllabus_dir = os.path.join(base_dir, "syllabus")
    output_file = "course_content.txt"

    with open(output_file, "w", encoding="utf-8") as f:
        # Process Syllabus
        f.write("=== SYLLABUS ===\n")
        for filename in os.listdir(syllabus_dir):
            if filename.endswith(".pdf") and "5150" in filename:
                f.write(f"File: {filename}\n")
                f.write(extract_text_from_pdf(os.path.join(syllabus_dir, filename), max_pages=3))
                f.write("\n" + "="*20 + "\n")

        # Process Slides
        f.write("\n=== SLIDES ===\n")
        if os.path.exists(slides_dir):
            files = sorted([fn for fn in os.listdir(slides_dir) if fn.endswith(".pdf")])
            for filename in files:
                f.write(f"File: {filename}\n")
                f.write(extract_text_from_pdf(os.path.join(slides_dir, filename)))
                f.write("\n" + "-"*20 + "\n")

if __name__ == "__main__":
    main()
