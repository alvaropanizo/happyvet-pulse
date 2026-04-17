from fastapi import APIRouter, File, UploadFile

from app.core.exceptions import AppError
from app.core.logging import get_logger
from app.document_processing.factory import get_document_processor
from app.document_processing.medical_record_mapper import map_markdown_to_medical_record


logger = get_logger(__name__)

router = APIRouter(prefix="/api/v1/documents", tags=["documents"])


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
async def scan_document(file: UploadFile = File(...)) -> dict:
    """Parse uploaded document and map extracted text into medical record draft."""
    logger.info("Triggered scan endpoint for filename=%s", file.filename or "unknown")

    processor = get_document_processor(file)
    processing = await processor.process(file)

    if not processing.parsing_metadata.meaningful_text:
        raise AppError(
            status_code=422,
            code="PARSING_INTEGRITY_LOW",
            message="Document parsing quality is too low for reliable ingestion.",
        )

    medical_record = map_markdown_to_medical_record(file=file, processing=processing)
    return {
        "medical_record": medical_record.model_dump(mode="json"),
        "parsing_metadata": processing.parsing_metadata.model_dump(mode="json"),
        "processor_version": None,
        "warnings": [],
        "timings_ms": None,
    }
