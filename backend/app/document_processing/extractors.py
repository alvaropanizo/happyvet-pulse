from __future__ import annotations

from io import BytesIO

def extract_txt(content: bytes) -> str:
    return content.decode("utf-8", errors="replace").strip()


def extract_docx(content: bytes) -> str:
    from docx import Document  # type: ignore

    doc = Document(BytesIO(content))
    return "\n".join(paragraph.text for paragraph in doc.paragraphs).strip()


def extract_pdf_text_layer(content: bytes) -> str:
    import fitz  # type: ignore

    text_chunks: list[str] = []
    with fitz.open(stream=content, filetype="pdf") as document:
        for page in document:
            text_chunks.append(page.get_text("text"))
    return "\n".join(chunk.strip() for chunk in text_chunks if chunk.strip()).strip()


def analyze_pdf_structure(content: bytes) -> tuple[int, int, int]:
    """Return (page_count, image_count, table_count) for a PDF."""
    import fitz  # type: ignore

    page_count = 0
    image_count = 0
    table_count = 0

    with fitz.open(stream=content, filetype="pdf") as document:
        page_count = len(document)
        for page in document:
            image_count += len(page.get_images(full=True))
            try:
                finder = page.find_tables()
                table_count += len(getattr(finder, "tables", []))
            except Exception:  # noqa: BLE001 - table detection is best-effort only
                continue

    return page_count, image_count, table_count


def extract_pdf_ocr(content: bytes) -> str:
    import pytesseract  # type: ignore
    from pdf2image import convert_from_bytes  # type: ignore

    pages = convert_from_bytes(content, dpi=200)
    text_chunks: list[str] = [pytesseract.image_to_string(page) for page in pages]
    return "\n".join(chunk.strip() for chunk in text_chunks if chunk.strip()).strip()


def extract_image_ocr(content: bytes) -> str:
    import pytesseract  # type: ignore
    from PIL import Image  # type: ignore

    image = Image.open(BytesIO(content))
    return pytesseract.image_to_string(image).strip()

