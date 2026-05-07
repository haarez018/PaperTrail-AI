"""Tools for querying the Procedure Knowledge Graph.

These are used by the Procedure Agent via LangGraph tool-calling.
"""

from __future__ import annotations

from nyayamitra.kg.loader import (
    get_all_procedures,
    get_dependencies,
    get_dependents,
    get_procedure,
    get_procedures_for_event,
    get_topological_order,
)


def query_procedure_kg(
    life_event: str,
    state: str = "tn",
    has_pension: bool = False,
    has_property: bool = False,
    has_bank_accounts: int = 0,
    has_insurance: bool = False,
) -> list[dict]:
    """Query the KG for all procedures relevant to a life event and case context.

    Returns a list of procedure dicts with dependency info.
    """
    base_procedures = get_procedures_for_event(life_event)

    results = []
    for proc in base_procedures:
        # Filter based on case context
        if proc.procedure_id == "tn_pension_transfer" and not has_pension:
            continue
        if proc.procedure_id == "tn_property_mutation" and not has_property:
            continue
        if proc.procedure_id == "tn_bank_kyc_update" and has_bank_accounts == 0:
            continue
        if proc.procedure_id == "tn_insurance_claim" and not has_insurance:
            continue

        # Filter by jurisdiction
        if proc.jurisdiction not in (state, "central"):
            continue

        results.append(proc.model_dump())

    return results


def get_procedure_dependencies(procedure_id: str) -> dict:
    """Get dependency information for a procedure."""
    proc = get_procedure(procedure_id)
    if not proc:
        return {"error": f"Procedure {procedure_id} not found"}

    deps = get_dependencies(procedure_id)
    dependents = get_dependents(procedure_id)

    return {
        "procedure_id": procedure_id,
        "name": proc.name_en,
        "depends_on": [{"id": d.procedure_id, "name": d.name_en} for d in deps],
        "blocks": [{"id": d.procedure_id, "name": d.name_en} for d in dependents],
    }


def get_procedure_detail(procedure_id: str) -> dict | None:
    """Get full details of a single procedure."""
    proc = get_procedure(procedure_id)
    if not proc:
        return None
    return proc.model_dump()


def get_ordered_procedures(procedure_ids: list[str]) -> list[dict]:
    """Return procedures in correct execution order (topological sort)."""
    ordered_ids = get_topological_order(procedure_ids)
    results = []
    for pid in ordered_ids:
        proc = get_procedure(pid)
        if proc:
            results.append(proc.model_dump())
    return results
