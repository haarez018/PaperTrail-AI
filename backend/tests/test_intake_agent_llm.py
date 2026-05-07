"""Tests for the LLM-enhanced intake agent."""

import pytest

from nyayamitra.agents.intake_agent import (
    DeterministicIntake,
    IntakeAgent,
    detect_language,
    extract_event_type,
    extract_relationship,
)
from nyayamitra.llm.client import LLMClient
from nyayamitra.llm.deterministic_provider import DeterministicProvider
from nyayamitra.llm.ollama_provider import OllamaProvider
from nyayamitra.schemas.case_file import CaseFile, Language, LifeEventType, Relationship


# ── Deterministic Path Tests (regression) ─────────────────────────────

class TestDeterministicIntake:
    """These tests verify the original keyword extraction is intact."""

    def test_death_keyword_extraction(self):
        intake = DeterministicIntake()
        case, q = intake.process_message("My grandfather passed away last week")
        assert case.life_event.type == LifeEventType.DEATH
        assert case.user.relationship_to_subject == Relationship.GRANDCHILD

    def test_marriage_keyword_extraction(self):
        intake = DeterministicIntake()
        case, q = intake.process_message("I need to register my marriage")
        assert case.life_event.type == LifeEventType.MARRIAGE

    def test_pension_keyword_extraction(self):
        intake = DeterministicIntake()
        case, q = intake.process_message("My widow pension was rejected")
        assert case.life_event.type == LifeEventType.PENSION_CLAIM

    def test_tamil_words_in_english(self):
        """Tanglish keywords (thatha, appa, amma) should work."""
        intake = DeterministicIntake()
        case, q = intake.process_message("my thatha died last week")
        assert case.life_event.type == LifeEventType.DEATH
        assert case.user.relationship_to_subject == Relationship.GRANDCHILD

    def test_context_extraction(self):
        intake = DeterministicIntake()
        case, q = intake.process_message(
            "My father passed away, he had pension and property and 2 bank accounts"
        )
        assert case.context.had_pension is True
        assert case.context.had_property is True
        assert case.context.had_bank_accounts == 2

    def test_complete_case_returns_none_question(self):
        """When all info is extracted, next_question should be None."""
        intake = DeterministicIntake()
        # First message — gets event + relationship
        case, q = intake.process_message(
            "My grandfather died, he had pension and property and 2 bank accounts"
        )
        # Should be complete (death + grandchild + pension + property + banks)
        assert q is None

    def test_language_detection_english(self):
        assert detect_language("My grandfather passed away") == Language.ENGLISH

    def test_language_detection_tamil(self):
        assert detect_language("என் தாத்தா இறந்துவிட்டார்") == Language.TAMIL

    def test_language_detection_hindi(self):
        assert detect_language("मेरे दादाजी गुज़र गए") == Language.HINDI


# ── LLM Path Tests (requires Ollama) ─────────────────────────────────

class TestIntakeAgentLLM:
    """These tests require a running Ollama server."""

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

    @pytest.fixture
    def det_client(self):
        """A client that always uses deterministic provider."""
        return LLMClient(
            provider=DeterministicProvider(),
            max_retries=1,
        )

    @pytest.mark.asyncio
    async def test_llm_extracts_death_event(self, llm_client):
        if not await llm_client.health_check():
            pytest.skip("Ollama not available")
        agent = IntakeAgent(llm_client=llm_client)
        case, q = await agent.process("My grandfather passed away last week, what should I do")
        assert case.life_event.type == LifeEventType.DEATH

    @pytest.mark.asyncio
    async def test_llm_extracts_relationship(self, llm_client):
        if not await llm_client.health_check():
            pytest.skip("Ollama not available")
        agent = IntakeAgent(llm_client=llm_client)
        case, q = await agent.process("thatha passed away last week")
        # LLM should understand thatha = grandfather = grandchild relationship
        assert case.user.relationship_to_subject in (Relationship.GRANDCHILD, Relationship.CHILD)

    @pytest.mark.asyncio
    async def test_fallback_when_llm_unavailable(self, det_client):
        """When LLM returns empty, falls back to deterministic extraction."""
        agent = IntakeAgent(llm_client=det_client)
        case, q = await agent.process("My grandfather passed away last week")
        # Deterministic fallback should still extract death + grandchild
        assert case.life_event.type == LifeEventType.DEATH
        assert case.user.relationship_to_subject == Relationship.GRANDCHILD

    @pytest.mark.asyncio
    async def test_deterministic_only_mode(self):
        """In deterministic_only mode, LLM is never called."""
        import nyayamitra.config as config
        original = config.LLM_MODE
        config.LLM_MODE = "deterministic_only"
        try:
            agent = IntakeAgent(llm_client=None)
            case, q = await agent.process("My grandfather passed away")
            assert case.life_event.type == LifeEventType.DEATH
        finally:
            config.LLM_MODE = original

    @pytest.mark.asyncio
    async def test_schema_parity(self, llm_client):
        """Both LLM and deterministic produce the same CaseFile schema."""
        if not await llm_client.health_check():
            pytest.skip("Ollama not available")

        msg = "My grandfather passed away, he had pension and property"

        # Deterministic
        det = DeterministicIntake()
        det_case, _ = det.process_message(msg)

        # LLM
        agent = IntakeAgent(llm_client=llm_client)
        llm_case, _ = await agent.process(msg)

        # Both should produce valid CaseFile with same schema
        assert type(det_case) == type(llm_case) == CaseFile
        # Event type should match
        assert det_case.life_event.type == llm_case.life_event.type == LifeEventType.DEATH
