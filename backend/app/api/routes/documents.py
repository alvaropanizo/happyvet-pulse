from datetime import UTC, datetime

from fastapi import APIRouter, File, UploadFile

from app.core.exceptions import AppError
from app.core.logging import get_logger
from app.schemas.medical_record import MedicalRecordDraft


logger = get_logger(__name__)

router = APIRouter(prefix="/api/v1/documents", tags=["documents"])


def _build_mock_medical_record() -> MedicalRecordDraft:
    return MedicalRecordDraft(
        record_id="rec_scan_001",
        source_documents=[
            {
                "document_id": "doc_scan_001",
                "filename": "scanned_record.pdf",
                "source_type": "pdf",
                "language": "es",
                "uploaded_at": datetime.now(UTC),
                "raw_text": "Mock scanned veterinary document text.",
                "attachments": [
                    {
                        "attachment_id": "att_scan_001",
                        "kind": "lab_report",
                        "name": "Analisis de heces",
                    }
                ],
            }
        ],
        patient={
            "name": {"value": "ALYA", "confidence": 0.99, "edited": False},
            "species": {"value": "Canina", "confidence": 0.98, "edited": False},
            "breed": {"value": "Yorkshire Terrier", "confidence": 0.97, "edited": False},
            "sex": {"value": "Hembra", "confidence": 0.99, "edited": False},
            "birth_date": {"value": "2018-07-05", "confidence": 0.92, "edited": False},
            "chip_id": {"value": "00023035139", "confidence": 0.9, "edited": False},
            "weight_kg": {"value": "3.2", "confidence": 0.7, "edited": True},
        },
        timeline=[
            {
                "event_id": "evt_scan_001",
                "date": "2024-07-17",
                "event_type": "vaccination",
                "clinic": "Costa Azahar",
                "title": "Visita vacunacion/desparasitacion",
                "anamnesis": "Acude para poner vacuna tetravalente.",
                "diagnoses": [{"text": "Seguimiento gastroenteritis", "status": "suspected"}],
                "treatments": [
                    {
                        "medication": "Vacuna tetravalente canina",
                        "dose": "1 dosis",
                        "frequency": "unica",
                        "duration": "1 dia",
                    }
                ],
            }
        ],
        problem_list=[
            {
                "problem_id": "prb_scan_001",
                "name": "Gastroenteritis hemorragica recurrente",
                "status": "recurrent",
                "first_seen": "2024-03-16",
                "last_seen": "2024-06-10",
            }
        ],
        reminders=[
            {
                "reminder_id": "rem_scan_001",
                "type": "vaccination",
                "label": "Vacunacion tetravalente canina",
                "due_date": "2025-07-17",
                "status": "pending",
            }
        ],
        review={
            "status": "in_review",
            "edited_fields": ["patient.weight_kg"],
            "last_editor": "scan_service",
            "updated_at": datetime.now(UTC),
        },
    )


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)) -> dict[str, str | int]:
    """Receive a document and return lightweight metadata."""
    logger.info("Received upload request for filename=%s", file.filename or "unknown")
    content = await file.read()

    if not content:
        logger.warning("Rejected empty upload for filename=%s", file.filename or "unknown")
        raise AppError(
            status_code=400,
            code="EMPTY_FILE",
            message="Uploaded file is empty.",
        )

    # Simple processing for milestone validation:
    # decode a short UTF-8 preview when possible.
    text_preview = content[:200].decode("utf-8", errors="ignore")
    logger.info(
        "Processed uploaded file filename=%s size_bytes=%s",
        file.filename or "unknown",
        len(content),
    )

    return {
        "filename": file.filename or "unknown",
        "content_type": file.content_type or "application/octet-stream",
        "size_bytes": len(content),
        "text_preview": text_preview,
    }


@router.post("/scan")
async def scan_document_mock() -> MedicalRecordDraft:
    """Return a mocked structured medical record for UI scan validation."""
    logger.info("Triggered mock scan endpoint")
    return _build_mock_medical_record()
