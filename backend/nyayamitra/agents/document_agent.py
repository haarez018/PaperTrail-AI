"""Document Agent — generates filled government forms as PDFs.

Deterministic for all structured fields (name, date, address, fees,
checklists).  LLM used ONLY for free-text fields like "reason for
application" or "self-declaration paragraph", with deterministic fallback.
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
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from nyayamitra.kg.loader import get_procedure
from nyayamitra.schemas.case_file import CaseFile

logger = logging.getLogger(__name__)


def generate_document(procedure_id: str, case_file: CaseFile) -> dict:
    """Generate a filled form PDF for a procedure.

    Returns dict with:
      - pdf_base64: base64-encoded PDF
      - checklist: list of documents to attach
      - signature_locations: where to sign
    """
    proc = get_procedure(procedure_id)
    if not proc:
        return {"error": f"Procedure {procedure_id} not found"}

    # Generate PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2 * cm, bottomMargin=2 * cm)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "CustomTitle", parent=styles["Title"], fontSize=16, spaceAfter=12
    )
    heading_style = ParagraphStyle(
        "CustomHeading", parent=styles["Heading2"], fontSize=13, spaceAfter=8, textColor=colors.HexColor("#1a365d")
    )
    body_style = ParagraphStyle(
        "CustomBody", parent=styles["Normal"], fontSize=11, leading=16
    )
    small_style = ParagraphStyle(
        "Small", parent=styles["Normal"], fontSize=9, textColor=colors.grey
    )

    elements = []

    # Header
    elements.append(Paragraph(f"APPLICATION FOR {proc.name_en.upper()}", title_style))
    elements.append(Paragraph(f"{proc.issuing_authority}", heading_style))
    elements.append(Spacer(1, 6 * mm))

    # Reference info
    today = datetime.now().strftime("%d/%m/%Y")
    elements.append(Paragraph(f"Date: {today}", body_style))
    elements.append(Paragraph(f"Reference: NM-{case_file.case_id[:8].upper()}", body_style))
    if proc.legal_basis:
        elements.append(Paragraph(f"Under: {proc.legal_basis}", small_style))
    elements.append(Spacer(1, 8 * mm))

    # Applicant details table
    elements.append(Paragraph("APPLICANT DETAILS", heading_style))
    user = case_file.user
    event = case_file.life_event

    applicant_data = [
        ["Field", "Value"],
        ["Applicant Name", user.name or "[TO BE FILLED]"],
        ["Age", str(user.age) if user.age else "[TO BE FILLED]"],
        ["Relationship to Subject", (user.relationship_to_subject.value if user.relationship_to_subject else "[TO BE FILLED]")],
        ["Address / Pincode", user.pincode or "[TO BE FILLED]"],
        ["State", user.state or "Tamil Nadu"],
    ]

    if event.subject_name:
        applicant_data.append(["Name of Deceased/Subject", event.subject_name])
    if event.event_date:
        applicant_data.append(["Date of Event", event.event_date])
    if event.location:
        applicant_data.append(["Place of Event", event.location])

    table = Table(applicant_data, colWidths=[6 * cm, 10 * cm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2b6cb0")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("BACKGROUND", (0, 1), (0, -1), colors.HexColor("#ebf4ff")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 8 * mm))

    # Documents required checklist
    elements.append(Paragraph("DOCUMENTS CHECKLIST", heading_style))
    for i, doc_req in enumerate(proc.documents_required, 1):
        status = "MANDATORY" if doc_req.mandatory else "Optional"
        where = f" (Get from: {doc_req.where_to_get})" if doc_req.where_to_get else ""
        checkbox = "[ ]"
        elements.append(Paragraph(
            f"{checkbox}  {i}. {doc_req.name} [{status}]{where}",
            body_style,
        ))
    elements.append(Spacer(1, 8 * mm))

    # Fee information
    if proc.fee_inr > 0:
        elements.append(Paragraph(f"Fee: Rs. {proc.fee_inr}", body_style))
    else:
        elements.append(Paragraph("Fee: No fee required", body_style))
    elements.append(Spacer(1, 6 * mm))

    # Common rejection reasons
    if proc.common_rejection_reasons:
        elements.append(Paragraph("COMMON REJECTION REASONS (avoid these!)", heading_style))
        for reason in proc.common_rejection_reasons:
            elements.append(Paragraph(f"  - {reason}", body_style))
        elements.append(Spacer(1, 8 * mm))

    # Signature section
    elements.append(Spacer(1, 15 * mm))
    sig_data = [
        ["Applicant Signature", "Date", "Place"],
        ["", today, event.location or "[PLACE]"],
        ["", "", ""],
        ["Witness 1 Signature", "Witness 2 Signature", ""],
        ["Name: _______________", "Name: _______________", ""],
        ["Aadhaar: ____________", "Aadhaar: ____________", ""],
    ]
    sig_table = Table(sig_data, colWidths=[6 * cm, 6 * cm, 4 * cm])
    sig_table.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 3), (-1, 3), "Helvetica-Bold"),
        ("LINEBELOW", (0, 1), (0, 1), 1, colors.black),
    ]))
    elements.append(sig_table)

    # Footer
    elements.append(Spacer(1, 10 * mm))
    elements.append(Paragraph(
        "Generated by PaperTrail AI | This is a draft; please verify all details before submission.",
        small_style,
    ))

    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()

    # Build response
    checklist = []
    for doc_req in proc.documents_required:
        checklist.append({
            "name": doc_req.name,
            "mandatory": doc_req.mandatory,
            "where_to_get": doc_req.where_to_get,
            "have_it": False,
        })

    return {
        "procedure_id": procedure_id,
        "procedure_name": proc.name_en,
        "pdf_base64": base64.b64encode(pdf_bytes).decode("utf-8"),
        "pdf_size_bytes": len(pdf_bytes),
        "checklist": checklist,
        "signature_locations": [
            "Page 1, bottom: Applicant signature",
            "Page 1, bottom: Witness 1 signature",
            "Page 1, bottom: Witness 2 signature",
        ],
        "fee_inr": proc.fee_inr,
    }


# ═══════════════════════════════════════════════════════════════════════
# Free-text field generation (LLM-enhanced, with deterministic fallback)
# ═══════════════════════════════════════════════════════════════════════

# Deterministic boilerplate for free-text fields
_DETERMINISTIC_FREETEXT: dict[str, str] = {
    "reason_for_application": (
        "The applicant hereby applies for the above-mentioned certificate/service "
        "in connection with the life event described. All information provided is "
        "true to the best of the applicant's knowledge."
    ),
    "statement_of_facts": (
        "The applicant states that the subject named above was a resident of the "
        "locality mentioned, and the facts presented in this application are true "
        "and verifiable through the supporting documents attached herewith."
    ),
    "self_declaration": (
        "I solemnly declare that the information furnished above is true and correct "
        "to the best of my knowledge and belief, and nothing has been concealed therein."
    ),
}


def _deterministic_freetext(field_name: str, case_file: CaseFile) -> str:
    """Return deterministic boilerplate for a free-text field."""
    return _DETERMINISTIC_FREETEXT.get(field_name, _DETERMINISTIC_FREETEXT["self_declaration"])


async def _llm_freetext(field_name: str, procedure_name: str, case_file: CaseFile, llm_client: Any) -> str:
    """Use LLM to generate polished free-text for a form field."""
    try:
        from nyayamitra.llm.prompts import load_prompt
        from nyayamitra.config import LLM_TEMPERATURE_DOCUMENT

        prompt_template = load_prompt("document_freetext.txt")
        prompt = prompt_template.format(
            field_name=field_name,
            procedure_name=procedure_name,
            applicant_json=case_file.model_dump_json(indent=2),
        )

        resp = await llm_client.generate(
            prompt=prompt,
            temperature=LLM_TEMPERATURE_DOCUMENT,
            max_tokens=300,
        )

        text = resp.text.strip()
        if text and resp.provider != "deterministic":
            return text
    except Exception as e:
        logger.warning("LLM freetext generation failed for %s: %s", field_name, e)

    return _deterministic_freetext(field_name, case_file)


async def generate_document_async(
    procedure_id: str,
    case_file: CaseFile,
    llm_client: Any = None,
) -> dict:
    """Generate a document with LLM-polished free-text fields.

    All structured fields (name, date, fee, checklist) stay deterministic.
    LLM is used ONLY for free-text paragraphs if available.
    """
    from nyayamitra.config import LLM_MODE

    # Start with the fully deterministic document
    result = generate_document(procedure_id, case_file)
    if "error" in result:
        return result

    # If hybrid mode and LLM available, generate polished free-text
    if LLM_MODE == "hybrid" and llm_client is not None:
        proc_name = result.get("procedure_name", procedure_id)
        result["freetext_reason"] = await _llm_freetext(
            "reason_for_application", proc_name, case_file, llm_client,
        )
        result["freetext_declaration"] = await _llm_freetext(
            "self_declaration", proc_name, case_file, llm_client,
        )
    else:
        result["freetext_reason"] = _deterministic_freetext("reason_for_application", case_file)
        result["freetext_declaration"] = _deterministic_freetext("self_declaration", case_file)

    return result
