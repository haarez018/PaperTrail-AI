"""Navigator Agent — tells the user exactly what to do, where, and when."""

from __future__ import annotations

from nyayamitra.kg.loader import get_procedure
from nyayamitra.schemas.navigation import ConditionalAdvice, NavigationPlan, Office
from nyayamitra.tools.office_tools import find_office

# Common legal workarounds applicable in Tamil Nadu
_WORKAROUNDS: dict[str, list[dict[str, str]]] = {
    "tn_legal_heir_cert": [
        {
            "if_asked": "Original ration card",
            "say": "DigiLocker copy is legally valid under TN G.O. 142/2019. Show the DigiLocker app.",
        },
        {
            "if_asked": "Extra witness beyond two",
            "say": "Only two witnesses are required per the Legal Heir Certificate Rules. Politely cite the rules.",
        },
    ],
    "tn_death_certificate": [
        {
            "if_asked": "Why the death was not reported within 21 days",
            "say": "Apply for late registration with a magistrate order. We can help draft the application.",
        },
    ],
    "tn_property_mutation": [
        {
            "if_asked": "Survey sketch from the last 6 months",
            "say": "The law does not mandate a recent survey sketch. An older one is valid if no changes occurred.",
        },
        {
            "if_asked": "All legal heirs to be present in person",
            "say": "A notarized NOC from absent heirs is sufficient under TN Revenue Standing Orders.",
        },
    ],
    "tn_bank_kyc_update": [
        {
            "if_asked": "Succession certificate even for small amounts",
            "say": "As per RBI guidelines, for amounts under Rs.1 lakh, a legal heir certificate and indemnity bond are sufficient.",
        },
    ],
}


def build_navigation_plan(procedure_id: str, pincode: str = "600015") -> NavigationPlan | None:
    """Build a navigation plan for a procedure."""
    proc = get_procedure(procedure_id)
    if not proc:
        return None

    # Find the right office
    office_data = find_office(proc.office_type, pincode)
    if not office_data:
        office = Office(
            name=f"{proc.issuing_authority} (nearest office)",
            address="Please check local directory",
        )
    else:
        office = Office(
            name=office_data["name"],
            address=office_data["address"],
            lat_lng=office_data.get("lat_lng", []),
            counter=office_data.get("counter", ""),
            hours=office_data.get("hours", ""),
            phone=office_data.get("phone"),
        )

    # Build document checklist
    what_to_bring = []
    for doc in proc.documents_required:
        status = "(mandatory)" if doc.mandatory else "(if available)"
        what_to_bring.append(f"{doc.name} {status}")

    # Build what to say
    what_to_say = (
        f"Tell the clerk: 'I'm here to apply for {proc.name_en}. "
        f"I have all the required documents as per {proc.legal_basis}.'"
    )

    # Add workarounds
    workarounds = _WORKAROUNDS.get(procedure_id, [])
    advice = [ConditionalAdvice(**w) for w in workarounds]

    avg_wait = 60
    best_time = "Weekday morning, 10:00 - 11:30 AM"
    if office_data:
        avg_wait = office_data.get("average_wait_minutes", 60)
        best_time = office_data.get("best_time_to_visit", best_time)

    return NavigationPlan(
        procedure_id=procedure_id,
        office=office,
        what_to_bring=what_to_bring,
        what_to_say=what_to_say,
        if_they_ask_X_say_Y=advice,
        average_wait_minutes=avg_wait,
        best_time_to_visit=best_time,
    )
