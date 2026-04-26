from __future__ import annotations

import re
from datetime import datetime, timezone

from dateparser.search import search_dates

from app.document_processing.mapper_common import best_fuzzy_ratio, clean_lines
from app.schemas.medical_record import Diagnosis, MedicalRecordDraft, TestResult, TimelineEvent, Treatment

MAX_TIMELINE_EVENTS = 80

def map_timeline_events(*, draft: MedicalRecordDraft, raw_text: str, source_document_id: str) -> None:
    lines = clean_lines(raw_text)
    if not lines:
        return

    event_blocks = split_timeline_blocks(lines)
    seen_signatures: set[str] = set()
    seen_explicit_event_numbers: set[str] = set()
    created_count = 0
    for block in event_blocks:
        event_number = extract_event_number(block)
        if event_number and event_number in seen_explicit_event_numbers:
            continue
        event_date = parse_date_from_lines(block)
        if not event_date:
            continue
        event_type = infer_event_type(block)
        title = extract_event_title(block)
        clinic = extract_clinic(block)
        anamnesis, assessment, diagnoses, treatments, tests = extract_event_payload(block)
        signature = _event_signature(
            date=event_date,
            event_type=event_type,
            title=title,
            anamnesis=anamnesis,
            diagnoses=diagnoses,
            treatments=treatments,
            tests=tests,
        )
        if signature in seen_signatures:
            continue
        seen_signatures.add(signature)
        if event_number:
            seen_explicit_event_numbers.add(event_number)
        created_count += 1

        event = TimelineEvent(
            event_id=f"evt_{created_count:03d}",
            date=event_date,
            event_type=event_type,
            clinic=clinic,
            title=title,
            anamnesis=anamnesis,
            assessment=assessment,
            diagnoses=diagnoses,
            treatments=treatments,
            tests=tests,
            source={"document_id": source_document_id},
        )
        event.status = infer_timeline_event_status(event)
        draft.timeline.append(event)


def split_timeline_blocks(lines: list[str]) -> list[list[str]]:
    scoped_lines = _extract_clinical_section(lines)
    if not scoped_lines:
        return []

    explicit_blocks = _split_explicit_event_blocks(scoped_lines)
    if explicit_blocks:
        return explicit_blocks[:MAX_TIMELINE_EVENTS]

    blocks: list[list[str]] = []
    current: list[str] = []
    seen_date = False
    for line in scoped_lines:
        has_date = line_has_date_marker(line)
        has_visit_marker = best_fuzzy_ratio(line.lower(), ("visit", "consulta", "control", "revisión", "revision")) >= 88
        if current and ((has_date and seen_date) or (has_date and len(current) > 8) or (has_visit_marker and len(current) > 10)):
            blocks.append(current)
            current = []
            seen_date = False
        current.append(line)
        seen_date = seen_date or has_date
    if current:
        blocks.append(current)
    return blocks[:MAX_TIMELINE_EVENTS]


def line_has_date_marker(line: str) -> bool:
    if re.search(r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b", line):
        return True
    if re.search(r"\b\d{4}-\d{2}-\d{2}\b", line):
        return True
    parsed = search_dates(line, languages=["en", "es"], settings={"DATE_ORDER": "DMY"}) or []
    return bool(parsed)


def parse_date_from_lines(lines: list[str]) -> str | None:
    for line in lines[:8]:
        normalized = line.strip()
        if re.match(r"^(date|fecha)\s*[:\-]", normalized, flags=re.IGNORECASE):
            date_value = _extract_strict_date_value(normalized)
            if date_value:
                return date_value

    # Strict fallback for unlabeled date rows close to block start.
    for line in lines[:4]:
        date_value = _extract_strict_date_value(line)
        if date_value:
            return date_value
    return None


def infer_event_type(lines: list[str]) -> str:
    title_hint = (lines[0] if lines else "").lower()
    text = " ".join(lines).lower()
    candidates = {
        "vaccination": ("vaccine", "vaccination", "vacuna", "vacunacion", "vacunación"),
        "lab": ("lab", "laboratory", "analitica", "analítica", "blood test", "hemograma"),
        "prescription": ("prescription", "rx", "medication", "receta", "tratamiento"),
        "hospitalization": ("hospitalization", "hospitalizacion", "hospitalización", "ingreso"),
        "phone_call": ("phone", "telefono", "teléfono", "llamada"),
        "administrative": ("administrative", "invoice", "factura", "billing"),
        "visit": ("visit", "consulta", "clinical", "revision", "revisión"),
    }
    for event_type, keywords in candidates.items():
        if best_fuzzy_ratio(title_hint, keywords) >= 90:
            return event_type
    best = ("visit", 0.0)
    for event_type, keywords in candidates.items():
        ratio = best_fuzzy_ratio(text, keywords)
        if ratio > best[1]:
            best = (event_type, ratio)
    return best[0]


def extract_event_title(lines: list[str]) -> str | None:
    for line in lines[:5]:
        if re.match(r"^event\s*\d+[:\-\s]", line, flags=re.IGNORECASE):
            # Keep descriptive tail after EVENT marker.
            rhs = line.split(":", 1)[1].strip() if ":" in line else line
            return rhs[:120]
        if len(line) > 6 and not line_has_date_marker(line):
            return line[:120]
    return None


def extract_diagnoses(lines: list[str]) -> list[Diagnosis]:
    diagnoses: list[Diagnosis] = []
    for line in lines:
        if best_fuzzy_ratio(line.lower(), ("diagnosis", "diagnostico", "diagnóstico", "problem", "assessment")) >= 86:
            payload = extract_rhs_or_self(line)
            if payload:
                diagnoses.append(Diagnosis(text=payload))
    return diagnoses[:4]


def extract_treatments(lines: list[str]) -> list[Treatment]:
    treatments: list[Treatment] = []
    for line in lines:
        if best_fuzzy_ratio(
            line.lower(),
            ("treatment", "tratamiento", "medication", "medicacion", "medicación", "dose", "dosis"),
        ) >= 84:
            payload = extract_rhs_or_self(line)
            if payload:
                treatments.append(Treatment(medication=payload))
    return treatments[:4]


def extract_tests(lines: list[str]) -> list[TestResult]:
    tests: list[TestResult] = []
    for line in lines:
        if best_fuzzy_ratio(line.lower(), ("test", "prueba", "lab", "analitica", "analítica", "blood", "exam")) >= 84:
            payload = extract_rhs_or_self(line)
            if payload:
                tests.append(TestResult(test_name=payload))
    return tests[:4]


def extract_clinic(lines: list[str]) -> str | None:
    for line in lines[:8]:
        if re.match(r"^\s*(attending|doctor|dr\.?|veterinarian)\s*[:\-]", line, flags=re.IGNORECASE):
            rhs = extract_rhs_or_self(line)
            return rhs[:120] if rhs else None
    return None


def extract_event_payload(lines: list[str]) -> tuple[str | None, list[str], list[Diagnosis], list[Treatment], list[TestResult]]:
    diagnoses = extract_diagnoses(lines)
    treatments = extract_treatments(lines)
    tests = extract_tests(lines)

    diagnosis_payloads = {d.text.strip().lower() for d in diagnoses if d.text}
    treatment_payloads = {t.medication.strip().lower() for t in treatments if t.medication}
    test_payloads = {t.test_name.strip().lower() for t in tests if t.test_name}

    anamnesis_lines: list[str] = []
    assessment_lines: list[str] = []
    for raw_line in lines:
        line = _normalize_event_line(raw_line)
        if not line:
            continue
        lowered = line.lower()
        if re.match(r"^event\s*\d+[:\-\s]", lowered):
            continue
        if re.match(r"^(date|fecha|time|hora)\s*[:\-]", lowered):
            continue
        if re.match(r"^\s*(attending|doctor|dr\.?|veterinarian)\s*[:\-]", lowered):
            continue
        if re.match(r"^\s*(diagnosis|diagnostico|diagnóstico|problem|assessment)\s*[:\-]", lowered):
            continue
        if re.match(r"^\s*(treatment|medication|medicacion|medicación|dose|dosis)\s*[:\-]", lowered):
            continue
        if re.match(r"^\s*(test|prueba|lab|analitica|analítica|exam|blood)\s*[:\-]", lowered):
            continue

        if re.match(r"^\s*anamnesis\s*[:\-]", lowered):
            payload = extract_rhs_or_self(line)
            if payload:
                anamnesis_lines.append(payload)
            continue

        lowered_clean = lowered.strip()
        if lowered_clean in diagnosis_payloads or lowered_clean in treatment_payloads or lowered_clean in test_payloads:
            continue

        # Prefer richer narrative lines for assessment; fallback to anamnesis if explicit label missing.
        if len(line) >= 18 and len(assessment_lines) < 6:
            assessment_lines.append(line[:220])
        elif len(line) >= 10 and len(anamnesis_lines) < 4:
            anamnesis_lines.append(line[:220])

    anamnesis = " ".join(anamnesis_lines).strip()[:600] if anamnesis_lines else None
    if not anamnesis and assessment_lines:
        anamnesis = assessment_lines[0][:600]
    return anamnesis, assessment_lines[:6], diagnoses, treatments, tests


def _normalize_event_line(line: str) -> str:
    normalized = line.strip()
    normalized = re.sub(r"^[•\-\u2022]+\s*", "", normalized)
    normalized = re.sub(r"\s{2,}", " ", normalized)
    return normalized


def extract_event_number(lines: list[str]) -> str | None:
    if not lines:
        return None
    first = lines[0].strip().lower()
    match = re.match(r"^event\s*0*([0-9]{1,4})[:\-\s]", first)
    if not match:
        return None
    return match.group(1)


def _extract_strict_date_value(text: str) -> str | None:
    iso_match = re.search(r"\b(20[0-9]{2}-[01][0-9]-[0-3][0-9])\b", text)
    if iso_match:
        return iso_match.group(1)
    dmy_match = re.search(r"\b([0-3]?[0-9][/-][01]?[0-9][/-](?:19|20)?[0-9]{2})\b", text)
    if not dmy_match:
        return None
    parsed = search_dates(dmy_match.group(1), languages=["en", "es"], settings={"DATE_ORDER": "DMY"}) or []
    if not parsed:
        return None
    date_value = parsed[0][1].date().isoformat()
    year = int(date_value[:4])
    if year < 1990 or year > 2100:
        return None
    return date_value


def _event_signature(
    *,
    date: str | None,
    event_type: str,
    title: str | None,
    anamnesis: str | None,
    diagnoses: list[Diagnosis],
    treatments: list[Treatment],
    tests: list[TestResult],
) -> str:
    def norm(value: str | None) -> str:
        return re.sub(r"\s+", " ", (value or "").strip().lower())

    diagnosis_key = "|".join(sorted(norm(item.text) for item in diagnoses if item.text))
    treatment_key = "|".join(sorted(norm(item.medication) for item in treatments if item.medication))
    test_key = "|".join(sorted(norm(item.test_name) for item in tests if item.test_name))
    # Use truncated narrative to avoid over-fragmenting near-identical OCR repeats.
    anamnesis_key = norm(anamnesis)[:180]
    title_key = norm(title)
    return "||".join(
        [
            date or "",
            event_type or "",
            title_key,
            anamnesis_key,
            diagnosis_key,
            treatment_key,
            test_key,
        ]
    )


def extract_rhs_or_self(line: str) -> str:
    if ":" in line:
        return line.split(":", 1)[1].strip() or line.strip()
    return line.strip()


def append_problem_and_reminder_events(draft: MedicalRecordDraft, *, allow_derived: bool = True) -> None:
    if not allow_derived:
        return
    base_events = [event for event in draft.timeline[:MAX_TIMELINE_EVENTS] if event.date and _is_clinical_event(event)]
    derived_events: list[TimelineEvent] = []

    diagnosis_mentions: dict[str, int] = {}
    for event in base_events:
        for diagnosis in event.diagnoses:
            diagnosis_text = diagnosis.text[:100].strip()
            if diagnosis_text:
                diagnosis_mentions[diagnosis_text] = diagnosis_mentions.get(diagnosis_text, 0) + 1

    for idx, (diagnosis_text, count) in enumerate(diagnosis_mentions.items(), start=1):
        if count <= 0:
            continue
        status_tag = "recurrent" if count > 1 else "resolved" if any(is_past_date(e.date) for e in base_events) else "active"
        derived_events.append(
            TimelineEvent(
                event_id=f"evt_problem_{idx:03d}",
                event_type="problem",
                date=next((e.date for e in base_events if e.date), None),
                title=f"Problem: {diagnosis_text}",
                anamnesis=f"Derived problem event ({status_tag}) from diagnosis mentions.",
                assessment=[status_tag],
                diagnoses=[Diagnosis(text=diagnosis_text, status="suspected")],
                source={"document_id": draft.source_documents[0].document_id},
                status="approved",
            )
        )

    for idx, event in enumerate(base_events[:5], start=1):
        event_text = " ".join([event.title or "", event.anamnesis or "", " ".join(d.text for d in event.diagnoses)]).lower()
        label = None
        if best_fuzzy_ratio(event_text, ("vaccine", "vacuna", "vaccination", "booster")) >= 84:
            label = "Follow-up vaccination review"
        elif best_fuzzy_ratio(event_text, ("lab", "analitica", "analítica", "test")) >= 86:
            label = "Review laboratory follow-up"
        elif best_fuzzy_ratio(event_text, ("checkup", "control", "revisión", "revision")) >= 86:
            label = "Schedule clinical checkup"
        if not label:
            continue
        reminder_state = "done" if is_past_date(event.date) else "pending"
        derived_events.append(
            TimelineEvent(
                event_id=f"evt_reminder_{idx:03d}",
                event_type="reminder",
                date=event.date,
                title=label,
                anamnesis=f"Derived reminder event ({reminder_state}).",
                assessment=[reminder_state],
                source={"document_id": draft.source_documents[0].document_id},
                status="approved",
            )
        )

    if derived_events:
        draft.timeline.extend(derived_events)


def _extract_clinical_section(lines: list[str]) -> list[str]:
    start_idx = 0
    for idx, line in enumerate(lines):
        lowered = line.lower()
        if "clinical chronology" in lowered or "clinical history" in lowered or re.match(r"^event\s*\d+", lowered):
            start_idx = idx
            break
    section = lines[start_idx:]

    # Stop at legal/disclaimer-like tails that are outside event data.
    stop_markers = ("data integrity", "legal disclaimer", "technical metadata")
    for idx, line in enumerate(section):
        if any(marker in line.lower() for marker in stop_markers):
            return section[:idx]
    return section


def _split_explicit_event_blocks(lines: list[str]) -> list[list[str]]:
    blocks: list[list[str]] = []
    current: list[str] = []
    event_header_re = re.compile(r"^event\s*\d+[:\-\s]", flags=re.IGNORECASE)
    for line in lines:
        if event_header_re.match(line):
            if current:
                blocks.append(current)
                current = []
            current.append(line)
            continue
        if current:
            current.append(line)
    if current:
        blocks.append(current)
    return blocks


def has_explicit_event_blocks(raw_text: str) -> bool:
    lines = clean_lines(raw_text)
    if not lines:
        return False
    scoped_lines = _extract_clinical_section(lines)
    return len(_split_explicit_event_blocks(scoped_lines)) > 0


def _is_clinical_event(event: TimelineEvent) -> bool:
    text = " ".join([event.title or "", event.anamnesis or ""]).lower()
    # Exclude obvious demographic/administrative-only captures.
    noise_markers = ("residential address", "owner information", "patient biographical", "new patient registration")
    return not any(marker in text for marker in noise_markers)


def is_past_date(value: str | None) -> bool:
    if not value:
        return False
    try:
        date_value = datetime.fromisoformat(value).date()
    except ValueError:
        return False
    return date_value < datetime.now(timezone.utc).date()


def infer_timeline_event_status(event: TimelineEvent) -> str:
    required_values = [event.event_id, event.event_type, event.date, event.title]
    has_required = all(value not in (None, "") for value in required_values)
    return "approved" if has_required else "needs_review"
