"""Document generation, navigation, and escalation endpoints."""

from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException

from papertrail.agents.document_agent import generate_document
from papertrail.agents.escalation_agent import generate_escalation
from papertrail.agents.navigator_agent import build_navigation_plan
from papertrail.db.models import CaseRecord
from papertrail.db.session import get_session
from papertrail.schemas.case_file import CaseFile

router = APIRouter()


def _get_case_file(case_id: str | None) -> CaseFile:
    """Load CaseFile from DB or return a default one."""
    if case_id:
        with get_session() as session:
            record = session.get(CaseRecord, case_id)
            if record:
                return CaseFile(**json.loads(record.case_data))
    return CaseFile()


@router.post("/api/documents/{procedure_id}")
async def api_generate_document(procedure_id: str, case_id: str | None = None):
    """Generate filled form PDF for a procedure."""
    case_file = _get_case_file(case_id)
    result = generate_document(procedure_id, case_file)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.get("/api/navigation/{procedure_id}")
async def api_get_navigation(procedure_id: str, pincode: str = "600015"):
    """Get navigation plan for a procedure."""
    plan = build_navigation_plan(procedure_id, pincode)
    if not plan:
        raise HTTPException(status_code=404, detail=f"Procedure {procedure_id} not found")
    return plan.model_dump()


@router.post("/api/escalation/{procedure_id}")
async def api_generate_escalation(
    procedure_id: str,
    case_id: str | None = None,
    escalation_type: str = "rti",
    days_delayed: int = 45,
):
    """Generate RTI/grievance/Lokayukta letter."""
    case_file = _get_case_file(case_id)
    result = generate_escalation(procedure_id, case_file, escalation_type, days_delayed)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result
