"""Case CRUD endpoints."""

from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException

from nyayamitra.db.models import CaseRecord
from nyayamitra.db.session import get_session

router = APIRouter()


@router.get("/api/case/{case_id}")
async def get_case(case_id: str):
    """Get full case with plan."""
    with get_session() as session:
        record = session.get(CaseRecord, case_id)
        if not record:
            raise HTTPException(status_code=404, detail="Case not found")

        result = {
            "case_id": record.id,
            "status": record.status,
            "case": json.loads(record.case_data),
            "plan": json.loads(record.plan_data) if record.plan_data else None,
            "created_at": record.created_at.isoformat(),
            "updated_at": record.updated_at.isoformat(),
        }
        return result
