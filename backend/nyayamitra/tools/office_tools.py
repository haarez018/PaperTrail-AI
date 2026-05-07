"""Tools for finding government offices."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

OFFICES_PATH = Path(__file__).parent.parent / "kg" / "offices.json"

_offices: list[dict[str, Any]] = []


def _load_offices() -> list[dict[str, Any]]:
    global _offices
    if not _offices:
        _offices = json.loads(OFFICES_PATH.read_text(encoding="utf-8"))
    return _offices


def find_office(office_type: str, pincode: str = "") -> dict[str, Any] | None:
    """Find the best matching office for a given type and pincode."""
    offices = _load_offices()

    # Try exact pincode match first
    for office in offices:
        if office["office_type"] == office_type and office.get("pincode") == pincode:
            return office

    # Fall back to any office of that type
    for office in offices:
        if office["office_type"] == office_type:
            return office

    return None


def get_office_hours(office_id: str) -> str:
    """Get office hours by office ID."""
    offices = _load_offices()
    for office in offices:
        if office["office_id"] == office_id:
            return office.get("hours", "Not available")
    return "Not available"


def get_all_offices() -> list[dict[str, Any]]:
    """Return all offices."""
    return _load_offices()
