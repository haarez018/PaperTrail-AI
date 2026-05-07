"""Unit tests for the Procedure Knowledge Graph."""

import pytest

from nyayamitra.kg.loader import (
    get_all_procedures,
    get_dependencies,
    get_dependents,
    get_procedure,
    get_procedures_for_event,
    get_topological_order,
    reload_kg,
)
from nyayamitra.tools.kg_tools import query_procedure_kg


@pytest.fixture(autouse=True)
def _fresh_kg():
    """Reload KG before each test to ensure clean state."""
    reload_kg()


class TestKGLoader:
    def test_load_all_procedures(self):
        procs = get_all_procedures()
        assert len(procs) == 20

    def test_get_procedure_by_id(self):
        proc = get_procedure("tn_legal_heir_cert")
        assert proc is not None
        assert proc.name_en == "Legal Heir Certificate"
        assert proc.jurisdiction == "tn"
        assert proc.fee_inr == 60

    def test_get_nonexistent_procedure(self):
        proc = get_procedure("nonexistent_procedure")
        assert proc is None


class TestDeathScenario:
    def test_death_returns_11_procedures(self):
        procs = get_procedures_for_event("death")
        assert len(procs) == 11
        ids = {p.procedure_id for p in procs}
        assert "tn_death_certificate" in ids
        assert "tn_legal_heir_cert" in ids
        assert "tn_succession_cert" in ids
        assert "tn_property_mutation" in ids

    def test_death_certificate_has_no_dependencies(self):
        deps = get_dependencies("tn_death_certificate")
        assert len(deps) == 0

    def test_legal_heir_depends_on_death_cert(self):
        deps = get_dependencies("tn_legal_heir_cert")
        dep_ids = {d.procedure_id for d in deps}
        assert "tn_death_certificate" in dep_ids

    def test_death_cert_blocks_multiple(self):
        blocked = get_dependents("tn_death_certificate")
        blocked_ids = {d.procedure_id for d in blocked}
        assert "tn_legal_heir_cert" in blocked_ids
        assert "tn_aadhaar_deactivation" in blocked_ids
        assert "tn_voter_roll_removal" in blocked_ids

    def test_topological_order_death_cert_first(self):
        ids = [
            "tn_legal_heir_cert",
            "tn_death_certificate",
            "tn_pension_transfer",
        ]
        ordered = get_topological_order(ids)
        assert ordered.index("tn_death_certificate") < ordered.index("tn_legal_heir_cert")
        assert ordered.index("tn_legal_heir_cert") < ordered.index("tn_pension_transfer")


class TestMarriageScenario:
    def test_marriage_returns_3_procedures(self):
        procs = get_procedures_for_event("marriage")
        assert len(procs) == 3

    def test_name_change_depends_on_marriage_reg(self):
        deps = get_dependencies("tn_name_change_aadhaar")
        dep_ids = {d.procedure_id for d in deps}
        assert "tn_marriage_registration" in dep_ids


class TestPensionScenario:
    def test_pension_returns_3_procedures(self):
        procs = get_procedures_for_event("pension_claim")
        assert len(procs) == 3


class TestRTIScenario:
    def test_grievance_returns_3_procedures(self):
        procs = get_procedures_for_event("grievance")
        assert len(procs) == 3


class TestQueryTool:
    def test_death_with_pension_and_property(self):
        results = query_procedure_kg(
            life_event="death",
            state="tn",
            has_pension=True,
            has_property=True,
            has_bank_accounts=2,
            has_insurance=False,
        )
        ids = {r["procedure_id"] for r in results}
        assert "tn_pension_transfer" in ids
        assert "tn_property_mutation" in ids
        assert "tn_bank_kyc_update" in ids
        assert "tn_insurance_claim" not in ids

    def test_death_without_pension_excludes_pension_transfer(self):
        results = query_procedure_kg(
            life_event="death",
            state="tn",
            has_pension=False,
            has_property=False,
            has_bank_accounts=0,
            has_insurance=False,
        )
        ids = {r["procedure_id"] for r in results}
        assert "tn_pension_transfer" not in ids
        assert "tn_property_mutation" not in ids
        assert "tn_bank_kyc_update" not in ids
        assert "tn_death_certificate" in ids
