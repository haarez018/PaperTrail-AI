"""Escalation Agent — generates RTI applications, grievance letters, and Lokayukta complaints."""

from __future__ import annotations

import base64
import io
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

from nyayamitra.kg.loader import get_procedure
from nyayamitra.schemas.case_file import CaseFile
from nyayamitra.schemas.escalation import EscalationLetter, EscalationType


# ---------- RTI templates ----------

_RTI_BODY_TEMPLATE = """To,
The Public Information Officer,
{office_name}

Subject: Application under the Right to Information Act, 2005

Sir/Madam,

I, {applicant_name}, resident of {applicant_address}, do hereby request the following information under Section 6(1) of the Right to Information Act, 2005:

1. The current status of my application for {procedure_name} filed on {application_date} (reference number: {reference_number}).

2. The reason for the delay in processing my application beyond the stipulated time limit of {stipulated_days} days as per the Citizen's Charter / Tamil Nadu Right to Service Act, 2010.

3. The name and designation of the officer currently responsible for processing my application.

4. The expected date of disposal of my application.

I am enclosing the prescribed fee of Rs. 10/- by way of {payment_mode}.

{bpl_note}

Thanking you,

{applicant_name}
Date: {date}
Address: {applicant_address}
Phone: {applicant_phone}
"""

_RTS_COMPLAINT_TEMPLATE = """To,
The Appellate Authority,
{office_name}

Subject: Complaint under Tamil Nadu Right to Service Act, 2010 (Section 5)

Sir/Madam,

I wish to bring to your notice that my application for {procedure_name}, submitted on {application_date} at {office_name}, has not been disposed of within the stipulated time limit.

Details of the service request:
- Service applied for: {procedure_name}
- Date of application: {application_date}
- Stipulated time limit: {stipulated_days} days
- Days elapsed: {days_delayed} days
- Reference/Acknowledgement number: {reference_number}

As per Section 3 of the Tamil Nadu Right to Service Act, 2010, every designated officer shall provide the notified service within the stipulated time limit. The failure to do so is a violation of Section 4 of the Act.

I request that:
1. The service be provided immediately.
2. Appropriate action be taken against the defaulting officer under Section 5 of the Act.
3. Compensation be provided for the delay as per the provisions of the Act.

{applicant_name}
Date: {date}
Address: {applicant_address}
"""

_LOKAYUKTA_TEMPLATE = """To,
The Hon'ble Lokayukta,
Tamil Nadu Lokayukta, Chennai

Subject: Complaint against public servant for abuse of authority / corruption

Sir/Madam,

I, {applicant_name}, hereby lodge a complaint against the following public servant:

Name of the officer: {officer_name}
Designation: {officer_designation}
Office: {office_name}

Nature of complaint:
My application for {procedure_name} has been pending for {days_delayed} days despite all requirements being fulfilled. The officer has {specific_allegation}.

Facts of the case:
1. I applied for {procedure_name} on {application_date}.
2. All required documents were submitted as per the prescribed checklist.
3. Despite the stipulated time limit of {stipulated_days} days, the application remains unprocessed.
4. {additional_facts}

I request the Hon'ble Lokayukta to:
1. Direct the concerned officer to process my application immediately.
2. Initiate inquiry into the conduct of the officer.
3. Take appropriate action under the Tamil Nadu Lokayukta Act, 2018.

I declare that the above facts are true to the best of my knowledge.

{applicant_name}
Date: {date}
Address: {applicant_address}
"""


def generate_escalation(
    procedure_id: str,
    case_file: CaseFile,
    escalation_type: str = "rti",
    days_delayed: int = 45,
) -> dict:
    """Generate an escalation letter (RTI, RTS complaint, or Lokayukta).

    Returns dict with letter details and PDF.
    """
    proc = get_procedure(procedure_id)
    if not proc:
        return {"error": f"Procedure {procedure_id} not found"}

    today = datetime.now().strftime("%d/%m/%Y")
    applicant_name = case_file.user.name or "[YOUR NAME]"
    applicant_address = f"Pincode: {case_file.user.pincode or '[YOUR ADDRESS]'}"
    stipulated_days = proc.estimated_duration_days.max

    params = {
        "applicant_name": applicant_name,
        "applicant_address": applicant_address,
        "applicant_phone": "[YOUR PHONE]",
        "procedure_name": proc.name_en,
        "office_name": proc.issuing_authority,
        "application_date": "[DATE OF YOUR ORIGINAL APPLICATION]",
        "reference_number": "[YOUR APPLICATION REFERENCE NUMBER]",
        "stipulated_days": str(stipulated_days),
        "days_delayed": str(days_delayed),
        "date": today,
        "payment_mode": "Court Fee Stamp / Postal Order",
        "bpl_note": "",
        "officer_name": "[NAME OF THE OFFICER]",
        "officer_designation": "[DESIGNATION]",
        "specific_allegation": "failed to process the application within the stipulated time without valid reason",
        "additional_facts": "[ADD ANY ADDITIONAL FACTS HERE]",
    }

    # Select template
    if escalation_type == "rti":
        body = _RTI_BODY_TEMPLATE.format(**params)
        esc_type = EscalationType.RTI
        citations = ["Right to Information Act, 2005 (Section 6(1))", "RTI Rules, 2012"]
        submission = ["https://rtionline.gov.in/", f"By registered post to PIO, {proc.issuing_authority}", "In person at the concerned office"]
        fee = 10
        response_days = 30
    elif escalation_type == "rts":
        body = _RTS_COMPLAINT_TEMPLATE.format(**params)
        esc_type = EscalationType.RTS_ACT
        citations = ["Tamil Nadu Right to Service Act, 2010 (Sections 3, 4, 5)"]
        submission = [f"Appellate Authority at {proc.issuing_authority}", "District Collector's Office"]
        fee = 0
        response_days = 30
    elif escalation_type == "lokayukta":
        body = _LOKAYUKTA_TEMPLATE.format(**params)
        esc_type = EscalationType.LOKAYUKTA
        citations = ["Tamil Nadu Lokayukta Act, 2018", "Prevention of Corruption Act, 1988"]
        submission = ["Tamil Nadu Lokayukta Office, Chennai", "By registered post"]
        fee = 0
        response_days = 90
    else:
        body = _RTI_BODY_TEMPLATE.format(**params)
        esc_type = EscalationType.RTI
        citations = ["Right to Information Act, 2005"]
        submission = ["https://rtionline.gov.in/"]
        fee = 10
        response_days = 30

    # Build the letter object
    letter = EscalationLetter(
        type=esc_type,
        drafted_to=f"PIO / Appellate Authority, {proc.issuing_authority}",
        subject=f"RTI / Complaint regarding pending {proc.name_en}",
        body_en=body,
        body_ta="[Tamil translation to be generated]",
        legal_citations=citations,
        expected_response_days=response_days,
        submission_methods=submission,
        fee_inr=fee,
    )

    # Generate PDF
    pdf_base64 = _generate_escalation_pdf(letter, proc.name_en)

    return {
        "letter": letter.model_dump(),
        "pdf_base64": pdf_base64,
        "procedure_id": procedure_id,
        "escalation_type": escalation_type,
    }


def _generate_escalation_pdf(letter: EscalationLetter, procedure_name: str) -> str:
    """Generate a PDF of the escalation letter."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2.5 * cm, bottomMargin=2 * cm)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("Title2", parent=styles["Title"], fontSize=14, spaceAfter=10)
    body_style = ParagraphStyle("Body2", parent=styles["Normal"], fontSize=11, leading=16)
    small_style = ParagraphStyle("Small2", parent=styles["Normal"], fontSize=9, textColor=colors.grey)
    cite_style = ParagraphStyle("Cite", parent=styles["Normal"], fontSize=10, textColor=colors.HexColor("#c53030"), leading=14)

    elements = []

    # Title
    type_label = letter.type.value.upper().replace("_", " ")
    elements.append(Paragraph(f"{type_label} APPLICATION", title_style))
    elements.append(Paragraph(f"Re: {procedure_name}", body_style))
    elements.append(Spacer(1, 6 * mm))

    # Body — convert newlines to <br/>
    body_html = letter.body_en.replace("\n", "<br/>")
    elements.append(Paragraph(body_html, body_style))
    elements.append(Spacer(1, 10 * mm))

    # Legal citations
    elements.append(Paragraph("Legal Basis:", cite_style))
    for cite in letter.legal_citations:
        elements.append(Paragraph(f"  - {cite}", cite_style))
    elements.append(Spacer(1, 6 * mm))

    # Submission methods
    elements.append(Paragraph("How to submit:", body_style))
    for method in letter.submission_methods:
        elements.append(Paragraph(f"  - {method}", body_style))

    if letter.fee_inr > 0:
        elements.append(Spacer(1, 4 * mm))
        elements.append(Paragraph(f"Fee: Rs. {letter.fee_inr}", body_style))

    elements.append(Spacer(1, 4 * mm))
    elements.append(Paragraph(
        f"Expected response within: {letter.expected_response_days} days",
        body_style,
    ))

    # Footer
    elements.append(Spacer(1, 10 * mm))
    elements.append(Paragraph(
        "Generated by NyayaMitra | Draft - please review before submission",
        small_style,
    ))

    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()

    return base64.b64encode(pdf_bytes).decode("utf-8")
