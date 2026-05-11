"""Export endpoints — print-ready document kit, case list, procedure explorer, and feedback."""

from __future__ import annotations

import json
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from nyayamitra.db.models import CaseRecord, FeedbackRecord
from nyayamitra.db.session import get_session
from nyayamitra.kg.loader import get_all_procedures
from nyayamitra.schemas.case_file import CaseFile
from nyayamitra.tools.kit_generator import generate_kit

logger = logging.getLogger(__name__)
router = APIRouter()


class FeedbackRequest(BaseModel):
    case_id: Optional[str] = None
    procedure_id: Optional[str] = None
    rating: int  # 1 = thumbs up, -1 = thumbs down
    comment: Optional[str] = None
    language: str = "en"


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


@router.get("/api/stats")
async def get_stats():
    """Return aggregated stats for the performance dashboard."""
    from sqlmodel import select, func as sqlfunc
    from datetime import datetime as dt

    with get_session() as session:
        records = session.exec(select(CaseRecord)).all()

    total_cases = len(records)
    completed = sum(1 for r in records if r.status == "completed")
    active = sum(1 for r in records if r.status == "active")

    # Procedure stats
    all_procs: list[dict] = []
    proc_counts: dict[str, int] = {}
    language_counts: dict[str, int] = {"en": 0, "ta": 0, "hi": 0}

    for r in records:
        plan = json.loads(r.plan_data) if r.plan_data else {}
        for p in plan.get("procedures", []):
            all_procs.append(p)
            pid = p.get("procedure_id", "unknown")
            proc_counts[pid] = proc_counts.get(pid, 0) + 1

        case = json.loads(r.case_data) if r.case_data else {}
        lang = case.get("language", "en")
        if lang in language_counts:
            language_counts[lang] += 1
        else:
            language_counts["en"] += 1

    avg_procedures = round(len(all_procs) / total_cases, 1) if total_cases else 0

    top_procedures = sorted(
        [{"procedure_id": k, "count": v} for k, v in proc_counts.items()],
        key=lambda x: x["count"],
        reverse=True,
    )[:8]

    # Format for chart
    language_chart = [
        {"language": "English", "cases": language_counts.get("en", 0)},
        {"language": "Tamil", "cases": language_counts.get("ta", 0)},
        {"language": "Hindi", "cases": language_counts.get("hi", 0)},
    ]

    return {
        "total_cases": total_cases,
        "completed_cases": completed,
        "active_cases": active,
        "avg_procedures_per_case": avg_procedures,
        "total_procedures_generated": len(all_procs),
        "language_distribution": language_chart,
        "top_procedures": top_procedures,
        "uptime_since": records[0].created_at.isoformat() if records else None,
    }


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


@router.post("/api/feedback")
async def submit_feedback(req: FeedbackRequest):
    """Submit thumbs-up/down rating with optional comment for a procedure or plan."""
    if req.rating not in (1, -1):
        raise HTTPException(status_code=422, detail="rating must be 1 or -1")

    record = FeedbackRecord(
        case_id=req.case_id,
        procedure_id=req.procedure_id,
        rating=req.rating,
        comment=req.comment,
        language=req.language,
    )

    try:
        with get_session() as session:
            session.add(record)
            session.commit()
            session.refresh(record)
        return {"feedback_id": record.id, "status": "recorded"}
    except Exception as exc:
        logger.exception("Failed to save feedback")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/api/feedback/summary")
async def feedback_summary():
    """Aggregate feedback stats — thumbs up/down counts per procedure."""
    from sqlmodel import select

    with get_session() as session:
        records = session.exec(select(FeedbackRecord)).all()

    total = len(records)
    positive = sum(1 for r in records if r.rating == 1)
    negative = total - positive

    # Per-procedure breakdown
    by_proc: dict[str, dict] = {}
    for r in records:
        key = r.procedure_id or "__plan__"
        if key not in by_proc:
            by_proc[key] = {"up": 0, "down": 0}
        if r.rating == 1:
            by_proc[key]["up"] += 1
        else:
            by_proc[key]["down"] += 1

    return {
        "total": total,
        "positive": positive,
        "negative": negative,
        "satisfaction_pct": round(positive / total * 100) if total else None,
        "by_procedure": by_proc,
    }
