from __future__ import annotations

import re
from dataclasses import dataclass

from app.document_processing.mapper_common import (
    best_fuzzy_ratio,
    clean_lines,
    looks_like_field_label,
    looks_noisy_capture,
    sanitize_extracted_value,
    strip_accents,
)
from app.document_processing.mapper_constants import KEY_ALIASES


@dataclass(frozen=True)
class ParsedKeyValue:
    key_raw: str
    key_norm: str
    value_raw: str
    line_index: int
    separator: str


def normalize_key_token(key: str) -> str:
    token = strip_accents(key.lower()).strip()
    token = re.sub(r"[^a-z0-9_ ]+", "", token)
    token = re.sub(r"\s+", " ", token)
    return token.replace(" ", "_")


def parse_key_value_lines(text: str) -> list[ParsedKeyValue]:
    pairs: list[ParsedKeyValue] = []
    pattern = re.compile(
        r'([A-Za-zÀ-ÖØ-öø-ÿ_][A-Za-zÀ-ÖØ-öø-ÿ0-9_ ]{1,40}?)\s*([:=-])\s*(".*?"|\'.*?\'|[^:=|]+?)(?=(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ_][A-Za-zÀ-ÖØ-öø-ÿ0-9_ ]{1,40}?\s*[:=-])|$)',
        flags=re.IGNORECASE,
    )
    for index, line in enumerate(clean_lines(text)):
        for match in pattern.finditer(line):
            key_raw = match.group(1).strip()
            value_raw = match.group(3).strip()
            if not key_raw or not value_raw:
                continue
            pairs.append(
                ParsedKeyValue(
                    key_raw=key_raw,
                    key_norm=normalize_key_token(key_raw),
                    value_raw=value_raw,
                    line_index=index,
                    separator=match.group(2),
                )
            )
    return pairs


def match_alias_score(key_norm: str, aliases: tuple[str, ...]) -> float:
    normalized_aliases = tuple(normalize_key_token(alias) for alias in aliases)
    if key_norm in normalized_aliases:
        return 1.0
    return max((best_fuzzy_ratio(key_norm, (alias,)) for alias in normalized_aliases), default=0.0) / 100.0


def extract_from_parsed(pairs: list[ParsedKeyValue], alias_key: str) -> tuple[str | None, float]:
    aliases = KEY_ALIASES.get(alias_key, ())
    min_alias_score = 0.95 if alias_key in {"owner_name", "owner_surname"} else 0.83
    best_value: str | None = None
    best_score = 0.0
    for pair in pairs:
        if not _is_key_candidate_for_alias(alias_key, pair.key_norm):
            continue
        alias_score = match_alias_score(pair.key_norm, aliases)
        if alias_score < min_alias_score:
            continue
        candidate = sanitize_extracted_value(pair.value_raw)
        if not candidate or looks_like_field_label(candidate) or looks_noisy_capture(candidate):
            continue
        confidence = 0.58 + (0.3 * alias_score) + (0.05 if pair.separator in (":", "=") else 0.0)
        confidence = min(0.96, confidence)
        if confidence > best_score:
            best_score = confidence
            best_value = candidate
    return best_value, best_score


def extract_from_parsed_with_provenance(pairs: list[ParsedKeyValue], alias_key: str) -> dict:
    aliases = KEY_ALIASES.get(alias_key, ())
    min_alias_score = 0.95 if alias_key in {"owner_name", "owner_surname"} else 0.83
    best_pair: ParsedKeyValue | None = None
    best_value: str | None = None
    best_score = 0.0
    best_alias_score = 0.0
    for pair in pairs:
        if not _is_key_candidate_for_alias(alias_key, pair.key_norm):
            continue
        alias_score = match_alias_score(pair.key_norm, aliases)
        if alias_score < min_alias_score:
            continue
        candidate = sanitize_extracted_value(pair.value_raw)
        if not candidate or looks_like_field_label(candidate) or looks_noisy_capture(candidate):
            continue
        confidence = 0.58 + (0.3 * alias_score) + (0.05 if pair.separator in (":", "=") else 0.0)
        confidence = min(0.96, confidence)
        if confidence > best_score:
            best_score = confidence
            best_alias_score = alias_score
            best_pair = pair
            best_value = candidate

    if best_pair is None:
        return {
            "value": None,
            "confidence": 0.0,
            "matched_key": None,
            "line_index": None,
            "match_type": "unmapped",
        }

    match_type = "exact_alias" if best_alias_score >= 0.999 else "fuzzy_alias"
    return {
        "value": best_value,
        "confidence": best_score,
        "matched_key": best_pair.key_raw,
        "line_index": best_pair.line_index,
        "match_type": match_type,
    }


def _is_key_candidate_for_alias(alias_key: str, key_norm: str) -> bool:
    if alias_key == "owner_name":
        owner_markers = ("owner", "propietario", "tutor", "account", "holder", "representative")
        return any(marker in key_norm for marker in owner_markers)
    if alias_key == "owner_surname":
        surname_markers = ("owner_surname", "surname", "apellido")
        return any(marker in key_norm for marker in surname_markers)
    return True
