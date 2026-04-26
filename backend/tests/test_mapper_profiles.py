from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.document_processing.models import DocumentProcessingResult, ParsingMetadata
from app.main import app


client = TestClient(app)


def _processing(markdown: str) -> DocumentProcessingResult:
    return DocumentProcessingResult(
        structured_text_markdown=markdown,
        parsing_metadata=ParsingMetadata(
            engine="gatekeeper",
            extraction_method="fast_path",
            latency_ms=10,
            extracted_char_count=len(markdown),
            meaningful_text=True,
            integrity_score=1.0,
        ),
    )


PROFILES = [
    (
        "cat",
        "cat.pdf",
        "application/pdf",
        """name=Mochi
owner_name=Carla
owner_surname=Vance
species=cat
breed=British Shorthair
sex: female (Intact)
Date of Birth: 2026-04-10
chip_id=CAT99001122
weight_kg=4.2
owner_email=carla@example.com
address=Street 1, Madrid
owner_phone=+34 600 111 222
""",
        "cat",
    ),
    (
        "dog",
        "dog.pdf",
        "application/pdf",
        """patient_name: Nala
owner_name: Sergio
owner_surname: Martinez
species: dog
breed: Labrador
sex: male
date_of_birth: 2020-02-01
chip_id: DOG12345678
weight: 22 kg
owner_email: sergio@example.com
address: Calle Luna 12, Sevilla
owner_phone: +34 600 222 333
""",
        "dog",
    ),
    (
        "bird",
        "bird.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        """pet_name=Pico
owner_name=Sergio
owner_surname=Martinez
species=bird
breed=Congo African Grey
date_of_birth=2021-05-12
sex=male
chip_id=AV9900112233
weight=410 g
owner_email=sergio@example.com
address=Avenida Verde 8, Valencia
owner_phone=+34 600 333 444
""",
        "bird",
    ),
    (
        "monkey",
        "monkey.png",
        "image/png",
        """pet_name=Bongo
owner_name=Ana
owner_surname=Lopez
species=monkey
breed=Capuchin
sex=male
date_of_birth=2018-09-07
chip_id=MK99001122
weight=3.8 kg
owner_email=ana@example.com
address=Rua Selva 4, Lisboa
owner_phone=+351 912 000 111
""",
        "other",
    ),
]


@pytest.mark.parametrize(
    "profile,filename,content_type,markdown,expected_species",
    PROFILES,
)
def test_scan_profile_examples_have_high_mapping_coverage(
    profile: str,
    filename: str,
    content_type: str,
    markdown: str,
    expected_species: str,
) -> None:
    with patch("app.api.routes.documents.get_document_processor") as mocked_get_processor:
        mock_processor = AsyncMock()
        mock_processor.process.return_value = _processing(markdown)
        mocked_get_processor.return_value = mock_processor

        response = client.post(
            "/api/v1/documents/scan",
            files={"file": (filename, markdown.encode("utf-8"), content_type)},
        )

    assert response.status_code == 200, profile
    payload = response.json()
    patient = payload["medical_record"]["patient"]
    metadata = payload["parsing_metadata"]

    assert patient["species"]["value"] == expected_species
    assert patient["name"]["value"] not in (None, "")
    assert patient["chip_id"]["value"] not in (None, "")
    assert patient["birth_date"]["value"] not in (None, "")

    assert metadata["mapping_coverage_pct"] >= 95.0, profile
    assert metadata["confident_coverage_pct"] >= 90.0, profile
