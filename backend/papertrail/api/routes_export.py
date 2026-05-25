"""Export endpoints — print-ready document kit, case list, procedure explorer, and feedback."""

from __future__ import annotations

import io
import json
import logging
import zipfile
from datetime import datetime
from functools import lru_cache
from typing import Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from papertrail.db.models import CaseRecord, FeedbackRecord
from papertrail.db.session import get_session
from papertrail.kg.loader import get_all_procedures
from papertrail.schemas.case_file import CaseFile
from papertrail.tools.kit_generator import generate_kit

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


@router.get("/api/cases/{case_id}/export")
async def export_case_kit(case_id: str):
    """Export complete case kit as a downloadable zip."""
    with get_session() as session:
        record = session.get(CaseRecord, case_id)
        if not record:
            raise HTTPException(status_code=404, detail="Case not found")

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("case_summary.json", record.case_data)
        if record.plan_data:
            zf.writestr("procedure_plan.json", record.plan_data)
        zf.writestr(
            "README.txt",
            f"""PaperTrail AI — Case Export Kit
Case ID: {case_id}
Generated: {datetime.now().strftime('%d %B %Y, %H:%M')}

Files in this kit:
- case_summary.json  : Your personal case details
- procedure_plan.json: All procedures, timelines, and fees
- README.txt         : This file

Continue your case at: https://papertrail.ai/case/{case_id}
PaperTrail AI is free. Government fees only.
""",
        )
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=PaperTrail-{case_id}.zip"},
    )


class ChatExportRequest(BaseModel):
    messages: list[dict]  # [{role, content, agent?, timestamp?}]


@router.post("/api/case/{case_id}/export-chat")
async def export_chat(case_id: str, req: ChatExportRequest):
    """Export the conversation as a print-ready PDF.

    Returns base64-encoded PDF.
    """
    try:
        import base64
        from io import BytesIO
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import mm
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, HRFlowable,
        )

        buf = BytesIO()
        doc = SimpleDocTemplate(
            buf,
            pagesize=A4,
            leftMargin=20 * mm, rightMargin=20 * mm,
            topMargin=20 * mm, bottomMargin=20 * mm,
        )
        styles = getSampleStyleSheet()

        # Custom styles
        header_style = ParagraphStyle(
            "ChatHeader",
            parent=styles["Title"],
            fontSize=16,
            textColor=colors.HexColor("#1a2744"),
            spaceAfter=4 * mm,
        )
        label_style = ParagraphStyle(
            "Label",
            parent=styles["Normal"],
            fontSize=8,
            textColor=colors.HexColor("#c45c00"),
            spaceBefore=3 * mm,
            spaceAfter=1 * mm,
            fontName="Helvetica-Bold",
        )
        user_style = ParagraphStyle(
            "UserBubble",
            parent=styles["Normal"],
            fontSize=10,
            textColor=colors.HexColor("#1a2744"),
            backColor=colors.HexColor("#E8F4FD"),
            borderPad=4,
            leftIndent=30 * mm,
            spaceAfter=2 * mm,
        )
        agent_style = ParagraphStyle(
            "AgentBubble",
            parent=styles["Normal"],
            fontSize=10,
            textColor=colors.HexColor("#1a1a1a"),
            backColor=colors.HexColor("#F8F6F0"),
            borderPad=4,
            rightIndent=30 * mm,
            spaceAfter=2 * mm,
        )
        footer_style = ParagraphStyle(
            "Footer",
            parent=styles["Normal"],
            fontSize=8,
            textColor=colors.HexColor("#888888"),
            alignment=1,  # centre
        )

        elements = []
        elements.append(Paragraph("PaperTrail AI — Conversation Export", header_style))
        elements.append(Paragraph(f"Case ID: <b>{case_id}</b>", styles["Normal"]))
        elements.append(Spacer(1, 4 * mm))
        elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E0D8CC")))
        elements.append(Spacer(1, 4 * mm))

        _agent_labels = {
            "intake": "Intake Agent",
            "planner": "Planning Agent",
            "document": "Document Agent",
            "navigation": "Navigation Agent",
            "escalation": "Escalation Agent",
            "done": "PaperTrail AI",
        }

        for msg in req.messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            agent = msg.get("agent", "")

            if role == "user":
                elements.append(Paragraph("YOU", label_style))
                elements.append(Paragraph(content, user_style))
            else:
                label = _agent_labels.get(agent, "PaperTrail AI") if agent else "PaperTrail AI"
                elements.append(Paragraph(label.upper(), label_style))
                elements.append(Paragraph(content, agent_style))

        elements.append(Spacer(1, 8 * mm))
        elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E0D8CC")))
        elements.append(Spacer(1, 3 * mm))
        elements.append(Paragraph(
            "Generated by PaperTrail AI | Free service — government fees only",
            footer_style,
        ))

        doc.build(elements)
        pdf_bytes = buf.getvalue()
        pdf_b64 = base64.b64encode(pdf_bytes).decode("utf-8")

        return {
            "pdf_base64": pdf_b64,
            "filename": f"papertrail-chat-{case_id}.pdf",
            "size_bytes": len(pdf_bytes),
        }
    except Exception as exc:
        logger.exception("Chat export failed for case %s", case_id)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


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


@lru_cache(maxsize=1)
def _get_procedures_payload() -> dict:
    """Serialize procedures once and cache the result in memory."""
    procedures_dict = get_all_procedures()
    proc_list = list(procedures_dict.values())
    return {
        "procedures": [p.model_dump() for p in proc_list],
        "count": len(proc_list),
    }


@router.get("/api/procedures")
async def list_procedures():
    """Return all procedures from the knowledge graph for the explorer."""
    try:
        return _get_procedures_payload()
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
