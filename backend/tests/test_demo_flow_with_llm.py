"""End-to-end tests: full demo flow with LLM enabled and disabled."""

import pytest

from papertrail.agents.orchestrator import process_message, process_message_async
from papertrail.llm.client import LLMClient
from papertrail.llm.deterministic_provider import DeterministicProvider
from papertrail.llm.ollama_provider import OllamaProvider
from papertrail.schemas.case_file import CaseFile, LifeEventType


# ── Deterministic E2E (regression) ───────────────────────────────────

class TestDeterministicE2E:
    """Full flow using sync/deterministic path — must never regress."""

    def test_death_scenario_english(self):
        state = process_message(
            "My grandfather passed away, he had pension and property and 2 bank accounts"
        )
        case = CaseFile(**state["case_file"])
        assert case.life_event.type == LifeEventType.DEATH
        assert state.get("plan") is not None
        assert len(state["plan"]["procedures"]) > 0
        assert state["is_complete"] is True

    def test_marriage_scenario(self):
        state = process_message("I need to register my marriage in Chennai")
        case = CaseFile(**state["case_file"])
        assert case.life_event.type == LifeEventType.MARRIAGE
        assert state.get("plan") is not None

    def test_incomplete_message_asks_followup(self):
        state = process_message("someone died")
        assert state["current_agent"] == "intake"
        assert state["agent_response"]  # should have a follow-up question
        assert state["is_complete"] is False

    def test_pension_scenario(self):
        state = process_message("My widow pension was rejected in Chennai")
        case = CaseFile(**state["case_file"])
        assert case.life_event.type == LifeEventType.PENSION_CLAIM
        assert state.get("plan") is not None


# ── Async E2E with LLM ──────────────────────────────────────────────

class TestAsyncE2E:
    """Full flow using async/LLM path."""

    @pytest.fixture
    def llm_client(self):
        provider = OllamaProvider(
            host="http://localhost:11434",
            model="llama3.2:latest",
            timeout=60,
        )
        return LLMClient(
            provider=provider,
            fallback=DeterministicProvider(),
            max_retries=2,
            fallback_enabled=True,
        )

    @pytest.mark.asyncio
    async def test_death_scenario_with_llm(self, llm_client):
        if not await llm_client.health_check():
            pytest.skip("Ollama not available")
        state = await process_message_async(
            "My grandfather passed away last week, he had pension and property and 2 bank accounts",
            llm_client=llm_client,
        )
        case = CaseFile(**state["case_file"])
        assert case.life_event.type == LifeEventType.DEATH
        # With all info provided, should produce a plan
        assert state.get("plan") is not None
        assert state["is_complete"] is True

    @pytest.mark.asyncio
    async def test_deterministic_only_regression(self):
        """Async path with no LLM client falls back to deterministic."""
        state = await process_message_async(
            "My grandfather passed away, he had pension and property and 2 bank accounts",
            llm_client=None,
        )
        case = CaseFile(**state["case_file"])
        assert case.life_event.type == LifeEventType.DEATH
        assert state.get("plan") is not None

    @pytest.mark.asyncio
    async def test_natural_language_with_llm(self, llm_client):
        """Test that LLM understands informal/natural phrasing."""
        if not await llm_client.health_check():
            pytest.skip("Ollama not available")
        state = await process_message_async(
            "thatha passed away last week, what should I do",
            llm_client=llm_client,
        )
        case = CaseFile(**state["case_file"])
        assert case.life_event.type == LifeEventType.DEATH
