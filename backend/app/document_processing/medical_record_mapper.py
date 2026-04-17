from __future__ import annotations

import hashlib
import re
from datetime import UTC, datetime

from fastapi import UploadFile

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
    """Best-effort field extraction from raw text to improve immediate UI readability."""
    if not raw_text.strip():
        return

    name = _extract_value(raw_text, [r"(?:MASCOTA|PET)\s*[:\-]?\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ ]{1,40})"])
    species = _extract_value(raw_text, [r"\b(CANINA?|FELINA?|CANINO|FELINO|DOG|CAT)\b"])
    breed = _extract_value(raw_text, [r"(?:RAZA|BREED)\s*[:\-]?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ ]{2,50})"])
    sex = _extract_value(raw_text, [r"(?:SEXO|SEX)\s*[:\-]?\s*(MACHO|HEMBRA|MALE|FEMALE)"])
    chip = _extract_value(raw_text, [r"(?:CHIP|MICROCHIP)\s*[:\-]?\s*([0-9]{8,20})"])
    weight = _extract_value(raw_text, [r"(?:PESO|WEIGHT)\s*[:\-]?\s*([0-9]+(?:[.,][0-9]+)?)"])

    _assign_field(draft.patient.name, name, 0.62)
    _assign_field(draft.patient.species, species, 0.7)
    _assign_field(draft.patient.breed, breed, 0.6)
    _assign_field(draft.patient.sex, sex, 0.72)
    _assign_field(draft.patient.chip_id, chip, 0.82)
    _assign_field(draft.patient.weight_kg, weight.replace(",", ".") if weight else None, 0.76)


def _extract_value(text: str, patterns: list[str]) -> str | None:
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            value = match.group(1).strip()
            return re.sub(r"\s{2,}", " ", value)
    return None


def _assign_field(field, value: str | None, confidence: float) -> None:
    if value:
        field.value = value
        field.confidence = confidence

