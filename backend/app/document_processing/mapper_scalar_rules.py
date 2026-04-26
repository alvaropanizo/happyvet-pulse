from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Callable

from dateparser.search import search_dates

from app.document_processing.mapper_common import (
    best_fuzzy_ratio,
    clean_lines,
    looks_like_field_label,
    looks_noisy_capture,
    sanitize_extracted_value,
    strip_accents,
)
from app.document_processing.mapper_constants import BIRTH_LABELS, BREED_KEYWORDS
from app.document_processing.mapper_key_value import ParsedKeyValue, extract_from_parsed


def extract_demographic_block(text: str) -> str:
    lines = clean_lines(text)
    if not lines:
        return text
    stop_patterns = (
        re.compile(r"^event\s*\d+[:\-\s]", flags=re.IGNORECASE),
        re.compile(r"^evento\s*\d+[:\-\s]", flags=re.IGNORECASE),
        re.compile(r"clinical\s+chronology", flags=re.IGNORECASE),
        re.compile(r"clinical\s+history", flags=re.IGNORECASE),
        re.compile(r"timeline", flags=re.IGNORECASE),
        re.compile(r"^\s*date\s*[:\-]", flags=re.IGNORECASE),
        re.compile(r"^\s*fecha\s*[:\-]", flags=re.IGNORECASE),
        re.compile(r"^\s*(doctor|dr\.?|attending|veterinarian|anamnesis|diagnosis|diagnostico|diagnóstico|treatment|tratamiento|test|lab)\b", flags=re.IGNORECASE),
    )
    collected: list[str] = []
    for line in lines:
        if any(pattern.search(line) for pattern in stop_patterns):
            break
        # Prevent drifting too far into narrative paragraphs.
        if len(collected) >= 40:
            break
        collected.append(line)
    return "\n".join(collected).strip() or text


def extract_labeled_value(text: str, labels: tuple[str, ...]) -> str | None:
    labels_pattern = "|".join(re.escape(label) for label in labels)
    pattern = r"(?<!\w)(?:{})\b\s*[:\-=]\s*([^\n\r:|]{{1,120}})".format(labels_pattern)
    for match in re.finditer(pattern, text, flags=re.IGNORECASE):
        candidate = sanitize_extracted_value(match.group(1))
        if candidate and not looks_like_field_label(candidate) and not looks_noisy_capture(candidate):
            return candidate

    for line in clean_lines(text):
        if ":" not in line:
            continue
        lhs, rhs = line.split(":", 1)
        lhs_norm = lhs.strip().lower()
        if best_fuzzy_ratio(lhs_norm, labels) >= 86:
            candidate = sanitize_extracted_value(rhs)
            if candidate and not looks_like_field_label(candidate) and not looks_noisy_capture(candidate):
                return candidate
    return None


def extract_value(text: str, patterns: list[str]) -> str | None:
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            return re.sub(r"\s{2,}", " ", match.group(1).strip())
    return None


def normalize_species(value: str | None) -> str | None:
    if not value:
        return None
    token = value.strip().lower()
    aliases = {
        "dog": ("dog", "canine", "canino", "canina", "perro", "perra"),
        "cat": ("cat", "feline", "felino", "felina", "gato", "gata"),
        "bird": ("bird", "ave", "avian", "pajaro", "pájaro"),
    }
    for canonical, words in aliases.items():
        if token in words:
            return canonical
    best_match = ("other", 0.0)
    for canonical, words in aliases.items():
        ratio = best_fuzzy_ratio(token, words)
        if ratio > best_match[1]:
            best_match = (canonical, ratio)
    if best_match[1] >= 83:
        return best_match[0]
    return "other"


def normalize_sex(value: str | None) -> str | None:
    if not value:
        return None
    token = strip_accents(value.strip().lower())
    token = re.sub(r"[\(\[\{].*?[\)\]\}]", " ", token)
    token = re.sub(r"[^a-z\s]", " ", token)
    token = re.sub(r"\s{2,}", " ", token).strip()
    male_aliases = ("male", "macho", "masculino")
    female_aliases = ("female", "hembra", "femenino")
    if any(re.search(rf"\b{re.escape(alias)}\b", token) for alias in male_aliases):
        return "male"
    if any(re.search(rf"\b{re.escape(alias)}\b", token) for alias in female_aliases):
        return "female"
    if token in male_aliases or best_fuzzy_ratio(token, male_aliases) >= 85:
        return "male"
    if token in female_aliases or best_fuzzy_ratio(token, female_aliases) >= 85:
        return "female"
    return None


def normalize_weight_to_kg(raw_value: str | None) -> str | None:
    if not raw_value:
        return None
    cleaned = raw_value.strip().lower().replace(",", ".")
    match = re.search(r"([0-9]+(?:\.[0-9]+)?)\s*(kg|kgs|g|gr|grams?)?", cleaned)
    if not match:
        return None
    amount = float(match.group(1))
    unit = match.group(2) or "kg"
    if unit in {"g", "gr", "gram", "grams"}:
        amount = amount / 1000.0
    normalized = f"{amount:.3f}".rstrip("0").rstrip(".")
    return normalized or None


def normalize_email(value: str | None) -> str | None:
    if not value:
        return None
    candidate = value.strip()
    # Keep only strict email-like values to avoid OCR/noise captures (e.g. temperatures).
    if not re.fullmatch(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}", candidate):
        return None
    return candidate.lower()


def normalize_phone(value: str | None) -> str | None:
    if not value:
        return None
    candidate = re.sub(r"\s{2,}", " ", value.strip())
    if "°" in candidate:
        return None
    normalized = re.sub(r"[^\d+]", "", candidate)
    # Keep optional leading + and a realistic number of digits.
    digits = re.sub(r"\D", "", normalized)
    if not (8 <= len(digits) <= 15):
        return None
    if normalized.count("+") > 1 or ("+" in normalized and not normalized.startswith("+")):
        return None
    return candidate


def normalize_address(value: str | None) -> str | None:
    if not value:
        return None
    candidate = re.sub(r"\s{2,}", " ", value.strip())
    if len(candidate) < 8 or "°" in candidate:
        return None
    if not re.search(r"[A-Za-zÀ-ÖØ-öø-ÿ]", candidate):
        return None
    # Avoid capturing short medical notes or standalone temperatures as addresses.
    if re.search(r"\b(?:temperature|temperatura|week|semana)\b", candidate, flags=re.IGNORECASE):
        return None
    return candidate


def extract_patient_name(text: str) -> str | None:
    prioritized = extract_labeled_value(
        text,
        ("patient_name", "pet_name", "patient name", "pet name", "paciente", "mascota"),
    )
    if prioritized:
        return prioritized

    generic_name = extract_labeled_value(text, ("name",))
    if not generic_name:
        return None

    # Guard against owner labels leaking into generic "name" capture.
    for line in clean_lines(text):
        if generic_name in line and re.search(r"\b(owner|propietario|tutor|account holder)\b", line, flags=re.IGNORECASE):
            return None
    lowered = generic_name.lower()
    if re.search(r"\b(event|visit|consulta|anamnesis|diagnosis|diagnostico|diagnóstico|treatment|tratamiento)\b", lowered):
        return None
    if len(generic_name.split()) > 4:
        return None
    return generic_name


def extract_owner_name(text: str) -> str | None:
    # Prefer canonical owner labels before representative labels.
    owner_primary = extract_labeled_value(
        text,
        (
            "owner_name",
            "owner name",
            "owner",
            "primary account holder",
            "account holder",
            "propietario",
            "tutor",
        ),
    )
    if owner_primary:
        return owner_primary

    representative = extract_labeled_value(
        text,
        ("authorized representative", "representative", "contact person"),
    )
    return representative


def extract_breed(text: str) -> str | None:
    labeled_breed = extract_labeled_value(text, ("raza", "breed"))
    if labeled_breed:
        return labeled_breed
    lowered = strip_accents(text.lower())
    for breed in BREED_KEYWORDS:
        normalized_breed = strip_accents(breed.lower())
        if re.search(rf"\b{re.escape(normalized_breed)}\b", lowered):
            return breed.title()
    return None


def extract_birth_date(text: str) -> str | None:
    standalone_iso = re.search(r"\b(\d{4}-\d{2}-\d{2})\b", text)
    if standalone_iso:
        return standalone_iso.group(1)
    standalone_dmy = re.search(r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b", text)
    if standalone_dmy:
        parsed = search_dates(standalone_dmy.group(1), languages=["en", "es"], settings={"DATE_ORDER": "DMY"}) or []
        if parsed:
            return parsed[0][1].date().isoformat()

    direct_iso = re.search(
        r"\b(?:date[\s_]*of[\s_]*birth|birth[\s_]*date|date_of_birth|dob|fecha[\s_]*de[\s_]*nacimiento|nacimiento)\b"
        r"\s*(?::|=|-)?\s*(\d{4}-\d{2}-\d{2})\b",
        text,
        flags=re.IGNORECASE,
    )
    if direct_iso:
        return direct_iso.group(1)

    labeled_birth = extract_labeled_value(text, BIRTH_LABELS)
    if labeled_birth:
        iso_match = re.search(r"\b(\d{4}-\d{2}-\d{2})\b", labeled_birth)
        if iso_match:
            return iso_match.group(1)
        dmy_match = re.search(r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b", labeled_birth)
        if dmy_match:
            parsed = search_dates(dmy_match.group(1), languages=["en", "es"], settings={"DATE_ORDER": "DMY"}) or []
            if parsed:
                return parsed[0][1].date().isoformat()
        parsed = search_dates(labeled_birth, languages=["en", "es"], settings={"DATE_ORDER": "DMY"}) or []
        if parsed:
            return parsed[0][1].date().isoformat()

    birth_markers = {strip_accents(label.lower()).replace("_", " ") for label in BIRTH_LABELS}
    for line in clean_lines(text):
        normalized = strip_accents(line.lower()).replace("_", " ")
        if any(marker in normalized for marker in birth_markers):
            parsed = search_dates(line, languages=["en", "es"], settings={"DATE_ORDER": "DMY"}) or []
            if parsed:
                return parsed[0][1].date().isoformat()
    return None


def extract_owner_phone(text: str) -> str | None:
    owner_contact = extract_labeled_value(
        text,
        ("owner_contact", "contact", "primary contact", "primary phone"),
    )
    if owner_contact:
        phone_match = re.search(r"([+0-9][0-9\s\-()]{6,24})", owner_contact, flags=re.IGNORECASE)
        if phone_match:
            return normalize_phone(phone_match.group(1))

    phone = extract_labeled_value(
        text,
        (
            "owner_phone",
            "owner phone",
            "primary phone",
            "primary contact",
            "contact",
            "telefono",
            "teléfono",
            "mobile",
            "movil",
            "móvil",
            "phone",
            "tel",
        ),
    )
    if phone:
        return normalize_phone(phone)

    direct_match = re.search(
        r"(?:primary\s+contact|primary\s+phone|owner\s+phone|contact|tel|phone|telefono|teléfono|mobile|movil|móvil)\s*[:\-]?\s*([+0-9][0-9\s\-()]{6,24})",
        text,
        flags=re.IGNORECASE,
    )
    if direct_match:
        return normalize_phone(direct_match.group(1))
    return None


def extract_weight_kg(text: str) -> str | None:
    labeled_weight = extract_labeled_value(text, ("weight_kg", "weight", "peso"))
    if labeled_weight:
        normalized = normalize_weight_to_kg(labeled_weight)
        if normalized:
            return normalized
    inline_match = re.search(
        r"(?:\bweight\b|\bpeso\b)\s*[:\-]\s*([0-9]+(?:[.,][0-9]+)?\s*(?:kg|kgs|g|gr|grams?)?)",
        text,
        flags=re.IGNORECASE,
    )
    if inline_match:
        normalized = normalize_weight_to_kg(inline_match.group(1))
        if normalized:
            return normalized
    return None


def extract_chip_id(text: str) -> str | None:
    chip = extract_labeled_value(text, ("chip_id", "microchip_id", "chip", "microchip"))
    if chip:
        normalized = re.sub(r"[^0-9A-Za-z]", "", chip)
        if 8 <= len(normalized) <= 25:
            return normalized
    direct_match = re.search(
        r"(?:\bchip[_\s-]?id\b|\bmicrochip[_\s-]?id\b|\bchip\b|\bmicrochip\b)\s*[:\-]\s*([A-Za-z0-9\-\s]{8,30})",
        text,
        flags=re.IGNORECASE,
    )
    if direct_match:
        normalized = re.sub(r"[^0-9A-Za-z]", "", direct_match.group(1))
        if 8 <= len(normalized) <= 25:
            return normalized
    record_id_match = re.search(
        r"(?:expediente|record|patient[_\s-]?id|pet[_\s-]?id)\b[^\n#]*#?\s*([A-Za-z]{1,5}[-\s]?[A-Za-z0-9]{4,20})",
        text,
        flags=re.IGNORECASE,
    )
    if record_id_match:
        normalized = re.sub(r"[^0-9A-Za-z]", "", record_id_match.group(1))
        if 8 <= len(normalized) <= 25:
            return normalized
    normalized_text = strip_accents(text.lower())
    normalized_record_match = re.search(
        r"(?:expediente|record|patient[_\s-]?id|pet[_\s-]?id)[^#\n]{0,60}#\s*([a-z0-9\-]{6,30})",
        normalized_text,
        flags=re.IGNORECASE,
    )
    if normalized_record_match:
        normalized = re.sub(r"[^0-9A-Za-z]", "", normalized_record_match.group(1))
        if 8 <= len(normalized) <= 25:
            return normalized.upper()
    return None


@dataclass(frozen=True)
class ScalarRule:
    alias_key: str
    fallback: Callable[[str], str | None] | None = None
    normalize: Callable[[str | None], str | None] | None = None
    fallback_confidence: float = 0.0


def extract_scalar_with_rule(raw_text: str, parsed_pairs: list[ParsedKeyValue], rule: ScalarRule) -> tuple[str | None, float, str | None]:
    raw_value, raw_conf = extract_from_parsed(parsed_pairs, rule.alias_key)
    source = "parsed" if raw_value else None

    if not raw_value and rule.fallback is not None:
        raw_value = rule.fallback(raw_text)
        if raw_value:
            raw_conf = rule.fallback_confidence
            source = "fallback"

    value = rule.normalize(raw_value) if rule.normalize is not None else raw_value
    return value, raw_conf, raw_value


SCALAR_RULES = {
    "name": ScalarRule(
        alias_key="pet_name",
        fallback=extract_patient_name,
        fallback_confidence=0.62,
    ),
    "species_raw": ScalarRule(
        alias_key="species",
        fallback=lambda raw_text: extract_value(raw_text, [r"\b(CANINA?|FELINA?|CANINO|FELINO|DOG|CAT|BIRD|AVE)\b"]),
        normalize=normalize_species,
        fallback_confidence=0.70,
    ),
    "breed": ScalarRule(alias_key="breed", fallback=extract_breed, fallback_confidence=0.60),
    "sex": ScalarRule(
        alias_key="sex",
        fallback=lambda raw_text: extract_labeled_value(raw_text, ("sexo", "sex")),
        normalize=normalize_sex,
        fallback_confidence=0.64,
    ),
    "birth_raw": ScalarRule(alias_key="birth_date"),
    "chip_raw": ScalarRule(alias_key="chip_id"),
    "weight_raw": ScalarRule(alias_key="weight_kg"),
    "owner_name": ScalarRule(
        alias_key="owner_name",
        fallback=extract_owner_name,
        fallback_confidence=0.58,
    ),
    "owner_surname": ScalarRule(
        alias_key="owner_surname",
        fallback=lambda raw_text: extract_labeled_value(raw_text, ("owner_surname", "owner surname", "surname", "apellido")),
        fallback_confidence=0.58,
    ),
    "owner_email": ScalarRule(
        alias_key="owner_email",
        fallback=lambda raw_text: extract_labeled_value(raw_text, ("owner_email", "email", "correo", "e-mail")),
        normalize=normalize_email,
        fallback_confidence=0.64,
    ),
    "owner_address": ScalarRule(
        alias_key="address",
        fallback=lambda raw_text: extract_labeled_value(raw_text, ("address", "direccion", "dirección", "domicilio")),
        normalize=normalize_address,
        fallback_confidence=0.55,
    ),
}
