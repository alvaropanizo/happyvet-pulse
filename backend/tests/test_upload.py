from fastapi.testclient import TestClient

from app.main import app


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
