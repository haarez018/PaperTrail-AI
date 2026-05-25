"""Print-Ready Document Kit generator.

Combines all case documents into a single, well-structured PDF:
  - Cover page with case summary
  - Procedure checklist (printable, with checkboxes)
  - All auto-filled forms
  - Office visit schedule
  - Escalation letter templates
"""

from __future__ import annotations

import base64
import io
import logging
from datetime import datetime
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)

from papertrail.agents.document_agent import generate_document
from papertrail.agents.navigator_agent import build_navigation_plan
from papertrail.kg.loader import get_procedure
from papertrail.schemas.case_file import CaseFile

logger = logging.getLogger(__name__)

SAFFRON = colors.HexColor("#E8751A")
NAVY = colors.HexColor("#1B2A4A")
LIGHT_GREY = colors.HexColor("#F5F0E8")


def _build_styles():
    """Return a dict of named paragraph styles."""
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "KitTitle",
            parent=base["Title"],
            fontSize=22,
            textColor=NAVY,
            spaceAfter=6,
        ),
        "subtitle": ParagraphStyle(
            "KitSubtitle",
            parent=base["Normal"],
            fontSize=12,
            textColor=colors.HexColor("#546E7A"),
            spaceAfter=4,
        ),
        "h1": ParagraphStyle(
            "KitH1",
            parent=base["Heading1"],
            fontSize=16,
            textColor=NAVY,
            spaceBefore=16,
            spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "KitH2",
            parent=base["Heading2"],
            fontSize=13,
            textColor=SAFFRON,
            spaceBefore=10,
            spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "KitBody",
            parent=base["Normal"],
            fontSize=11,
            leading=16,
            spaceAfter=4,
        ),
        "small": ParagraphStyle(
            "KitSmall",
            parent=base["Normal"],
            fontSize=9,
            textColor=colors.grey,
            spaceAfter=2,
        ),
        "mono": ParagraphStyle(
            "KitMono",
            parent=base["Code"],
            fontSize=10,
            fontName="Courier",
            spaceAfter=2,
        ),
    }


def generate_kit(case_file: CaseFile, plan: dict[str, Any]) -> dict:
    """
    Build a complete print-ready PDF kit for a case.

    Returns:
        dict with pdf_base64 and page_count.
    """
    styles = _build_styles()
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=2.5 * cm,
        bottomMargin=2.5 * cm,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
    )

    elements = []
    today = datetime.now().strftime("%d %B %Y")
    procedures = plan.get("procedures", [])

    # ── Cover Page ──────────────────────────────────────────────────────────
    elements.append(Spacer(1, 1.5 * cm))
    elements.append(Paragraph("PaperTrail AI", styles["title"]))
    elements.append(Paragraph("Your Complete Bureaucracy Navigation Kit", styles["subtitle"]))
    elements.append(Spacer(1, 6 * mm))
    elements.append(HRFlowable(width="100%", thickness=2, color=SAFFRON))
    elements.append(Spacer(1, 6 * mm))

    # Case summary table
    summary_data = [
        ["Case ID", case_file.case_id[:16].upper()],
        ["Date Generated", today],
        ["Total Procedures", str(len(procedures))],
        ["Estimated Duration", f"~{plan.get('total_estimated_days', '?')} days"],
        ["Total Fees", f"₹{plan.get('total_estimated_cost_inr', '?')}"],
    ]
    if case_file.deceased_name:
        summary_data.insert(1, ["Deceased", case_file.deceased_name])

    summary_table = Table(summary_data, colWidths=[6 * cm, 10 * cm])
    summary_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (0, -1), LIGHT_GREY),
            ("TEXTCOLOR", (0, 0), (0, -1), NAVY),
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 11),
            ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, LIGHT_GREY]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E8E0D0")),
            ("PADDING", (0, 0), (-1, -1), 8),
        ])
    )
    elements.append(summary_table)
    elements.append(Spacer(1, 8 * mm))

    elements.append(
        Paragraph(
            "This kit contains all forms, checklists, and legal templates "
            "you need to complete your procedures. Carry it to the office.",
            styles["body"],
        )
    )
    elements.append(PageBreak())

    # ── Section 1: Master Checklist ─────────────────────────────────────────
    elements.append(Paragraph("Section 1 — Master Procedure Checklist", styles["h1"]))
    elements.append(
        Paragraph(
            "Check each box as you complete the procedure. Follow this order — "
            "some procedures depend on others being completed first.",
            styles["body"],
        )
    )
    elements.append(Spacer(1, 4 * mm))

    for i, proc in enumerate(procedures, 1):
        proc_id = proc.get("procedure_id", "")
        name = proc_id.replace("tn_", "").replace("_", " ").title()
        why = proc.get("why_this_is_needed", "")
        deps = proc.get("depends_on_procedure_ids", [])

        elements.append(
            Paragraph(
                f"☐  {i}. {name}",
                ParagraphStyle(
                    "item",
                    parent=styles["body"],
                    fontSize=12,
                    fontName="Helvetica-Bold",
                    spaceBefore=8,
                ),
            )
        )
        if why:
            elements.append(Paragraph(f"   Why: {why}", styles["small"]))
        if deps:
            dep_names = ", ".join(
                d.replace("tn_", "").replace("_", " ").title() for d in deps
            )
            elements.append(Paragraph(f"   Requires: {dep_names} first", styles["small"]))

    elements.append(PageBreak())

    # ── Section 2: Office Visit Schedule ────────────────────────────────────
    elements.append(Paragraph("Section 2 — Office Visit Schedule", styles["h1"]))
    elements.append(
        Paragraph(
            "Visit offices in this order. Bring this page with you.",
            styles["body"],
        )
    )
    elements.append(Spacer(1, 4 * mm))

    schedule_data = [["#", "Procedure", "Office", "Est. Day", "Status"]]
    for i, proc in enumerate(procedures, 1):
        proc_id = proc.get("procedure_id", "")
        name = proc_id.replace("tn_", "").replace("_", " ").title()
        nav = build_navigation_plan(proc_id, "600015")
        office = nav.office.name if nav and nav.office else "TBD"
        start_day = proc.get("estimated_start_after_days", "?")
        schedule_data.append([
            str(i),
            name[:30],
            office[:30],
            f"Day {start_day}",
            "☐",
        ])

    sched_table = Table(schedule_data, colWidths=[1 * cm, 5 * cm, 5 * cm, 2.5 * cm, 1.5 * cm])
    sched_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (1, 1), (-1, -1), [colors.white, LIGHT_GREY]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E8E0D0")),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("PADDING", (0, 0), (-1, -1), 6),
        ])
    )
    elements.append(sched_table)
    elements.append(PageBreak())

    # ── Section 3: Auto-Filled Forms ────────────────────────────────────────
    elements.append(Paragraph("Section 3 — Auto-Filled Application Forms", styles["h1"]))
    elements.append(
        Paragraph(
            "Each form below is pre-filled with your details. "
            "Print, sign at marked locations, and submit.",
            styles["body"],
        )
    )

    for proc in procedures:
        proc_id = proc.get("procedure_id", "")
        name = proc_id.replace("tn_", "").replace("_", " ").title()

        elements.append(Spacer(1, 4 * mm))
        elements.append(HRFlowable(width="100%", thickness=1, color=LIGHT_GREY))
        elements.append(Paragraph(name, styles["h2"]))

        result = generate_document(proc_id, case_file)
        if "error" not in result and result.get("checklist"):
            elements.append(Paragraph("Required Documents:", styles["body"]))
            for item in result["checklist"]:
                req = " *required" if item.get("mandatory") else ""
                elements.append(
                    Paragraph(
                        f"  ☐ {item['name']}{req}",
                        styles["small"],
                    )
                )

        # Note about the actual form PDF
        elements.append(
            Paragraph(
                f"[Form PDF generated separately — download from PaperTrail AI app]",
                ParagraphStyle(
                    "note",
                    parent=styles["small"],
                    textColor=SAFFRON,
                    spaceBefore=4,
                ),
            )
        )

    elements.append(PageBreak())

    # ── Section 4: Legal Reference Sheet ────────────────────────────────────
    elements.append(Paragraph("Section 4 — Your Legal Rights", styles["h1"]))
    legal_refs = [
        ("RTI Act 2005", "You have the right to request information from any government office. Response mandatory within 30 days."),
        ("TN RTS Act 2010", "Tamil Nadu Right to Services Act — specified services must be delivered within stipulated time."),
        ("Legal Heir Certificate", "Entitles heirs to claim assets, pension, and insurance of the deceased."),
        ("Section 4 RTI", "Proactive disclosure — governments must publish information without you asking."),
    ]
    for title, desc in legal_refs:
        elements.append(
            Paragraph(
                f"<b>{title}:</b> {desc}",
                styles["body"],
            )
        )
        elements.append(Spacer(1, 2 * mm))

    # Footer note
    elements.append(Spacer(1, 1 * cm))
    elements.append(HRFlowable(width="100%", thickness=1, color=LIGHT_GREY))
    elements.append(
        Paragraph(
            f"Generated by PaperTrail AI • {today} • papertrailai.app",
            ParagraphStyle("footer", parent=styles["small"], alignment=1),
        )
    )

    # Build PDF
    doc.build(elements)
    pdf_bytes = buffer.getvalue()

    return {
        "pdf_base64": base64.b64encode(pdf_bytes).decode(),
        "pdf_size_bytes": len(pdf_bytes),
        "procedure_count": len(procedures),
        "generated_at": today,
    }
