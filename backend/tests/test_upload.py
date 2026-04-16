import json
from pathlib import Path

from fastapi.testclient import TestClient
from jsonschema import validate
from pydantic import ValidationError

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


def test_scan_document_returns_mock_medical_record() -> None:
    response = client.post("/api/v1/documents/scan")

    assert response.status_code == 200
    payload = response.json()
    assert payload["record_id"] == "rec_scan_001"
    assert payload["patient"]["name"]["value"] == "ALYA"
    assert payload["review"]["status"] == "in_review"


def test_scan_document_is_valid_medical_record_schema() -> None:
    response = client.post("/api/v1/documents/scan")

    assert response.status_code == 200

    try:
        MedicalRecordDraft.model_validate(response.json())
    except ValidationError as error:  # pragma: no cover - assertion failure path
        raise AssertionError(f"Scan payload does not match MedicalRecordDraft schema: {error}") from error


def test_scan_document_response_matches_shared_json_schema_contract() -> None:
    response = client.post("/api/v1/documents/scan")
    payload = response.json()

    schema_path = Path(__file__).resolve().parents[2] / "contracts" / "medical_record.schema.json"
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    validate(instance=payload, schema=schema)


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
