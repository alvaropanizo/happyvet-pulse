from __future__ import annotations

from app.schemas.medical_record import MedicalRecordDraft


def scalar_fields(draft: MedicalRecordDraft):
    return [
        draft.patient.name,
        draft.patient.species,
        draft.patient.breed,
        draft.patient.sex,
        draft.patient.birth_date,
        draft.patient.chip_id,
        draft.patient.weight_kg,
        draft.owner.name,
        draft.owner.surname,
        draft.owner.phone_number,
        draft.owner.email,
    ]


def calculate_model_mapping_coverage(draft: MedicalRecordDraft) -> tuple[int, int, float]:
    mapped_scalar_count = sum(
        1
        for field in scalar_fields(draft)
        if field.confidence > 0 and field.value not in (None, "")
    )
    mapped_list_group_count = 1 if len(draft.timeline) >= 1 else 0
    mapped_count = mapped_scalar_count + mapped_list_group_count
    total_count = len(scalar_fields(draft)) + 1
    coverage_pct = round((mapped_count / total_count) * 100, 2) if total_count else 0.0
    return mapped_count, total_count, coverage_pct


def calculate_confident_field_coverage(draft: MedicalRecordDraft) -> tuple[int, int, float]:
    confident_count = sum(
        1
        for field in scalar_fields(draft)
        if field.value not in (None, "") and field.confidence > 0.8
    )
    total_count = len(scalar_fields(draft))
    confident_pct = round((confident_count / total_count) * 100, 2) if total_count else 0.0
    return confident_count, total_count, confident_pct
