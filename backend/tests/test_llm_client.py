"""Tests for the LLM abstraction layer."""

import json
import pytest

from papertrail.llm.base import LLMResponse
from papertrail.llm.client import LLMClient
from papertrail.llm.deterministic_provider import DeterministicProvider
from papertrail.llm.exceptions import LLMParseError, LLMTimeoutError, LLMUnavailableError
from papertrail.llm.ollama_provider import OllamaProvider


# ── Deterministic Provider Tests ──────────────────────────────────────

class TestDeterministicProvider:
    @pytest.mark.asyncio
    async def test_generate_returns_response(self):
        provider = DeterministicProvider()
        resp = await provider.generate(prompt="hello")
        assert isinstance(resp, LLMResponse)
        assert resp.provider == "deterministic"
        assert resp.model == "deterministic"
        assert resp.latency_ms == 0

    @pytest.mark.asyncio
    async def test_generate_json_mode_returns_empty_json(self):
        provider = DeterministicProvider()
        resp = await provider.generate(prompt="hello", json_mode=True)
        assert resp.text == "{}"
        parsed = json.loads(resp.text)
        assert parsed == {}

    @pytest.mark.asyncio
    async def test_health_check_always_true(self):
        provider = DeterministicProvider()
        assert await provider.health_check() is True


# ── LLMClient Tests ──────────────────────────────────────────────────

class TestLLMClient:
    @pytest.mark.asyncio
    async def test_from_config(self):
        """LLMClient.from_config() should not crash."""
        client = LLMClient.from_config()
        assert client is not None

    @pytest.mark.asyncio
    async def test_deterministic_fallback_on_unavailable(self):
        """When primary provider fails, client falls back to deterministic."""

        class FailingProvider(DeterministicProvider):
            async def generate(self, **kwargs):
                raise LLMUnavailableError("test failure")

            async def health_check(self):
                return False

        client = LLMClient(
            provider=FailingProvider(),
            fallback=DeterministicProvider(),
            max_retries=1,
            fallback_enabled=True,
        )
        resp = await client.generate(prompt="hello")
        assert resp.provider == "deterministic"

    @pytest.mark.asyncio
    async def test_generate_json_with_deterministic(self):
        """JSON generation with deterministic provider returns empty dict."""
        client = LLMClient(
            provider=DeterministicProvider(),
            max_retries=1,
        )
        result = await client.generate_json(prompt="hello")
        assert result == {}

    @pytest.mark.asyncio
    async def test_health_check_deterministic(self):
        client = LLMClient(provider=DeterministicProvider())
        assert await client.health_check() is True

    @pytest.mark.asyncio
    async def test_raises_when_fallback_disabled(self):
        """Without fallback, exhausted retries should raise."""

        class FailingProvider(DeterministicProvider):
            async def generate(self, **kwargs):
                raise LLMUnavailableError("dead")

        client = LLMClient(
            provider=FailingProvider(),
            max_retries=1,
            fallback_enabled=False,
        )
        with pytest.raises(LLMUnavailableError):
            await client.generate(prompt="hello")


# ── Ollama Provider Tests (integration, requires running Ollama) ─────

class TestOllamaIntegration:
    """These tests require a running Ollama server with llama3.2:latest."""

    @pytest.fixture
    def provider(self):
        return OllamaProvider(
            host="http://localhost:11434",
            model="llama3.2:latest",
            timeout=60,
        )

    @pytest.mark.asyncio
    async def test_health_check(self, provider):
        result = await provider.health_check()
        if not result:
            pytest.skip("Ollama not available")
        assert result is True

    @pytest.mark.asyncio
    async def test_generate_simple(self, provider):
        if not await provider.health_check():
            pytest.skip("Ollama not available")
        resp = await provider.generate(
            prompt="Say 'hello' and nothing else.",
            max_tokens=20,
            temperature=0.1,
        )
        assert resp.provider == "ollama"
        assert resp.model == "llama3.2:latest"
        assert len(resp.text) > 0
        assert resp.latency_ms > 0

    @pytest.mark.asyncio
    async def test_generate_json_mode(self, provider):
        if not await provider.health_check():
            pytest.skip("Ollama not available")
        resp = await provider.generate(
            prompt='Return exactly this JSON: {"status": "ok"}',
            json_mode=True,
            max_tokens=50,
            temperature=0.1,
        )
        assert resp.provider == "ollama"
        parsed = json.loads(resp.text)
        assert "status" in parsed

    @pytest.mark.asyncio
    async def test_generate_with_system_prompt(self, provider):
        if not await provider.health_check():
            pytest.skip("Ollama not available")
        resp = await provider.generate(
            prompt="What is 2+2?",
            system="You are a calculator. Respond with only the number.",
            max_tokens=10,
            temperature=0.1,
        )
        assert "4" in resp.text
