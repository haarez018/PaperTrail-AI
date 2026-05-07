"""Document Agent — generates filled government forms as PDFs."""

from __future__ import annotations

import base64
import io
from datetime import datetime

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
        "Generated by NyayaMitra - AI Bureaucracy Navigator | This is a draft; please verify all details before submission.",
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
