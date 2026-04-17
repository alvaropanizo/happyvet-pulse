from __future__ import annotations

from dataclasses import dataclass
import re

MIN_MEANINGFUL_CHARS = 150
ESTIMATED_CHARS_PER_PAGE = 1200
IMAGE_PENALTY_CHARS = 250
TABLE_PENALTY_CHARS = 180
MIN_COVERAGE_RATIO = 0.30
MIN_TXT_DOCX_CHAR_COVERAGE_RATIO = 0.85
MAX_TXT_DOCX_LINE_LOSS_RATIO = 0.35


@dataclass(frozen=True)
class ExtractionSignals:
    page_count: int = 1
    image_count: int = 0
    table_count: int = 0


@dataclass(frozen=True)
class FidelitySignals:
    source_char_count: int
    source_line_count: int


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def get_fidelity_signals(source_text: str) -> FidelitySignals:
    lines = [line for line in source_text.splitlines() if line.strip()]
    return FidelitySignals(
        source_char_count=len(normalize_text(source_text)),
        source_line_count=len(lines),
    )


def is_fidelity_sufficient(extracted_text: str, fidelity: FidelitySignals) -> bool:
    extracted_norm = normalize_text(extracted_text)
    extracted_chars = len(extracted_norm)
    if extracted_chars < MIN_MEANINGFUL_CHARS:
        return False

    char_coverage = extracted_chars / float(max(1, fidelity.source_char_count))
    if char_coverage < MIN_TXT_DOCX_CHAR_COVERAGE_RATIO:
        return False

    extracted_lines = len([line for line in extracted_text.splitlines() if line.strip()])
    if fidelity.source_line_count > 0:
        line_retention = extracted_lines / float(fidelity.source_line_count)
        if line_retention < (1.0 - MAX_TXT_DOCX_LINE_LOSS_RATIO):
            return False

    return True


def estimated_available_chars(signals: ExtractionSignals) -> int:
    base = max(1, signals.page_count) * ESTIMATED_CHARS_PER_PAGE
    penalties = (signals.image_count * IMAGE_PENALTY_CHARS) + (signals.table_count * TABLE_PENALTY_CHARS)
    return max(MIN_MEANINGFUL_CHARS, base - penalties)


def is_extraction_sufficient(text: str, signals: ExtractionSignals | None = None) -> bool:
    extracted_char_count = len(text.strip())
    if extracted_char_count < MIN_MEANINGFUL_CHARS:
        return False

    if signals is None:
        return True

    expected_chars = estimated_available_chars(signals)
    coverage_ratio = extracted_char_count / float(max(1, expected_chars))
    return coverage_ratio >= MIN_COVERAGE_RATIO

