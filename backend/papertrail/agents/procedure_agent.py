"""Procedure Agent — given a CaseFile, returns a complete ProcedurePlan.

This agent queries the Knowledge Graph and reasons about which procedures
are needed based on the case context. It produces an ordered plan with
dependency chains, time estimates, and explanations.
"""

from __future__ import annotations

from pathlib import Path

from papertrail.kg.loader import get_procedure, get_topological_order
from papertrail.schemas.case_file import CaseFile, LifeEventType
from papertrail.schemas.plan import PlannedProcedure, ProcedurePlan
from papertrail.tools.kg_tools import query_procedure_kg

PROMPT_PATH = Path(__file__).parent / "prompts" / "procedure.txt"

# Why-needed explanations keyed by procedure_id
_WHY_NEEDED: dict[str, str] = {
    "tn_death_certificate": (
        "This is the foundational document. Every other procedure requires the "
        "death certificate as proof. Get this first from the Municipal Corporation."
    ),
    "tn_legal_heir_cert": (
        "This proves who the legal heirs are. You need it to transfer the pension, "
        "update bank accounts, and change property ownership."
    ),
    "tn_succession_cert": (
        "For movable assets worth more than Rs.1 lakh (bank FDs, shares, mutual funds), "
        "banks and institutions require a court-issued Succession Certificate."
    ),
    "tn_pension_transfer": (
        "If the deceased was receiving a pension, the family pension can be transferred "
        "to the spouse or eligible dependent. Don't miss the monthly payments."
    ),
    "tn_bank_kyc_update": (
        "Bank accounts of the deceased need to be either transferred to legal heirs or "
        "closed. The bank will freeze the account once they learn of the death."
    ),
    "tn_property_mutation": (
        "Property records (patta) still show the deceased as owner. Mutation updates "
        "the revenue records to reflect the new owner(s). Required before selling."
    ),
    "tn_aadhaar_deactivation": (
        "Deactivating the Aadhaar prevents identity fraud. Someone could misuse the "
        "deceased's Aadhaar for loans or SIM cards."
    ),
    "tn_voter_roll_removal": (
        "Removing the deceased from the voter roll prevents electoral fraud and ensures "
        "accurate constituency counts."
    ),
    "tn_ration_card_update": (
        "The ration card must be updated to remove the deceased member. If the deceased "
        "was the head of the family, a new head must be designated."
    ),
    "tn_insurance_claim": (
        "Life insurance proceeds can be claimed by the nominee or legal heirs. "
        "Most policies require a claim within a specific period."
    ),
    "tn_it_final_return": (
        "A final income tax return must be filed for income earned by the deceased "
        "from April 1 to the date of death. Any refund goes to the legal heirs."
    ),
    "tn_marriage_registration": (
        "Registering your marriage creates an official legal record. This is required "
        "before you can change your name on other documents."
    ),
    "tn_name_change_aadhaar": (
        "After marriage, if you want your new name reflected on your Aadhaar, you need "
        "the marriage certificate as supporting proof."
    ),
    "tn_name_change_pan": (
        "Your PAN card name must match your Aadhaar and bank records. Update it after "
        "marriage to avoid issues with tax filing and bank KYC."
    ),
    "tn_widow_pension_application": (
        "The Tamil Nadu government provides a monthly pension to destitute widows. "
        "This can provide critical financial support."
    ),
    "tn_widow_pension_renewal": (
        "Widow pension requires annual renewal via a life certificate. Missing the "
        "November 30 deadline can suspend your pension."
    ),
    "tn_widow_pension_grievance": (
        "If your pension application was rejected or payments stopped, you can file "
        "a formal grievance with the District Collector."
    ),
    "rti_filing": (
        "An RTI application legally compels the government office to respond within "
        "30 days with information about your pending application."
    ),
    "tn_rts_complaint": (
        "Under Tamil Nadu's Right to Service Act, if a notified service isn't delivered "
        "on time, you can file a complaint for mandatory action."
    ),
    "tn_lokayukta_complaint": (
        "If a government official demanded a bribe or caused deliberate delays, the "
        "Lokayukta can investigate and take disciplinary action."
    ),
}


def build_procedure_plan(case_file: CaseFile) -> ProcedurePlan:
    """Build a ProcedurePlan from a CaseFile by querying the KG.

    This is the deterministic version that doesn't need an LLM call.
    It uses the KG directly to find relevant procedures, order them,
    and calculate estimates.
    """
    event_type = case_file.life_event.type
    if event_type is None:
        event_type = LifeEventType.OTHER

    # Query KG with case context
    kg_results = query_procedure_kg(
        life_event=event_type.value,
        state=case_file.user.state or "tn",
        has_pension=case_file.context.had_pension or False,
        has_property=case_file.context.had_property or False,
        has_bank_accounts=case_file.context.had_bank_accounts or 0,
        has_insurance=case_file.context.had_insurance or False,
    )

    if not kg_results:
        return ProcedurePlan(case_id=case_file.case_id)

    # Get topological order
    proc_ids = [r["procedure_id"] for r in kg_results]
    ordered_ids = get_topological_order(proc_ids)

    # Build planned procedures
    planned: list[PlannedProcedure] = []
    cumulative_days = 0

    for order, pid in enumerate(ordered_ids, start=1):
        proc = get_procedure(pid)
        if not proc:
            continue

        # Calculate start day based on dependencies
        dep_end_days = 0
        for dep_id in proc.dependencies:
            if dep_id in ordered_ids:
                dep_proc = get_procedure(dep_id)
                if dep_proc:
                    dep_idx = ordered_ids.index(dep_id)
                    dep_end = sum(
                        get_procedure(ordered_ids[i]).estimated_duration_days.max
                        for i in range(dep_idx + 1)
                        if get_procedure(ordered_ids[i])
                    )
                    dep_end_days = max(dep_end_days, dep_end)

        planned.append(
            PlannedProcedure(
                procedure_id=pid,
                order=order,
                depends_on_procedure_ids=[
                    d for d in proc.dependencies if d in proc_ids
                ],
                why_this_is_needed=_WHY_NEEDED.get(pid, proc.applicable_when),
                estimated_start_after_days=dep_end_days,
                status="pending",
            )
        )

    # Calculate totals
    total_cost = sum(
        get_procedure(p.procedure_id).fee_inr
        for p in planned
        if get_procedure(p.procedure_id)
    )

    # Estimate total days = longest dependency chain
    max_end_day = 0
    for p in planned:
        proc = get_procedure(p.procedure_id)
        if proc:
            end_day = p.estimated_start_after_days + proc.estimated_duration_days.max
            max_end_day = max(max_end_day, end_day)

    return ProcedurePlan(
        case_id=case_file.case_id,
        procedures=planned,
        total_estimated_days=max_end_day,
        total_estimated_cost_inr=total_cost,
        without_papertrail_baseline_days=180,
        without_papertrail_baseline_cost_inr=15000,
    )
