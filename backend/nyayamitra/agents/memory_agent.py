"""Memory Agent — logs cases and enables pattern detection.

Uses ChromaDB for vector storage of anonymized case summaries.
This allows the system to learn from past cases and suggest workarounds.
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime

from nyayamitra.schemas.case_file import CaseFile
from nyayamitra.schemas.plan import ProcedurePlan

try:
    import chromadb

    _client = chromadb.Client()
    _collection = _client.get_or_create_collection(
        name="nyayamitra_cases",
        metadata={"description": "Anonymized case summaries for pattern detection"},
    )
    _available = True
except Exception:
    _available = False
    _collection = None


def log_case(case_file: CaseFile, plan: ProcedurePlan | None = None) -> str | None:
    """Log an anonymized case summary to ChromaDB.

    Returns the document ID if successful, None otherwise.
    """
    if not _available or not _collection:
        return None

    # Anonymize: hash the case_id, remove names
    doc_id = hashlib.sha256(case_file.case_id.encode()).hexdigest()[:16]

    summary = {
        "event_type": case_file.life_event.type.value if case_file.life_event.type else "unknown",
        "state": case_file.user.state or "unknown",
        "had_pension": case_file.context.had_pension,
        "had_property": case_file.context.had_property,
        "had_bank_accounts": case_file.context.had_bank_accounts,
        "had_insurance": case_file.context.had_insurance,
        "num_procedures": len(plan.procedures) if plan else 0,
        "total_estimated_days": plan.total_estimated_days if plan else 0,
        "logged_at": datetime.now().isoformat(),
    }

    text_summary = (
        f"Case: {summary['event_type']} in {summary['state']}. "
        f"Pension: {summary['had_pension']}, Property: {summary['had_property']}, "
        f"Banks: {summary['had_bank_accounts']}. "
        f"Plan: {summary['num_procedures']} procedures, {summary['total_estimated_days']} days."
    )

    _collection.upsert(
        ids=[doc_id],
        documents=[text_summary],
        metadatas=[summary],
    )

    return doc_id


def query_similar_cases(event_type: str, n_results: int = 5) -> list[dict]:
    """Find similar past cases for pattern detection."""
    if not _available or not _collection:
        return []

    try:
        results = _collection.query(
            query_texts=[f"Case: {event_type}"],
            n_results=min(n_results, _collection.count() or 1),
        )

        cases = []
        if results and results["metadatas"]:
            for meta in results["metadatas"][0]:
                cases.append(meta)
        return cases
    except Exception:
        return []


def get_case_count() -> int:
    """Get total number of logged cases."""
    if not _available or not _collection:
        return 0
    return _collection.count()
