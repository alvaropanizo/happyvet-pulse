from fastapi import APIRouter, File, Request, UploadFile

from app.core.exceptions import AppError
from app.core.logging import get_logger
from app.document_processing.factory import get_document_processor
from app.document_processing.medical_record_mapper import (
    calculate_confident_field_coverage,
    calculate_model_mapping_coverage,
    map_markdown_to_medical_record,
)


logger = get_logger(__name__)

router = APIRouter(prefix="/api/v1/documents", tags=["documents"])
MAX_UPLOAD_BYTES = 1024 * 1024 * 1024  # 1GB


def _validate_request_size_from_headers(request: Request) -> None:
    content_length = request.headers.get("content-length")
    if not content_length:
        return
    try:
        size_bytes = int(content_length)
    except (TypeError, ValueError):
        return
    if size_bytes > MAX_UPLOAD_BYTES:
        raise AppError(
            status_code=413,
            code="FILE_TOO_LARGE",
            message="File exceeds the 1GB upload limit.",
        )


@router.post("/upload")
async def upload_document(request: Request, file: UploadFile = File(...)) -> dict[str, str | int]:
    """Receive a document and return lightweight metadata."""
    _validate_request_size_from_headers(request)
    logger.info("Received upload request for filename=%s", file.filename or "unknown")
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise AppError(
            status_code=413,
            code="FILE_TOO_LARGE",
            message="File exceeds the 1GB upload limit.",
        )


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
async def scan_document(request: Request, file: UploadFile = File(...)) -> dict:
    """Parse uploaded document and map extracted text into medical record draft."""
    _validate_request_size_from_headers(request)
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
    if processing.parsing_metadata.integrity_score > 0.8:
        medical_record.review.status = "automatically_approved"
    mapped_count, total_count, coverage_pct = calculate_model_mapping_coverage(medical_record)
    confident_count, confident_total, confident_pct = calculate_confident_field_coverage(medical_record)
    processing.parsing_metadata.mapped_fields_count = mapped_count
    processing.parsing_metadata.total_fields_count = total_count
    processing.parsing_metadata.mapping_coverage_pct = coverage_pct
    processing.parsing_metadata.confident_fields_count = confident_count
    processing.parsing_metadata.confident_total_fields_count = confident_total
    processing.parsing_metadata.confident_coverage_pct = confident_pct
    return {
        "medical_record": medical_record.model_dump(mode="json"),
        "parsing_metadata": processing.parsing_metadata.model_dump(mode="json"),
        "processor_version": None,
        "warnings": [],
        "timings_ms": None,
    }
