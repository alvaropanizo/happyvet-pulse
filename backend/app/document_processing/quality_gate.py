from __future__ import annotations

from dataclasses import dataclass

MIN_MEANINGFUL_CHARS = 150
ESTIMATED_CHARS_PER_PAGE = 1200
IMAGE_PENALTY_CHARS = 250
TABLE_PENALTY_CHARS = 180
MIN_COVERAGE_RATIO = 0.30


@dataclass(frozen=True)
class ExtractionSignals:
    page_count: int = 1
    image_count: int = 0
    table_count: int = 0


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

