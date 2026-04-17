from __future__ import annotations

import os

from fastapi import UploadFile

from app.core.exceptions import AppError
from app.document_processing.base import DocumentProcessor
from app.document_processing.gatekeeper_processor import GatekeeperProcessor


def get_document_processor(_: UploadFile | None = None) -> DocumentProcessor:
    """Return the configured document processor implementation.

    Today the only supported engine is `gatekeeper`, but this abstraction is where
    we will plug in other engines later without changing the API contract.
    """

    engine = os.getenv("DOCUMENT_PROCESSOR", "gatekeeper").strip().lower()

    if engine == "gatekeeper":
        return GatekeeperProcessor()

    raise AppError(
        status_code=400,
        code="UNSUPPORTED_DOCUMENT_PROCESSOR",
        message=f"Unsupported DOCUMENT_PROCESSOR='{engine}'.",
    )

