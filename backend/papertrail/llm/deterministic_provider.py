"""Deterministic (no-LLM) provider — returns canned responses.

Used when LLM_MODE=deterministic_only or as a fallback when the real
provider is unreachable.
"""

from __future__ import annotations

from papertrail.llm.base import LLMProvider, LLMResponse


class DeterministicProvider(LLMProvider):
    """Always returns a fixed response — zero network calls."""

    async def generate(
        self,
        prompt: str,
        system: str | None = None,
        max_tokens: int = 1024,
        temperature: float = 0.3,
        json_mode: bool = False,
    ) -> LLMResponse:
        # For JSON mode, return an empty JSON object so callers can parse
        text = "{}" if json_mode else ""
        return LLMResponse(
            text=text,
            model="deterministic",
            provider="deterministic",
            tokens_estimated=0,
            latency_ms=0,
            finish_reason="deterministic",
        )

    async def health_check(self) -> bool:
        return True
