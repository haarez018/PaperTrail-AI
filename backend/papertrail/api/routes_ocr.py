"""OCR / document scanning endpoint."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from papertrail.tools.vision_tools import extract_document_fields

logger = logging.getLogger(__name__)
router = APIRouter()


class OCRRequest(BaseModel):
    image_base64: str
    document_type_hint: str = "auto"


@router.post("/api/ocr")
async def ocr_document(request: OCRRequest):
    """Extract structured fields from a scanned document image.

    Accepts a base64-encoded image (JPEG/PNG).
    Uses Ollama vision model if available; returns empty fields otherwise.

    Response:
        extracted_fields: dict of field_name → value
        confidence: 0.0–1.0
        document_type_detected: string
    """
    if not request.image_base64:
        raise HTTPException(status_code=400, detail="image_base64 is required")

    result = await extract_document_fields(
        request.image_base64,
        request.document_type_hint,
    )
    return result
