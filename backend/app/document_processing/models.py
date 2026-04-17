from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class ParsingMetadata(BaseModel):
    """Quality signals for the parsing pipeline."""

    engine: str = Field(description="Name of the parsing engine used (e.g., gatekeeper).")
    extraction_method: str = Field(description="Extraction path used: fast_path or tesseract_fallback.")
    latency_ms: int = Field(description="Total document processing time in milliseconds.")
    extracted_char_count: int = Field(
        description="Approximate amount of text extracted from the document."
    )
    meaningful_text: bool = Field(
        description="Whether extracted text is above a minimal quality threshold."
    )
    integrity_score: float = Field(
        description="0-1 heuristic score derived from parsing quality signals."
    )
    reason: str | None = Field(
        default=None, description="Optional explanation when meaningful_text is false."
    )


class DocumentProcessingResult(BaseModel):
    structured_text_markdown: str = Field(
        description="Primary structured text output, expected to be Markdown."
    )
    parsing_metadata: ParsingMetadata


ParsingMode = Literal["parser", "ocr"]

