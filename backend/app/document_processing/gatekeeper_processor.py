from __future__ import annotations

from time import perf_counter

from fastapi import UploadFile

from app.document_processing.base import DocumentProcessor
from app.document_processing.extractors import (
    analyze_pdf_structure,
    extract_docx,
    extract_image_ocr,
    extract_pdf_ocr,
    extract_pdf_text_layer,
    extract_txt,
)
from app.document_processing.models import DocumentProcessingResult, ParsingMetadata
from app.document_processing.quality_gate import (
    ExtractionSignals,
    MIN_MEANINGFUL_CHARS,
    get_fidelity_signals,
    is_extraction_sufficient,
    is_fidelity_sufficient,
)


class GatekeeperProcessor(DocumentProcessor):
    ENGINE_NAME = "gatekeeper"

    async def process(self, file: UploadFile) -> DocumentProcessingResult:
        started = perf_counter()
        content = await file.read()

        if not content:
            return self._build_result(
                text="",
                extraction_method="fast_path",
                reason="EMPTY_FILE",
                latency_ms=self._elapsed_ms(started),
            )

        suffix = self._best_effort_suffix(file)

        if suffix == ".txt":
            source_text = content.decode("utf-8", errors="replace")
            extracted = extract_txt(content)
            return self._build_result_from_text(
                text=extracted,
                extraction_method="fast_path",
                latency_ms=self._elapsed_ms(started),
                fidelity_source_text=source_text,
            )

        if suffix == ".docx":
            extracted = extract_docx(content)
            return self._build_result_from_text(
                text=extracted,
                extraction_method="fast_path",
                latency_ms=self._elapsed_ms(started),
                fidelity_source_text=extracted,
            )

        if suffix == ".pdf":
            page_count, image_count, table_count = analyze_pdf_structure(content)
            signals = ExtractionSignals(page_count=page_count, image_count=image_count, table_count=table_count)
            fast_text = extract_pdf_text_layer(content)
            if is_extraction_sufficient(fast_text, signals):
                return self._build_result(
                    text=fast_text,
                    extraction_method="fast_path",
                    reason=None,
                    latency_ms=self._elapsed_ms(started),
                    signals=signals,
                )
            return self._build_result_from_text(
                text=extract_pdf_ocr(content),
                extraction_method="tesseract_fallback",
                latency_ms=self._elapsed_ms(started),
                signals=signals,
            )

        if suffix in {".jpg", ".jpeg", ".png", ".webp"}:
            return self._build_result_from_text(
                text=extract_image_ocr(content),
                extraction_method="tesseract_fallback",
                latency_ms=self._elapsed_ms(started),
                signals=ExtractionSignals(page_count=1, image_count=1, table_count=0),
            )

        return self._build_result(
            text="",
            extraction_method="fast_path",
            reason="UNSUPPORTED_FILE_TYPE",
            latency_ms=self._elapsed_ms(started),
        )

    def _build_result_from_text(
        self,
        *,
        text: str,
        extraction_method: str,
        latency_ms: int,
        signals: ExtractionSignals | None = None,
        fidelity_source_text: str | None = None,
    ) -> DocumentProcessingResult:
        enough = (
            is_fidelity_sufficient(text, get_fidelity_signals(fidelity_source_text))
            if fidelity_source_text is not None
            else is_extraction_sufficient(text, signals)
        )
        return self._build_result(
            text=text,
            extraction_method=extraction_method,
            reason=None if enough else "LOW_QUALITY_EXTRACTION",
            latency_ms=latency_ms,
            signals=signals,
        )

    def _build_result(
        self,
        *,
        text: str,
        extraction_method: str,
        reason: str | None,
        latency_ms: int,
        signals: ExtractionSignals | None = None,
    ) -> DocumentProcessingResult:
        extracted = text.strip()
        extracted_char_count = len(extracted)
        meaningful_text = is_extraction_sufficient(extracted, signals)
        integrity_score = min(1.0, extracted_char_count / float(max(1, MIN_MEANINGFUL_CHARS)))
        if meaningful_text:
            integrity_score = 1.0

        return DocumentProcessingResult(
            structured_text_markdown=extracted,
            parsing_metadata=ParsingMetadata(
                engine=self.ENGINE_NAME,
                extraction_method=extraction_method,
                latency_ms=latency_ms,
                extracted_char_count=extracted_char_count,
                meaningful_text=meaningful_text,
                integrity_score=integrity_score,
                reason=reason if not meaningful_text else None,
            ),
        )

    def _best_effort_suffix(self, file: UploadFile) -> str:
        if file.filename and "." in file.filename:
            return "." + file.filename.rsplit(".", 1)[-1].lower()
        if file.content_type:
            if file.content_type.endswith("/pdf"):
                return ".pdf"
            if file.content_type.startswith("image/"):
                return "." + file.content_type.split("/", 1)[1].lower()
            if "word" in file.content_type:
                return ".docx"
            if "text" in file.content_type:
                return ".txt"
        return ""

    def _elapsed_ms(self, started: float) -> int:
        return int((perf_counter() - started) * 1000)

