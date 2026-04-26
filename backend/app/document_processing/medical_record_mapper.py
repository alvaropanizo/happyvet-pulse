from __future__ import annotations

import hashlib
from datetime import UTC, datetime

from fastapi import UploadFile

from app.document_processing.mapper_coverage import (
    calculate_confident_field_coverage,
    calculate_model_mapping_coverage,
)
from app.document_processing.mapper_key_value import parse_key_value_lines
from app.document_processing.mapper_scalar_rules import (
    SCALAR_RULES,
    extract_demographic_block,
    extract_birth_date,
    extract_chip_id,
    extract_owner_phone,
    extract_scalar_with_rule,
    extract_weight_kg,
)
from app.document_processing.mapper_timeline import (
    append_problem_and_reminder_events,
    has_explicit_event_blocks,
    map_timeline_events,
)
from app.document_processing.models import DocumentProcessingResult
from app.schemas.medical_record import MedicalRecordDraft, SourceDocument


def _stable_record_id(filename: str | None) -> str:
    seed = filename or "scan_document"
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()[:10]
    return f"rec_scan_{digest}"


def _source_type_from_upload(file: UploadFile) -> str:
    if file.content_type:
        # keep it short and stable (e.g., "application/pdf" -> "pdf")
        if file.content_type.endswith("/pdf"):
            return "pdf"
        if file.content_type.startswith("image/"):
            return file.content_type.split("/", 1)[1] or "image"
    if file.filename and "." in file.filename:
        return file.filename.rsplit(".", 1)[1].lower() or "unknown"
    return "unknown"


def map_markdown_to_medical_record(
    *,
    file: UploadFile,
    processing: DocumentProcessingResult,
) -> MedicalRecordDraft:
    """Map processor output into our standardized `MedicalRecordDraft` schema.

    For Milestone 4 we keep medical fields empty and store the extracted markdown
    in `source_documents[].raw_text` for the next LLM refinement step.
    """

    now = datetime.now(UTC)
    document_id_seed = f"{file.filename or 'document'}_{now.isoformat()}"
    document_id = hashlib.sha256(document_id_seed.encode("utf-8")).hexdigest()[:12]

    source_doc = SourceDocument(
        document_id=document_id,
        filename=file.filename or "uploaded_document",
        source_type=_source_type_from_upload(file),
        language=None,
        uploaded_at=now,
        raw_text=processing.structured_text_markdown,
    )

    draft = MedicalRecordDraft(
        record_id=_stable_record_id(file.filename),
        source_documents=[source_doc],
    )
    _apply_lightweight_structuring(draft=draft, raw_text=processing.structured_text_markdown)
    return draft


def _apply_lightweight_structuring(*, draft: MedicalRecordDraft, raw_text: str) -> None:
    if not raw_text.strip():
        return

    demographic_text = extract_demographic_block(raw_text)
    parsed_pairs = parse_key_value_lines(demographic_text)

    name, name_conf, _ = extract_scalar_with_rule(demographic_text, parsed_pairs, SCALAR_RULES["name"])
    species, species_raw_conf, _ = extract_scalar_with_rule(demographic_text, parsed_pairs, SCALAR_RULES["species_raw"])
    species = species or "other"
    breed, breed_conf, _ = extract_scalar_with_rule(demographic_text, parsed_pairs, SCALAR_RULES["breed"])
    sex, sex_raw_conf, sex_raw = extract_scalar_with_rule(demographic_text, parsed_pairs, SCALAR_RULES["sex"])

    birth_raw, birth_raw_conf, _ = extract_scalar_with_rule(demographic_text, parsed_pairs, SCALAR_RULES["birth_raw"])
    birth_date = extract_birth_date(birth_raw) if birth_raw else extract_birth_date(demographic_text)
    if not birth_date:
        birth_date = extract_birth_date(raw_text)
    birth_conf = 0.78 if birth_date else max(0.0, birth_raw_conf - 0.1)

    chip_raw, chip_raw_conf, _ = extract_scalar_with_rule(demographic_text, parsed_pairs, SCALAR_RULES["chip_raw"])
    chip = extract_chip_id(f"chip: {chip_raw}") if chip_raw else extract_chip_id(demographic_text)
    if not chip:
        chip = extract_chip_id(raw_text)
    chip_conf = 0.82 if chip else max(0.0, chip_raw_conf - 0.2)

    weight_raw, weight_raw_conf, _ = extract_scalar_with_rule(demographic_text, parsed_pairs, SCALAR_RULES["weight_raw"])
    weight = extract_weight_kg(f"weight: {weight_raw}") if weight_raw else extract_weight_kg(demographic_text)
    if not weight:
        weight = extract_weight_kg(raw_text)
    weight_conf = 0.76 if weight else max(0.0, weight_raw_conf - 0.15)

    owner_name, owner_name_conf, _ = extract_scalar_with_rule(demographic_text, parsed_pairs, SCALAR_RULES["owner_name"])
    owner_surname, owner_surname_conf, _ = extract_scalar_with_rule(demographic_text, parsed_pairs, SCALAR_RULES["owner_surname"])
    owner_email, owner_email_conf, _ = extract_scalar_with_rule(demographic_text, parsed_pairs, SCALAR_RULES["owner_email"])
    owner_address, owner_address_conf, _ = extract_scalar_with_rule(demographic_text, parsed_pairs, SCALAR_RULES["owner_address"])
    owner_phone_number = extract_owner_phone(demographic_text)
    if not owner_phone_number:
        owner_phone_number = extract_owner_phone(raw_text)
    owner_phone_conf = 0.61 if owner_phone_number else 0.0

    if owner_name and not owner_surname:
        parts = owner_name.split()
        if len(parts) >= 2:
            owner_name = parts[0]
            owner_surname = " ".join(parts[1:])
            owner_name_conf = max(owner_name_conf, 0.56)
            owner_surname_conf = max(owner_surname_conf, 0.56)

    _assign_field(draft.patient.name, name, min(0.95, max(name_conf, 0.0)))
    _assign_field(draft.patient.species, species, max(species_raw_conf, 0.86 if species else 0.0))
    _assign_field(draft.patient.breed, breed, min(0.9, max(breed_conf, 0.0)))
    sex_floor = 0.84 if sex and sex_raw else (0.72 if sex else 0.0)
    _assign_field(draft.patient.sex, sex, min(0.92, max(sex_raw_conf, sex_floor)))
    _assign_field(draft.patient.birth_date, birth_date, min(0.93, max(birth_conf, 0.0)))
    _assign_field(draft.patient.chip_id, chip, min(0.95, max(chip_conf, 0.0)))
    _assign_field(draft.patient.weight_kg, weight, min(0.9, max(weight_conf, 0.0)))
    _assign_field(draft.owner.name, owner_name, min(0.9, max(owner_name_conf, 0.0)))
    _assign_field(draft.owner.surname, owner_surname, min(0.9, max(owner_surname_conf, 0.0)))
    _assign_field(draft.owner.phone_number, owner_phone_number, min(0.92, max(owner_phone_conf, 0.0)))
    _assign_field(draft.owner.email, owner_email, min(0.92, max(owner_email_conf, 0.0)))
    if draft.owner.address is not None:
        _assign_field(draft.owner.address, owner_address, min(0.85, max(owner_address_conf, 0.0)))

    map_timeline_events(draft=draft, raw_text=raw_text, source_document_id=draft.source_documents[0].document_id)
    append_problem_and_reminder_events(
        draft,
        allow_derived=not has_explicit_event_blocks(raw_text),
    )


def _assign_field(field, value: str | None, confidence: float) -> None:
    if value:
        field.value = value
        field.confidence = confidence
        field.status = "automatically_approved" if confidence > 0.8 else "pending"
__all__ = [
    "map_markdown_to_medical_record",
    "calculate_model_mapping_coverage",
    "calculate_confident_field_coverage",
]

