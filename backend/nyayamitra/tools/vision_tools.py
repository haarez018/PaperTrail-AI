"""Vision / OCR tools — document scanning with Ollama multimodal models.

Strategy:
  1. Try Ollama vision model (llava or llama3.2-vision) for structured extraction.
  2. If no vision model available, fall back to pattern-based heuristics on
     any text that might be in the uploaded image metadata.
"""

from __future__ import annotations

import base64
import json
import logging
import re

import httpx

from nyayamitra.config import OLLAMA_BASE_URL

logger = logging.getLogger(__name__)

VISION_MODELS = ["llama3.2-vision", "llava", "llava:7b", "bakllava"]

EXTRACT_PROMPT = """You are an OCR extraction assistant for Indian government documents.
Extract all visible text fields from this image and return a JSON object.

Look for and extract (if visible):
- name: full name of the person
- dob: date of birth (DD/MM/YYYY)
- aadhaar_number: 12-digit Aadhaar (mask first 8 digits as XXXX-XXXX-XXXX)
- address: complete address
- father_name: father's or husband's name
- gender: Male/Female/Other
- pincode: 6-digit PIN code
- district: district name
- state: state name
- certificate_number: any certificate or registration number
- issue_date: date of issue
- document_type: what kind of document this appears to be

Return ONLY a JSON object with the found fields. Omit fields not visible.
Example: {"name": "RAMASAMY K", "dob": "15/03/1945", "district": "Chennai"}"""


async def _get_available_vision_model() -> str | None:
    """Check which vision models are available in Ollama."""
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if resp.status_code == 200:
                models = [m["name"] for m in resp.json().get("models", [])]
                for v in VISION_MODELS:
                    if any(v in m for m in models):
                        return next(m for m in models if v in m)
    except Exception:
        pass
    return None


async def extract_document_fields(
    image_base64: str,
    document_type_hint: str = "auto",
) -> dict:
    """Extract structured fields from a scanned document image.

    Args:
        image_base64: Base64-encoded image (JPEG or PNG).
        document_type_hint: "aadhaar" | "death_cert" | "ration_card" | "auto"

    Returns:
        dict with extracted_fields, confidence, document_type_detected.
    """
    model = await _get_available_vision_model()

    if model:
        return await _extract_with_vision_model(model, image_base64, document_type_hint)

    # Fallback: return a helpful empty result with guidance
    logger.info("No vision model available — returning empty extraction")
    return {
        "extracted_fields": {},
        "confidence": 0.0,
        "document_type_detected": document_type_hint if document_type_hint != "auto" else "unknown",
        "fallback": True,
        "message": (
            "Vision model not available. "
            "Install llava with: ollama pull llava"
        ),
    }


async def _extract_with_vision_model(
    model: str,
    image_base64: str,
    document_type_hint: str,
) -> dict:
    """Call Ollama vision model to extract fields."""
    prompt = EXTRACT_PROMPT
    if document_type_hint != "auto":
        prompt += f"\n\nThis is expected to be a {document_type_hint.replace('_', ' ')} document."

    payload = {
        "model": model,
        "prompt": prompt,
        "images": [image_base64],
        "stream": False,
        "format": "json",
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload)
            resp.raise_for_status()
            raw = resp.json().get("response", "{}")
            fields = _parse_json_safe(raw)

            # Mask Aadhaar if present
            if "aadhaar_number" in fields:
                fields["aadhaar_number"] = _mask_aadhaar(fields["aadhaar_number"])

            # Infer document type from fields if auto
            doc_type = document_type_hint
            if doc_type == "auto":
                doc_type = _infer_doc_type(fields)

            return {
                "extracted_fields": fields,
                "confidence": _estimate_confidence(fields),
                "document_type_detected": doc_type,
                "model_used": model,
            }
    except Exception as exc:
        logger.warning("Vision model extraction failed: %s", exc)
        return {
            "extracted_fields": {},
            "confidence": 0.0,
            "document_type_detected": "unknown",
            "error": str(exc),
        }


def _parse_json_safe(text: str) -> dict:
    """Parse JSON from model response, handling markdown code blocks."""
    text = text.strip()
    # Strip markdown fences
    if text.startswith("```"):
        text = re.sub(r"```(?:json)?\n?", "", text).strip("` \n")
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to extract JSON object
        match = re.search(r"\{[^{}]+\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
    return {}


def _mask_aadhaar(number: str) -> str:
    """Mask first 8 digits of Aadhaar for privacy."""
    digits = re.sub(r"\D", "", number)
    if len(digits) == 12:
        return f"XXXX-XXXX-{digits[8:]}"
    return number


def _infer_doc_type(fields: dict) -> str:
    """Guess document type from the extracted fields."""
    keys = set(fields.keys())
    if "aadhaar_number" in keys:
        return "aadhaar"
    if any(k in keys for k in ("deceased_name", "death_date", "cause_of_death")):
        return "death_cert"
    if "ration_card_number" in keys:
        return "ration_card"
    if "certificate_number" in keys:
        return "certificate"
    return "identity_document"


def _estimate_confidence(fields: dict) -> float:
    """Rough confidence score based on how many fields were found."""
    if not fields:
        return 0.0
    count = len(fields)
    if count >= 5:
        return 0.90
    if count >= 3:
        return 0.75
    if count >= 1:
        return 0.55
    return 0.0
