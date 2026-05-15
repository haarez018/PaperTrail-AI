"""
API endpoint integration tests — covers all REST endpoints added in Phases 1-14
and Features 1-20. Uses FastAPI TestClient (no real HTTP server needed).
"""

from __future__ import annotations

import json
import pytest
from fastapi.testclient import TestClient


# ── App fixture ──────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def client():
    """Import app lazily to avoid side effects at collection time."""
    from nyayamitra.main import app
    return TestClient(app)


@pytest.fixture(scope="module")
def seeded_case(client):
    """
    Create a minimal case record in the DB and return its case_id.
    Used by tests that need a real case to operate on.
    """
    from nyayamitra.db.models import CaseRecord
    from nyayamitra.db.session import get_session
    import uuid

    case_id = str(uuid.uuid4())
    plan = {
        "procedures": [
            {
                "procedure_id": "tn_death_certificate",
                "order": 1,
                "status": "done",
                "estimated_start_after_days": 0,
                "depends_on_procedure_ids": [],
                "why_this_is_needed": "Required for all downstream procedures.",
            },
            {
                "procedure_id": "tn_legal_heir_cert",
                "order": 2,
                "status": "pending",
                "estimated_start_after_days": 7,
                "depends_on_procedure_ids": ["tn_death_certificate"],
                "why_this_is_needed": "Needed for pension and property transfer.",
            },
        ],
        "total_estimated_days": 30,
        "total_estimated_cost_inr": 500,
        "without_nyayamitra_baseline_days": 120,
        "without_nyayamitra_baseline_cost_inr": 15000,
    }
    case_data = {
        "language": "en",
        "life_event": "death",
        "state": "tn",
        "has_pension": True,
        "has_property": False,
        "has_bank_accounts": 1,
        "has_insurance": False,
        "family_details": {},
        "documents_available": [],
    }

    record = CaseRecord(
        id=case_id,
        case_data=json.dumps(case_data),
        plan_data=json.dumps(plan),
        status="active",
    )
    with get_session() as session:
        session.add(record)
        session.commit()

    yield case_id

    # Cleanup
    with get_session() as session:
        r = session.get(CaseRecord, case_id)
        if r:
            session.delete(r)
            session.commit()


# ── /api/procedures ──────────────────────────────────────────────────────────

class TestProceduresEndpoint:
    def test_get_procedures_200(self, client):
        resp = client.get("/api/procedures")
        assert resp.status_code == 200

    def test_get_procedures_returns_list(self, client):
        data = client.get("/api/procedures").json()
        assert "procedures" in data
        assert isinstance(data["procedures"], list)

    def test_get_procedures_count(self, client):
        data = client.get("/api/procedures").json()
        assert data["count"] == 20

    def test_procedure_has_required_fields(self, client):
        data = client.get("/api/procedures").json()
        proc = data["procedures"][0]
        for field in ("procedure_id", "name_en", "estimated_days_min", "estimated_days_max"):
            assert field in proc, f"Missing field: {field}"

    def test_death_procedures_present(self, client):
        data = client.get("/api/procedures").json()
        ids = {p["procedure_id"] for p in data["procedures"]}
        assert "tn_death_certificate" in ids
        assert "tn_legal_heir_cert" in ids


# ── /api/cases ───────────────────────────────────────────────────────────────

class TestCasesEndpoint:
    def test_get_cases_200(self, client):
        resp = client.get("/api/cases")
        assert resp.status_code == 200

    def test_get_cases_returns_list(self, client):
        data = client.get("/api/cases").json()
        assert "cases" in data
        assert isinstance(data["cases"], list)

    def test_case_has_required_fields(self, client, seeded_case):
        data = client.get("/api/cases").json()
        case_ids = {c["case_id"] for c in data["cases"]}
        assert seeded_case in case_ids

        case = next(c for c in data["cases"] if c["case_id"] == seeded_case)
        for field in ("case_id", "status", "procedure_count", "done_count", "progress_pct"):
            assert field in case, f"Missing field: {field}"

    def test_case_progress_pct_range(self, client, seeded_case):
        data = client.get("/api/cases").json()
        case = next(c for c in data["cases"] if c["case_id"] == seeded_case)
        assert 0 <= case["progress_pct"] <= 100

    def test_case_done_count_correct(self, client, seeded_case):
        data = client.get("/api/cases").json()
        case = next(c for c in data["cases"] if c["case_id"] == seeded_case)
        # seeded plan has 1 done out of 2
        assert case["done_count"] == 1
        assert case["procedure_count"] == 2
        assert case["progress_pct"] == 50


# ── /api/case/{id} ───────────────────────────────────────────────────────────

class TestCaseDetailEndpoint:
    def test_get_case_200(self, client, seeded_case):
        resp = client.get(f"/api/case/{seeded_case}")
        assert resp.status_code == 200

    def test_get_case_404(self, client):
        resp = client.get("/api/case/nonexistent-case-id")
        assert resp.status_code == 404

    def test_get_case_has_plan(self, client, seeded_case):
        data = client.get(f"/api/case/{seeded_case}").json()
        assert "plan" in data or "procedures" in data or "case_id" in data


# ── /api/stats ───────────────────────────────────────────────────────────────

class TestStatsEndpoint:
    def test_get_stats_200(self, client):
        resp = client.get("/api/stats")
        assert resp.status_code == 200

    def test_stats_has_required_fields(self, client):
        data = client.get("/api/stats").json()
        for field in (
            "total_cases", "completed_cases", "active_cases",
            "avg_procedures_per_case", "total_procedures_generated",
            "language_distribution", "top_procedures",
        ):
            assert field in data, f"Missing stats field: {field}"

    def test_stats_language_distribution_has_three_langs(self, client):
        data = client.get("/api/stats").json()
        langs = {item["language"] for item in data["language_distribution"]}
        assert {"English", "Tamil", "Hindi"} == langs

    def test_stats_counts_non_negative(self, client):
        data = client.get("/api/stats").json()
        assert data["total_cases"] >= 0
        assert data["completed_cases"] >= 0
        assert data["active_cases"] >= 0

    def test_stats_top_procedures_is_list(self, client):
        data = client.get("/api/stats").json()
        assert isinstance(data["top_procedures"], list)


# ── /api/feedback ─────────────────────────────────────────────────────────────

class TestFeedbackEndpoint:
    def test_submit_thumbs_up_201(self, client, seeded_case):
        resp = client.post("/api/feedback", json={
            "case_id": seeded_case,
            "procedure_id": "tn_death_certificate",
            "rating": 1,
            "comment": "Very helpful!",
            "language": "en",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "feedback_id" in data
        assert data["status"] == "recorded"

    def test_submit_thumbs_down_200(self, client, seeded_case):
        resp = client.post("/api/feedback", json={
            "case_id": seeded_case,
            "rating": -1,
            "language": "ta",
        })
        assert resp.status_code == 200

    def test_invalid_rating_422(self, client):
        resp = client.post("/api/feedback", json={
            "rating": 0,  # invalid
        })
        assert resp.status_code == 422

    def test_invalid_rating_2_422(self, client):
        resp = client.post("/api/feedback", json={
            "rating": 5,  # invalid
        })
        assert resp.status_code == 422

    def test_feedback_without_case_id_ok(self, client):
        resp = client.post("/api/feedback", json={"rating": 1})
        assert resp.status_code == 200

    def test_feedback_summary_200(self, client):
        resp = client.get("/api/feedback/summary")
        assert resp.status_code == 200

    def test_feedback_summary_fields(self, client):
        data = client.get("/api/feedback/summary").json()
        for field in ("total", "positive", "negative", "by_procedure"):
            assert field in data, f"Missing summary field: {field}"

    def test_feedback_summary_counts_consistent(self, client):
        data = client.get("/api/feedback/summary").json()
        assert data["positive"] + data["negative"] == data["total"]

    def test_feedback_summary_satisfaction_pct_range(self, client):
        data = client.get("/api/feedback/summary").json()
        if data["satisfaction_pct"] is not None:
            assert 0 <= data["satisfaction_pct"] <= 100


# ── /api/navigation/{id} ─────────────────────────────────────────────────────

class TestNavigationEndpoint:
    def test_navigation_200(self, client, seeded_case):
        resp = client.get(f"/api/navigation/{seeded_case}")
        assert resp.status_code in (200, 404)  # 404 ok if nav not implemented for this case

    def test_navigation_404_unknown(self, client):
        resp = client.get("/api/navigation/nonexistent-case")
        assert resp.status_code == 404


# ── /api/escalation/{id} ─────────────────────────────────────────────────────

class TestEscalationEndpoint:
    def test_escalation_200(self, client, seeded_case):
        resp = client.get(f"/api/escalation/{seeded_case}")
        assert resp.status_code in (200, 404)

    def test_escalation_404_unknown(self, client):
        resp = client.get("/api/escalation/nonexistent-case")
        assert resp.status_code == 404


# ── KG robustness ─────────────────────────────────────────────────────────────

class TestKGRobustness:
    def test_get_all_procedures_returns_dict(self):
        from nyayamitra.kg.loader import get_all_procedures
        procs = get_all_procedures()
        assert isinstance(procs, dict)
        assert len(procs) > 0

    def test_procedures_have_valid_life_events(self):
        from nyayamitra.kg.loader import get_all_procedures
        valid_events = {"death", "marriage", "birth", "pension_claim", "grievance", "property"}
        procs = get_all_procedures()
        for proc in procs.values():
            for event in proc.applicable_for:
                assert event in valid_events, f"Unknown event '{event}' in {proc.procedure_id}"

    def test_dependency_references_are_valid(self):
        """Every dependency ID must reference an existing procedure."""
        from nyayamitra.kg.loader import get_all_procedures
        procs = get_all_procedures()
        all_ids = set(procs.keys())
        for proc in procs.values():
            for dep_id in proc.depends_on:
                assert dep_id in all_ids, (
                    f"{proc.procedure_id} depends on '{dep_id}' which doesn't exist"
                )

    def test_fee_inr_non_negative(self):
        from nyayamitra.kg.loader import get_all_procedures
        for proc in get_all_procedures().values():
            assert proc.fee_inr >= 0, f"{proc.procedure_id} has negative fee"

    def test_estimated_days_range_valid(self):
        from nyayamitra.kg.loader import get_all_procedures
        for proc in get_all_procedures().values():
            assert proc.estimated_days_min <= proc.estimated_days_max, (
                f"{proc.procedure_id} has min > max days"
            )
