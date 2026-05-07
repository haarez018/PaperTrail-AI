"""Memory Agent — logs cases and enables pattern detection.

Uses ChromaDB for vector storage of anonymized case summaries.
LLM-enhanced summarization produces better embeddings for similarity
search, with deterministic fallback for raw field logging.
"""

from __future__ import annotations

import hashlib
import logging
from datetime import datetime
from typing import Any

from nyayamitra.schemas.case_file import CaseFile
from nyayamitra.schemas.plan import ProcedurePlan

logger = logging.getLogger(__name__)

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


def _summary_string(case_file: CaseFile, plan: ProcedurePlan | None = None) -> str:
    """Build a deterministic text summary from case fields."""
    event = case_file.life_event.type.value if case_file.life_event.type else "unknown"
    state = case_file.user.state or "unknown"
    num_procs = len(plan.procedures) if plan else 0
    est_days = plan.total_estimated_days if plan else 0

    return (
        f"Case: {event} in {state}. "
        f"Pension: {case_file.context.had_pension}, Property: {case_file.context.had_property}, "
        f"Banks: {case_file.context.had_bank_accounts}. "
        f"Plan: {num_procs} procedures, {est_days} days."
    )


def _build_metadata(case_file: CaseFile, plan: ProcedurePlan | None = None) -> dict:
    """Build anonymized metadata dict for ChromaDB storage."""
    return {
        "event_type": case_file.life_event.type.value if case_file.life_event.type else "unknown",
        "state": case_file.user.state or "unknown",
        "had_pension": case_file.context.had_pension or False,
        "had_property": case_file.context.had_property or False,
        "had_bank_accounts": case_file.context.had_bank_accounts or 0,
        "had_insurance": case_file.context.had_insurance or False,
        "num_procedures": len(plan.procedures) if plan else 0,
        "total_estimated_days": plan.total_estimated_days if plan else 0,
        "logged_at": datetime.now().isoformat(),
    }


# ═══════════════════════════════════════════════════════════════════════
# Synchronous (deterministic) API — original, always available
# ═══════════════════════════════════════════════════════════════════════

def log_case(case_file: CaseFile, plan: ProcedurePlan | None = None) -> str | None:
    """Log an anonymized case summary to ChromaDB (deterministic)."""
    if not _available or not _collection:
        return None

    doc_id = hashlib.sha256(case_file.case_id.encode()).hexdigest()[:16]
    text_summary = _summary_string(case_file, plan)
    metadata = _build_metadata(case_file, plan)

    _collection.upsert(
        ids=[doc_id],
        documents=[text_summary],
        metadatas=[metadata],
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


# ═══════════════════════════════════════════════════════════════════════
# Async (LLM-enhanced) API — better summaries for vector search
# ═══════════════════════════════════════════════════════════════════════

async def log_case_async(
    case_file: CaseFile,
    plan: ProcedurePlan | None = None,
    llm_client: Any = None,
) -> str | None:
    """Log a case with LLM-generated summary for better similarity matching.

    Falls back to deterministic summary if LLM is unavailable.
    """
    if not _available or not _collection:
        return None

    from nyayamitra.config import LLM_MODE

    doc_id = hashlib.sha256(case_file.case_id.encode()).hexdigest()[:16]
    metadata = _build_metadata(case_file, plan)

    # Try LLM summary
    text_summary = None
    if LLM_MODE == "hybrid" and llm_client is not None:
        try:
            from nyayamitra.llm.prompts import load_prompt

            prompt_template = load_prompt("memory_summarize.txt")
            # Build anonymized case JSON (no names/addresses)
            anon = {
                "event_type": metadata["event_type"],
                "state": metadata["state"],
                "had_pension": metadata["had_pension"],
                "had_property": metadata["had_property"],
                "had_bank_accounts": metadata["had_bank_accounts"],
                "had_insurance": metadata["had_insurance"],
                "num_procedures": metadata["num_procedures"],
                "total_estimated_days": metadata["total_estimated_days"],
            }
            prompt = prompt_template.format(case_json=str(anon))

            resp = await llm_client.generate(
                prompt=prompt,
                temperature=0.2,
                max_tokens=200,
            )

            if resp.text.strip() and resp.provider != "deterministic":
                text_summary = resp.text.strip()
                logger.info("LLM case summary generated (%d chars)", len(text_summary))
        except Exception as e:
            logger.warning("LLM summarization failed, using deterministic: %s", e)

    # Deterministic fallback
    if text_summary is None:
        text_summary = _summary_string(case_file, plan)

    _collection.upsert(
        ids=[doc_id],
        documents=[text_summary],
        metadatas=[metadata],
    )

    return doc_id
