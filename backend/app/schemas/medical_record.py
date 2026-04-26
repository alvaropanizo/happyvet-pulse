from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


ReviewStatus = Literal["needs_review", "in_review", "approved", "automatically_approved"]
EventType = Literal[
    "visit",
    "lab",
    "administrative",
    "vaccination",
    "phone_call",
    "hospitalization",
    "prescription",
    "problem",
    "reminder",
]
TimelineEventStatus = Literal["needs_review", "approved"]
DiagnosisStatus = Literal["confirmed", "suspected", "ruled_out"]
AttachmentKind = Literal["pdf_page", "image", "lab_report", "rx", "unknown"]
FieldExtractionStatus = Literal["empty", "pending", "approved", "automatically_approved", "edited"]


class SourceSpan(BaseModel):
    start: int
    end: int


class FieldValue(BaseModel):
    value: str | float | int | None = None
    confidence: float = 0.0
    edited: bool = False
    status: FieldExtractionStatus = "empty"


SpeciesValue = Literal["cat", "dog", "bird", "other"]
SexValue = Literal["male", "female"]


class SpeciesFieldValue(FieldValue):
    value: SpeciesValue | None = None


class SexFieldValue(FieldValue):
    value: SexValue | None = None


class Attachment(BaseModel):
    attachment_id: str
    kind: AttachmentKind = "unknown"
    name: str
    url: str | None = None
    reference_text: str | None = None
    source_span: SourceSpan | None = None


class SourceDocument(BaseModel):
    document_id: str
    filename: str
    source_type: str
    language: str | None = None
    uploaded_at: datetime | None = None
    raw_text: str = ""
    attachments: list[Attachment] = Field(default_factory=list)


class Patient(BaseModel):
    name: FieldValue = Field(default_factory=FieldValue)
    species: SpeciesFieldValue = Field(default_factory=SpeciesFieldValue)
    breed: FieldValue = Field(default_factory=FieldValue)
    sex: SexFieldValue = Field(default_factory=SexFieldValue)
    birth_date: FieldValue = Field(default_factory=FieldValue)
    chip_id: FieldValue = Field(default_factory=FieldValue)
    weight_kg: FieldValue = Field(default_factory=FieldValue)


class Owner(BaseModel):
    name: FieldValue = Field(default_factory=FieldValue)
    surname: FieldValue = Field(default_factory=FieldValue)
    phone_number: FieldValue = Field(default_factory=FieldValue)
    email: FieldValue = Field(default_factory=FieldValue)
    address: FieldValue | None = None


class Diagnosis(BaseModel):
    text: str
    status: DiagnosisStatus = "suspected"


class Treatment(BaseModel):
    medication: str
    dose: str | None = None
    frequency: str | None = None
    duration: str | None = None


class TestResult(BaseModel):
    test_name: str
    result_summary: str | None = None
    values: list[dict[str, str | float | int | None]] = Field(default_factory=list)


class EventSource(BaseModel):
    document_id: str
    span: SourceSpan | None = None


class TimelineEvent(BaseModel):
    event_id: str
    status: TimelineEventStatus = "needs_review"
    date: str | None = None
    event_type: EventType = "visit"
    clinic: str | None = None
    title: str | None = None
    anamnesis: str | None = None
    assessment: list[str] = Field(default_factory=list)
    diagnoses: list[Diagnosis] = Field(default_factory=list)
    treatments: list[Treatment] = Field(default_factory=list)
    tests: list[TestResult] = Field(default_factory=list)
    attachments: list[str] = Field(default_factory=list)
    source: EventSource | None = None


class Review(BaseModel):
    status: ReviewStatus = "needs_review"
    edited_fields: list[str] = Field(default_factory=list)
    last_editor: str | None = None
    updated_at: datetime | None = None


class MedicalRecordDraft(BaseModel):
    record_id: str
    source_documents: list[SourceDocument] = Field(default_factory=list)
    patient: Patient = Field(default_factory=Patient)
    owner: Owner = Field(default_factory=Owner)
    timeline: list[TimelineEvent] = Field(default_factory=list)
    review: Review = Field(default_factory=Review)
