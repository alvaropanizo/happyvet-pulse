from __future__ import annotations

import re
import unicodedata
from difflib import SequenceMatcher

try:
    from rapidfuzz import fuzz as _rapidfuzz
except ModuleNotFoundError:  # pragma: no cover - fallback for local environments
    _rapidfuzz = None

from app.document_processing.mapper_constants import DISALLOWED_LABEL_VALUES, INLINE_FIELD_MARKERS, NOISY_CAPTURE_TOKENS


def strip_accents(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    return "".join(char for char in normalized if not unicodedata.combining(char))


def clean_lines(text: str) -> list[str]:
    lines = [line.strip() for line in text.splitlines()]
    return [line for line in lines if line]


def best_fuzzy_ratio(source: str, candidates: tuple[str, ...] | list[str]) -> float:
    if not source:
        return 0.0
    if _rapidfuzz is not None:
        return max((_rapidfuzz.partial_ratio(source, candidate) for candidate in candidates), default=0.0)
    return max((_partial_ratio_fallback(source, candidate) for candidate in candidates), default=0.0)


def _partial_ratio_fallback(source: str, candidate: str) -> float:
    """Approximate rapidfuzz.partial_ratio using stdlib-only matching."""
    source_l = source.lower()
    candidate_l = candidate.lower()
    if not source_l or not candidate_l:
        return 0.0
    shorter, longer = (source_l, candidate_l) if len(source_l) <= len(candidate_l) else (candidate_l, source_l)
    window = len(shorter)
    best = 0.0
    for index in range(0, len(longer) - window + 1):
        score = SequenceMatcher(None, shorter, longer[index : index + window]).ratio()
        if score > best:
            best = score
            if best >= 0.999:
                break
    return best * 100.0


def looks_like_field_label(value: str) -> bool:
    token = strip_accents(value.strip().lower())
    token = re.sub(r"\s{2,}", " ", token)
    return token in DISALLOWED_LABEL_VALUES


def looks_noisy_capture(value: str) -> bool:
    normalized = strip_accents(value.lower())
    if len(normalized) > 60:
        return True
    if re.search(r'(?:^|\s)(?:and|y)\s+["\']?(?:owner|pet|patient)[_\s-]?(?:name|surname|email|phone)\b', normalized):
        return True
    return any(token in normalized for token in NOISY_CAPTURE_TOKENS)


def sanitize_extracted_value(value: str | None) -> str | None:
    if not value:
        return None
    cleaned = re.sub(r"\s{2,}", " ", value).strip()
    inline_marker_pattern = r'(?:\s+(?:and|y)\s+)?["\']?(?:{})\b.*$'.format(
        "|".join(re.escape(marker) for marker in INLINE_FIELD_MARKERS)
    )
    cleaned = re.sub(inline_marker_pattern, "", cleaned, flags=re.IGNORECASE).strip()

    quoted_match = re.match(r'^[\'"]([^\'"]{1,80})[\'"](?:\s+.*)?$', cleaned)
    if quoted_match:
        cleaned = quoted_match.group(1).strip()

    prose_tail_match = re.match(
        r"^([A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ' -]{0,60}?)\s*[\"']?\s+(?:is|was|are|were|has|have)\b.*$",
        cleaned,
        flags=re.IGNORECASE,
    )
    if prose_tail_match:
        cleaned = prose_tail_match.group(1).strip()

    cleaned = cleaned.strip(" \t:|-\"'")
    return cleaned or None
