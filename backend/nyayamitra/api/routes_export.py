"""Export endpoints — print-ready document kit, case list, and procedure explorer."""

from __future__ import annotations

import json
import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from nyayamitra.db.models import CaseRecord
from nyayamitra.db.session import get_session
from nyayamitra.kg.loader import get_all_procedures
from nyayamitra.schemas.case_file import CaseFile
from nyayamitra.tools.kit_generator import generate_kit

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/api/case/{case_id}/export-kit")
async def export_kit(case_id: str):
    """Generate a complete print-ready PDF kit for the case.

    Returns base64-encoded PDF along with metadata.
    """
    with get_session() as session:
        record = session.get(CaseRecord, case_id)
        if not record:
            raise HTTPException(status_code=404, detail="Case not found")

        case_data = json.loads(record.case_data)
        plan_data = json.loads(record.plan_data) if record.plan_data else {}

    try:
        case_file = CaseFile(**case_data)
        result = generate_kit(case_file, plan_data)
        return result
    except Exception as exc:
        logger.exception("Kit generation failed for case %s", case_id)
        raise HTTPException(
            status_code=500,
            detail=f"Kit generation failed: {exc}",
        ) from exc


@router.get("/api/cases")
async def list_cases():
    """Return all cases with summary info for the multi-case view."""
    with get_session() as session:
        from sqlmodel import select
        records = session.exec(select(CaseRecord).order_by(CaseRecord.updated_at.desc())).all()

        cases = []
        for r in records:
            plan = json.loads(r.plan_data) if r.plan_data else {}
            procs = plan.get("procedures", [])
            done = sum(1 for p in procs if p.get("status") == "done")
            cases.append({
                "case_id": r.id,
                "status": r.status,
                "created_at": r.created_at.isoformat(),
                "updated_at": r.updated_at.isoformat(),
                "procedure_count": len(procs),
                "done_count": done,
                "progress_pct": round(done / len(procs) * 100) if procs else 0,
                "total_estimated_days": plan.get("total_estimated_days"),
                "total_estimated_cost_inr": plan.get("total_estimated_cost_inr"),
            })

        return {"cases": cases}


@router.get("/api/procedures")
async def list_procedures():
    """Return all procedures from the knowledge graph for the explorer."""
    try:
        procedures_dict = get_all_procedures()
        proc_list = list(procedures_dict.values())
        return {
            "procedures": [p.model_dump() for p in proc_list],
            "count": len(proc_list),
        }
    except Exception as exc:
        logger.exception("Failed to load procedures")
        raise HTTPException(status_code=500, detail=str(exc)) from exc
