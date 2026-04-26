import json
from pathlib import Path
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient
from jsonschema import validate
from pydantic import ValidationError

from app.document_processing.models import DocumentProcessingResult, ParsingMetadata
from app.main import app
from app.schemas.medical_record import MedicalRecordDraft


client = TestClient(app)


def test_upload_document_returns_basic_metadata() -> None:
    payload = b"Patient: Luna\nSpecies: Canine\n"
    response = client.post(
        "/api/v1/documents/upload",
        files={"file": ("record.txt", payload, "text/plain")},
    )

    assert response.status_code == 200
    assert response.json() == {
        "filename": "record.txt",
        "content_type": "text/plain",
        "size_bytes": len(payload),
        "text_preview": payload.decode("utf-8"),
    }


def test_upload_document_rejects_empty_file() -> None:
    response = client.post(
        "/api/v1/documents/upload",
        files={"file": ("empty.txt", b"", "text/plain")},
    )

    assert response.status_code == 400
    assert response.json() == {
        "error": {
            "code": "EMPTY_FILE",
            "message": "Uploaded file is empty.",
        }
    }


def test_upload_document_requires_file_parameter() -> None:
    response = client.post("/api/v1/documents/upload")

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def _successful_processing_result(markdown: str = "## Parsed veterinary note\n\nPatient stable.") -> DocumentProcessingResult:
    return DocumentProcessingResult(
        structured_text_markdown=markdown,
        parsing_metadata=ParsingMetadata(
            engine="gatekeeper",
            extraction_method="fast_path",
            latency_ms=42,
            extracted_char_count=len(markdown),
            meaningful_text=True,
            integrity_score=1.0,
            reason=None,
        ),
    )


def _failed_processing_result() -> DocumentProcessingResult:
    return DocumentProcessingResult(
        structured_text_markdown="",
        parsing_metadata=ParsingMetadata(
            engine="gatekeeper",
            extraction_method="tesseract_fallback",
            latency_ms=420,
            extracted_char_count=0,
            meaningful_text=False,
            integrity_score=0.0,
            reason="LOW_QUALITY_EXTRACTION",
        ),
    )


def test_scan_document_returns_mapped_medical_record_and_parsing_metadata() -> None:
    with patch("app.api.routes.documents.get_document_processor") as mocked_get_processor:
        mock_processor = AsyncMock()
        mock_processor.process.return_value = _successful_processing_result()
        mocked_get_processor.return_value = mock_processor

        response = client.post(
            "/api/v1/documents/scan",
            files={"file": ("record.txt", b"Patient text content", "text/plain")},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["medical_record"]["source_documents"][0]["raw_text"].startswith("## Parsed veterinary note")
    assert payload["parsing_metadata"]["engine"] == "gatekeeper"
    assert payload["parsing_metadata"]["extraction_method"] == "fast_path"
    assert payload["parsing_metadata"]["latency_ms"] == 42
    assert payload["parsing_metadata"]["meaningful_text"] is True
    assert payload["parsing_metadata"]["total_fields_count"] == 12
    assert payload["parsing_metadata"]["mapped_fields_count"] == 1
    assert payload["parsing_metadata"]["mapping_coverage_pct"] == 8.33
    assert payload["medical_record"]["review"]["status"] == "automatically_approved"
    assert len(payload["medical_record"]["timeline"]) == 1
    assert payload["processor_version"] is None
    assert payload["warnings"] == []
    assert payload["timings_ms"] is None


def test_scan_document_prefills_basic_patient_fields_from_raw_text() -> None:
    markdown = """MASCOTA: NACIMIENTO
PACIENTE: KAI
FECHA DE NACIMIENTO: 01/02/2019
RAZA: yorkshire
SEXO: Macho
PESO: 12.4
CHIP: 00023152359
CANINO
"""
    with patch("app.api.routes.documents.get_document_processor") as mocked_get_processor:
        mock_processor = AsyncMock()
        mock_processor.process.return_value = _successful_processing_result(markdown=markdown)
        mocked_get_processor.return_value = mock_processor

        response = client.post(
            "/api/v1/documents/scan",
            files={"file": ("record.txt", markdown.encode("utf-8"), "text/plain")},
        )

    assert response.status_code == 200
    patient = response.json()["medical_record"]["patient"]
    assert patient["name"]["value"] == "KAI"
    assert patient["name"]["value"] != "NACIMIENTO"
    assert patient["birth_date"]["value"] == "2019-02-01"
    assert patient["breed"]["value"] == "yorkshire"
    assert patient["sex"]["value"] == "male"
    assert patient["chip_id"]["value"] == "00023152359"
    assert patient["weight_kg"]["value"] == "12.4"
    assert patient["species"]["value"] == "dog"
    parsing_metadata = response.json()["parsing_metadata"]
    assert parsing_metadata["total_fields_count"] == 12
    assert parsing_metadata["mapped_fields_count"] == 8
    assert parsing_metadata["mapping_coverage_pct"] == 66.67


def test_scan_document_extracts_timeline_events_from_raw_text() -> None:
    markdown = """15/03/2026 Consulta general
Diagnostico: Dermatitis leve
Tratamiento: Champu medicado semanal
Prueba: Hemograma de control
"""
    with patch("app.api.routes.documents.get_document_processor") as mocked_get_processor:
        mock_processor = AsyncMock()
        mock_processor.process.return_value = _successful_processing_result(markdown=markdown)
        mocked_get_processor.return_value = mock_processor

        response = client.post(
            "/api/v1/documents/scan",
            files={"file": ("record.txt", markdown.encode("utf-8"), "text/plain")},
        )

    assert response.status_code == 200
    payload = response.json()
    timeline = payload["medical_record"]["timeline"]
    assert len(timeline) >= 1
    assert timeline[0]["date"] == "2026-03-15"
    assert timeline[0]["diagnoses"][0]["text"] == "Dermatitis leve"
    assert timeline[0]["treatments"][0]["medication"] == "Champu medicado semanal"
    assert timeline[0]["tests"][0]["test_name"] == "Hemograma de control"
    assert any(event["event_type"] == "problem" for event in timeline)


def test_scan_document_derives_problem_events_when_mentioned_multiple_times() -> None:
    markdown = """10/01/2024 Consulta
Diagnostico: Otitis externa
02/02/2024 Revision
Diagnostico: Otitis externa
"""
    with patch("app.api.routes.documents.get_document_processor") as mocked_get_processor:
        mock_processor = AsyncMock()
        mock_processor.process.return_value = _successful_processing_result(markdown=markdown)
        mocked_get_processor.return_value = mock_processor

        response = client.post(
            "/api/v1/documents/scan",
            files={"file": ("record.txt", markdown.encode("utf-8"), "text/plain")},
        )

    assert response.status_code == 200
    timeline = response.json()["medical_record"]["timeline"]
    problem_events = [event for event in timeline if event["event_type"] == "problem"]
    assert len(problem_events) >= 1
    assert "Otitis externa" in (problem_events[0]["title"] or "")
    assert "recurrent" in (problem_events[0]["assessment"] or [])


def test_scan_document_derives_reminder_events_from_timeline() -> None:
    markdown = """10/01/2024 Vacuna anual
Diagnostico: Revision preventiva
"""
    with patch("app.api.routes.documents.get_document_processor") as mocked_get_processor:
        mock_processor = AsyncMock()
        mock_processor.process.return_value = _successful_processing_result(markdown=markdown)
        mocked_get_processor.return_value = mock_processor

        response = client.post(
            "/api/v1/documents/scan",
            files={"file": ("record.txt", markdown.encode("utf-8"), "text/plain")},
        )

    assert response.status_code == 200
    timeline = response.json()["medical_record"]["timeline"]
    reminder_events = [event for event in timeline if event["event_type"] == "reminder"]
    assert len(reminder_events) >= 1
    assert "done" in (reminder_events[0]["assessment"] or [])


def test_scan_document_maps_english_labeled_happy_path_fields() -> None:
    markdown = """owner_name: Sergio Martinez
owner_contact: Tel: +34 600 000 000 | Email: sergio.mtz@vet-exotics-example.com
pet_name: Pico
chip_id: AV9900112233
species: bird (Psittacus erithacus)
breed: Congo African Grey Parrot
date_of_birth: 2021-05-12 (3 years old)
sex: male
EVENT_01: visit
date: 2024-04-10
diagnosis: Dermatitis localizada por estrés ambiental y picaje conductual.
treatment: Cambio inmediato a dieta de pellets.
"""
    with patch("app.api.routes.documents.get_document_processor") as mocked_get_processor:
        mock_processor = AsyncMock()
        mock_processor.process.return_value = _successful_processing_result(markdown=markdown)
        mocked_get_processor.return_value = mock_processor

        response = client.post(
            "/api/v1/documents/scan",
            files={"file": ("bird.docx", markdown.encode("utf-8"), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
        )

    assert response.status_code == 200
    payload = response.json()
    patient = payload["medical_record"]["patient"]
    owner = payload["medical_record"]["owner"]
    assert patient["name"]["value"] == "Pico"
    assert patient["species"]["value"] == "bird"
    assert patient["breed"]["value"] == "Congo African Grey Parrot"
    assert patient["chip_id"]["value"] == "AV9900112233"
    assert patient["birth_date"]["value"] == "2021-05-12"
    assert patient["sex"]["value"] == "male"
    assert patient["weight_kg"]["value"] == "0.41"
    assert owner["name"]["value"] == "Sergio"
    assert owner["surname"]["value"] == "Martinez"
    assert owner["phone_number"]["value"] == "+34 600 000 000"
    assert owner["email"]["value"] == "sergio.mtz@vet-exotics-example.com"
    parsing_metadata = payload["parsing_metadata"]
    assert parsing_metadata["mapped_fields_count"] >= 12
    assert parsing_metadata["mapping_coverage_pct"] >= 85


def test_scan_document_is_valid_medical_record_schema() -> None:
    with patch("app.api.routes.documents.get_document_processor") as mocked_get_processor:
        mock_processor = AsyncMock()
        mock_processor.process.return_value = _successful_processing_result()
        mocked_get_processor.return_value = mock_processor

        response = client.post(
            "/api/v1/documents/scan",
            files={"file": ("record.pdf", b"%PDF-1.4 demo", "application/pdf")},
        )

    assert response.status_code == 200

    try:
        MedicalRecordDraft.model_validate(response.json()["medical_record"])
    except ValidationError as error:  # pragma: no cover - assertion failure path
        raise AssertionError(f"Scan payload does not match MedicalRecordDraft schema: {error}") from error


def test_scan_document_response_matches_shared_json_schema_contract() -> None:
    with patch("app.api.routes.documents.get_document_processor") as mocked_get_processor:
        mock_processor = AsyncMock()
        mock_processor.process.return_value = _successful_processing_result()
        mocked_get_processor.return_value = mock_processor

        response = client.post(
            "/api/v1/documents/scan",
            files={"file": ("record.docx", b"PK\x03\x04 demo", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
        )
        payload = response.json()

    schema_path = Path(__file__).resolve().parents[2] / "contracts" / "medical_record.schema.json"
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    validate(instance=payload, schema=schema)
    assert payload["parsing_metadata"]["integrity_score"] == 1.0


def test_scan_document_returns_error_when_parsing_integrity_is_low() -> None:
    with patch("app.api.routes.documents.get_document_processor") as mocked_get_processor:
        mock_processor = AsyncMock()
        mock_processor.process.return_value = _failed_processing_result()
        mocked_get_processor.return_value = mock_processor

        response = client.post(
            "/api/v1/documents/scan",
            files={"file": ("scanned.pdf", b"%PDF-1.4 scanned", "application/pdf")},
        )

    assert response.status_code == 422
    assert response.json() == {
        "error": {
            "code": "PARSING_INTEGRITY_LOW",
            "message": "Document parsing quality is too low for reliable ingestion.",
        }
    }


def test_scan_document_allows_cors_preflight_from_local_frontend() -> None:
    response = client.options(
        "/api/v1/documents/scan",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
