from fastapi import APIRouter, File, UploadFile

from app.core.exceptions import AppError
from app.core.logging import get_logger


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
