from __future__ import annotations

from abc import ABC, abstractmethod

from fastapi import UploadFile

from app.document_processing.models import DocumentProcessingResult


class DocumentProcessor(ABC):
    """Swappable interface for document-to-structured-text processing."""

    @abstractmethod
    async def process(self, file: UploadFile) -> DocumentProcessingResult:
        """Extract structured text and parsing metadata from the uploaded file."""

