"""Load procedures.json into a NetworkX DiGraph for querying."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

import networkx as nx

from papertrail.schemas.procedure import Procedure

KG_DIR = Path(__file__).parent
PROCEDURES_PATH = KG_DIR / "procedures.json"

_graph: nx.DiGraph | None = None
_procedures: dict[str, Procedure] = {}


def _build_graph(procedures: list[dict[str, Any]]) -> nx.DiGraph:
    """Build a NetworkX DiGraph from raw procedure dicts."""
    g = nx.DiGraph()

    for p in procedures:
        pid = p["procedure_id"]
        g.add_node(pid, **p)

    for p in procedures:
        pid = p["procedure_id"]
        for dep in p.get("dependencies", []):
            g.add_edge(dep, pid, relation="DEPENDS_ON")
        for blk in p.get("blocks", []):
            g.add_edge(pid, blk, relation="BLOCKS")

    return g


def load_kg() -> nx.DiGraph:
    """Load the KG from disk. Cached after first call."""
    global _graph, _procedures

    if _graph is not None:
        return _graph

    raw = json.loads(PROCEDURES_PATH.read_text(encoding="utf-8"))
    _graph = _build_graph(raw)

    for p in raw:
        _procedures[p["procedure_id"]] = Procedure(**p)

    return _graph


def get_all_procedures() -> dict[str, Procedure]:
    """Return all procedures keyed by procedure_id."""
    load_kg()
    return dict(_procedures)


def get_procedure(procedure_id: str) -> Procedure | None:
    """Return a single procedure by ID."""
    load_kg()
    return _procedures.get(procedure_id)


def get_procedures_for_event(event_type: str) -> list[Procedure]:
    """Return all procedures triggered by a life event type.

    Mapping from life event types to the procedures they trigger.
    """
    load_kg()

    event_procedure_map: dict[str, list[str]] = {
        "death": [
            "tn_death_certificate",
            "tn_legal_heir_cert",
            "tn_succession_cert",
            "tn_pension_transfer",
            "tn_bank_kyc_update",
            "tn_property_mutation",
            "tn_aadhaar_deactivation",
            "tn_voter_roll_removal",
            "tn_ration_card_update",
            "tn_insurance_claim",
            "tn_it_final_return",
        ],
        "marriage": [
            "tn_marriage_registration",
            "tn_name_change_aadhaar",
            "tn_name_change_pan",
        ],
        "pension_claim": [
            "tn_widow_pension_application",
            "tn_widow_pension_renewal",
            "tn_widow_pension_grievance",
        ],
        "grievance": [
            "rti_filing",
            "tn_rts_complaint",
            "tn_lokayukta_complaint",
        ],
        "name_change": [
            "tn_name_change_aadhaar",
            "tn_name_change_pan",
        ],
    }

    pids = event_procedure_map.get(event_type, [])
    return [_procedures[pid] for pid in pids if pid in _procedures]


def get_dependencies(procedure_id: str) -> list[Procedure]:
    """Return procedures that must be completed before this one."""
    g = load_kg()
    if procedure_id not in g:
        return []

    deps = []
    for pred in g.predecessors(procedure_id):
        edge_data = g.edges[pred, procedure_id]
        if edge_data.get("relation") == "DEPENDS_ON":
            if pred in _procedures:
                deps.append(_procedures[pred])
    return deps


def get_dependents(procedure_id: str) -> list[Procedure]:
    """Return procedures that are blocked by this one."""
    g = load_kg()
    if procedure_id not in g:
        return []

    blocked = []
    for succ in g.successors(procedure_id):
        edge_data = g.edges[procedure_id, succ]
        if edge_data.get("relation") in ("BLOCKS", "DEPENDS_ON"):
            if succ in _procedures:
                blocked.append(_procedures[succ])
    return blocked


def get_topological_order(procedure_ids: list[str]) -> list[str]:
    """Return procedures in dependency order (topological sort)."""
    g = load_kg()
    subgraph = g.subgraph(procedure_ids)
    try:
        return list(nx.topological_sort(subgraph))
    except nx.NetworkXUnfeasible:
        return procedure_ids


def reload_kg() -> nx.DiGraph:
    """Force reload from disk."""
    global _graph, _procedures
    _graph = None
    _procedures = {}
    return load_kg()
