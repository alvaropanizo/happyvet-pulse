from __future__ import annotations

from typing import Literal, Optional

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
    mapping_coverage_pct: Optional[float] = Field(
        default=None,
        description=(
            "Percentage (0-100) of target model field groups mapped from parsed output, "
            "using confidence-aware scalar fields and minimum-1 list/group coverage rules."
        ),
    )
    mapped_fields_count: Optional[int] = Field(
        default=None,
        description="Number of mapped field groups used to compute mapping_coverage_pct.",
    )
    total_fields_count: Optional[int] = Field(
        default=None,
        description="Total field groups considered in mapping_coverage_pct calculation.",
    )
    confident_fields_count: Optional[int] = Field(
        default=None,
        description="Number of scalar fields with value and confidence > 0.8.",
    )
    confident_total_fields_count: Optional[int] = Field(
        default=None,
        description="Total scalar fields considered in confident_coverage_pct calculation.",
    )
    confident_coverage_pct: Optional[float] = Field(
        default=None,
        description="Percentage (0-100) of scalar fields confidently auto-approvable (>0.8).",
    )
    reason: Optional[str] = Field(
        default=None, description="Optional explanation when meaningful_text is false."
    )


class DocumentProcessingResult(BaseModel):
    structured_text_markdown: str = Field(
        description="Primary structured text output, expected to be Markdown."
    )
    parsing_metadata: ParsingMetadata


ParsingMode = Literal["parser", "ocr"]

