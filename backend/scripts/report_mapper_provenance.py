#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from urllib import request
import uuid

CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_ROOT = CURRENT_DIR.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.document_processing.mapper_key_value import extract_from_parsed_with_provenance, parse_key_value_lines


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
    "owner.email": "owner_email",
    "owner.address": "address",
}

DEFAULT_FIXTURES = ("cat.pdf", "dog.pdf", "bird.docx", "monkey.png")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Report scan metrics + field provenance for real fixture files.")
    parser.add_argument(
        "--fixtures-dir",
        default=str((BACKEND_ROOT.parent / "frontend" / "tests" / "e2e" / "fixtures").resolve()),
        help="Directory containing real fixture files.",
    )
    parser.add_argument(
        "--files",
        default="cat.pdf,dog.pdf,bird.docx,monkey.png",
        help="Comma-separated fixture filenames (default: cat.pdf,dog.pdf,bird.docx,monkey.png).",
    )
    parser.add_argument(
        "--api-base-url",
        default="http://127.0.0.1:8000",
        help="Backend API base URL (default: http://127.0.0.1:8000).",
    )
    return parser.parse_args()


def _scan_file(file_path: Path, api_base_url: str) -> dict:
    scan_url = f"{api_base_url.rstrip('/')}/api/v1/documents/scan"
    boundary = "----report-mapper-" + uuid.uuid4().hex
    file_bytes = file_path.read_bytes()
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{file_path.name}"\r\n'
        "Content-Type: application/octet-stream\r\n\r\n"
    ).encode("utf-8") + file_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")

    req = request.Request(
        scan_url,
        data=body,
        method="POST",
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    )
    with request.urlopen(req, timeout=180) as resp:
        payload = json.loads(resp.read().decode("utf-8", errors="replace"))
        if resp.getcode() != 200:
            raise RuntimeError(f"Scan failed for {file_path.name}: {json.dumps(payload)}")
        return payload


def _scalar_field_values(medical_record: dict) -> dict:
    patient = medical_record.get("patient", {})
    owner = medical_record.get("owner", {})
    return {
        "patient.name": patient.get("name", {}),
        "patient.species": patient.get("species", {}),
        "patient.breed": patient.get("breed", {}),
        "patient.sex": patient.get("sex", {}),
        "patient.birth_date": patient.get("birth_date", {}),
        "patient.chip_id": patient.get("chip_id", {}),
        "patient.weight_kg": patient.get("weight_kg", {}),
        "owner.name": owner.get("name", {}),
        "owner.surname": owner.get("surname", {}),
        "owner.email": owner.get("email", {}),
        "owner.address": owner.get("address", {}) or {},
    }


def _file_report(file_path: Path, api_base_url: str) -> dict:
    payload = _scan_file(file_path, api_base_url)
    medical_record = payload.get("medical_record", {})
    parsing_metadata = payload.get("parsing_metadata", {})
    source_documents = medical_record.get("source_documents", [])
    raw_text = source_documents[0].get("raw_text", "") if source_documents else ""
    pairs = parse_key_value_lines(raw_text)
    explicit_event_markers = len(re.findall(r"(?im)^\s*event\s*\d+[:\-\s]", raw_text))
    dated_event_markers = len(re.findall(r"(?im)^\s*(date|fecha)\s*[:\-]", raw_text))
    parsed_timeline_count = len(medical_record.get("timeline", []))

    provenance = {}
    for field_path, alias_key in FIELD_ALIAS_KEYS.items():
        item = extract_from_parsed_with_provenance(pairs, alias_key)
        if item["match_type"] == "unmapped":
            fallback_match = next(
                (
                    ("fallback", idx)
                    for idx, line in enumerate(raw_text.splitlines())
                    if alias_key.replace("_", " ") in line.lower() or alias_key in line.lower()
                ),
                None,
            )
            if fallback_match:
                item["match_type"] = fallback_match[0]
                item["line_index"] = fallback_match[1]
        provenance[field_path] = item

    scalar_fields = _scalar_field_values(medical_record)
    confidences = [float(field.get("confidence", 0.0) or 0.0) for field in scalar_fields.values() if field.get("value") not in (None, "")]
    parsed_to_model_count = sum(1 for field in scalar_fields.values() if field.get("value") not in (None, ""))
    total_fields = len(scalar_fields)
    avg_confidence = round(sum(confidences) / len(confidences), 4) if confidences else 0.0
    total_confidence = round(sum(confidences), 4)
    confidence_over_total_fields = round(total_confidence / total_fields, 4) if total_fields else 0.0

    return {
        "file": file_path.name,
        "metrics": {
            "extraction": parsing_metadata,
            "timeline_parsed_events_count": parsed_timeline_count,
            "timeline_explicit_event_markers_count": explicit_event_markers,
            "timeline_dated_markers_count": dated_event_markers,
            "parsed_to_model_fields_count": parsed_to_model_count,
            "total_scalar_fields_count": total_fields,
            "avg_confidence": avg_confidence,
            "total_confidence": total_confidence,
            "confidence_over_total_fields": confidence_over_total_fields,
            "mapping_coverage_pct": parsing_metadata.get("mapping_coverage_pct"),
            "confident_coverage_pct": parsing_metadata.get("confident_coverage_pct"),
        },
        "provenance": provenance,
        "key_field_values": {
            "patient.birth_date": scalar_fields["patient.birth_date"].get("value"),
            "patient.sex": scalar_fields["patient.sex"].get("value"),
            "patient.chip_id": scalar_fields["patient.chip_id"].get("value"),
        },
    }


def main() -> int:
    args = parse_args()
    fixtures_dir = Path(args.fixtures_dir).expanduser().resolve()
    selected = [name.strip() for name in args.files.split(",") if name.strip()]
    if not selected:
        selected = list(DEFAULT_FIXTURES)
    existing = [fixtures_dir / name for name in selected if (fixtures_dir / name).exists()]
    if not existing:
        print(json.dumps({"error": f"No fixture files found in {fixtures_dir}", "requested": selected}, indent=2))
        return 1

    report = {
        "fixtures_dir": str(fixtures_dir),
        "files": [item.name for item in existing],
        "reports": [_file_report(path, args.api_base_url) for path in existing],
    }
    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
