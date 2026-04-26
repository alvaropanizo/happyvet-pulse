#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.document_processing.mapper_key_value import extract_from_parsed_with_provenance, parse_key_value_lines
from app.document_processing.medical_record_mapper import (
    calculate_confident_field_coverage,
    calculate_model_mapping_coverage,
    map_markdown_to_medical_record,
)
from app.document_processing.models import DocumentProcessingResult, ParsingMetadata


FIELD_ALIAS_KEYS = {
    "patient.name": "pet_name",
    "patient.species": "species",
    "patient.breed": "breed",
    "patient.sex": "sex",
    "patient.birth_date": "birth_date",
    "patient.chip_id": "chip_id",
    "patient.weight_kg": "weight_kg",
    "owner.name": "owner_name",
    "owner.surname": "owner_surname",
    "owner.phone_number": "owner_phone",
    "owner.email": "owner_email",
    "owner.address": "address",
}

PROFILES = {
    "cat": {
        "filename": "cat.pdf",
        "content_type": "application/pdf",
        "markdown": """name=Mochi
owner_name=Carla
owner_surname=Vance
species=cat
breed=British Shorthair
sex: female (Intact)
Date of Birth: 2026-04-10
chip_id=CAT99001122
weight_kg=4.2
owner_email=carla@example.com
address=Street 1, Madrid
owner_phone=+34 600 111 222
""",
    },
    "dog": {
        "filename": "dog.pdf",
        "content_type": "application/pdf",
        "markdown": """patient_name: Nala
owner_name: Sergio
owner_surname: Martinez
species: dog
breed: Labrador
sex: male
date_of_birth: 2020-02-01
chip_id: DOG12345678
weight: 22 kg
owner_email: sergio@example.com
address: Calle Luna 12, Sevilla
owner_phone: +34 600 222 333
""",
    },
    "bird": {
        "filename": "bird.docx",
        "content_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "markdown": """pet_name=Pico
owner_name=Sergio
owner_surname=Martinez
species=bird
breed=Congo African Grey
date_of_birth=2021-05-12
sex=male
chip_id=AV9900112233
weight=410 g
owner_email=sergio@example.com
address=Avenida Verde 8, Valencia
owner_phone=+34 600 333 444
""",
    },
    "monkey": {
        "filename": "monkey.png",
        "content_type": "image/png",
        "markdown": """pet_name=Bongo
owner_name=Ana
owner_surname=Lopez
species=monkey
breed=Capuchin
sex=male
date_of_birth=2018-09-07
chip_id=MK99001122
weight=3.8 kg
owner_email=ana@example.com
address=Rua Selva 4, Lisboa
owner_phone=+351 912 000 111
""",
    },
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Report scalar-field provenance for mapper profile fixtures.")
    parser.add_argument(
        "--profiles",
        default="cat,dog,bird,monkey",
        help="Comma-separated profiles to run (default: cat,dog,bird,monkey).",
    )
    return parser.parse_args()


def _build_processing(markdown: str) -> DocumentProcessingResult:
    return DocumentProcessingResult(
        structured_text_markdown=markdown,
        parsing_metadata=ParsingMetadata(
            engine="report",
            extraction_method="fast_path",
            latency_ms=1,
            extracted_char_count=len(markdown),
            meaningful_text=True,
            integrity_score=1.0,
        ),
    )


class _UploadStub:
    def __init__(self, filename: str, content_type: str):
        self.filename = filename
        self.content_type = content_type


def _build_upload(filename: str, content_type: str) -> _UploadStub:
    return _UploadStub(filename=filename, content_type=content_type)


def _profile_report(profile_name: str) -> dict:
    profile = PROFILES[profile_name]
    markdown = profile["markdown"]
    pairs = parse_key_value_lines(markdown)

    upload = _build_upload(profile["filename"], profile["content_type"])
    processing = _build_processing(markdown)
    draft = map_markdown_to_medical_record(file=upload, processing=processing)
    mapped_count, total_count, mapping_pct = calculate_model_mapping_coverage(draft)
    confident_count, confident_total, confident_pct = calculate_confident_field_coverage(draft)

    provenance = {}
    for field_path, alias_key in FIELD_ALIAS_KEYS.items():
        item = extract_from_parsed_with_provenance(pairs, alias_key)
        if item["match_type"] == "unmapped":
            fallback_match = next(
                (
                    ("fallback", idx)
                    for idx, line in enumerate(markdown.splitlines())
                    if alias_key.replace("_", " ") in line.lower() or alias_key in line.lower()
                ),
                None,
            )
            if fallback_match:
                item["match_type"] = fallback_match[0]
                item["line_index"] = fallback_match[1]
        provenance[field_path] = item

    field_values = {
        "patient.name": draft.patient.name,
        "patient.species": draft.patient.species,
        "patient.breed": draft.patient.breed,
        "patient.sex": draft.patient.sex,
        "patient.birth_date": draft.patient.birth_date,
        "patient.chip_id": draft.patient.chip_id,
        "patient.weight_kg": draft.patient.weight_kg,
        "owner.name": draft.owner.name,
        "owner.surname": draft.owner.surname,
        "owner.phone_number": draft.owner.phone_number,
        "owner.email": draft.owner.email,
        "owner.address": draft.owner.address,
    }

    total_fields = len(field_values)
    approved_fields_count = 0
    filled_low_confidence_count = 0
    empty_fields_count = 0
    total_confidence = 0.0
    filled_fields_count = 0
    field_confidence = {}
    for path, field in field_values.items():
        value = getattr(field, "value", None) if field is not None else None
        confidence = float(getattr(field, "confidence", 0.0) or 0.0) if field is not None else 0.0
        field_confidence[path] = confidence
        if value not in (None, ""):
            filled_fields_count += 1
            total_confidence += confidence
            if confidence > 0.8:
                approved_fields_count += 1
            else:
                filled_low_confidence_count += 1
        else:
            empty_fields_count += 1
    average_confidence_filled = round(total_confidence / filled_fields_count, 4) if filled_fields_count else 0.0
    confidence_over_total_fields = round(total_confidence / total_fields, 4) if total_fields else 0.0

    return {
        "profile": profile_name,
        "file": profile["filename"],
        "metrics": {
            "mapped_fields_count": mapped_count,
            "total_fields_count": total_count,
            "mapping_coverage_pct": mapping_pct,
            "confident_fields_count": confident_count,
            "confident_total_fields_count": confident_total,
            "confident_coverage_pct": confident_pct,
            "approved_over_08_fields_count": approved_fields_count,
            "filled_under_or_equal_08_fields_count": filled_low_confidence_count,
            "filled_fields_count": filled_fields_count,
            "empty_fields_count": empty_fields_count,
            "total_scalar_fields_count": total_fields,
            "average_confidence_filled": average_confidence_filled,
            "total_confidence": round(total_confidence, 4),
            "confidence_over_total_fields": confidence_over_total_fields,
        },
        "field_confidence": field_confidence,
        "provenance": provenance,
    }


def main() -> int:
    args = parse_args()
    selected = [name.strip() for name in args.profiles.split(",") if name.strip()]
    unknown = [name for name in selected if name not in PROFILES]
    if unknown:
        print(json.dumps({"error": f"Unknown profiles: {', '.join(unknown)}"}, indent=2))
        return 1

    report = {"profiles": [_profile_report(name) for name in selected]}
    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
