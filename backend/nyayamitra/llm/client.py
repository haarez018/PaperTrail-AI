"""LLMClient — the single entry-point that agents use for LLM calls.

Handles provider selection, retries, and automatic fallback to the
deterministic provider when the real one is unreachable.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Type

from pydantic import BaseModel

from nyayamitra.llm.base import LLMProvider, LLMResponse
from nyayamitra.llm.deterministic_provider import DeterministicProvider
from nyayamitra.llm.exceptions import (
    LLMError,
    LLMParseError,
    LLMTimeoutError,
    LLMUnavailableError,
)
from nyayamitra.llm.ollama_provider import OllamaProvider

logger = logging.getLogger(__name__)


class LLMClient:
    """Provider-agnostic client with retry + fallback logic."""

    def __init__(
        self,
        provider: LLMProvider,
        fallback: LLMProvider | None = None,
        max_retries: int = 2,
        fallback_enabled: bool = True,
    ) -> None:
        self.provider = provider
        self.fallback = fallback or DeterministicProvider()
        self.max_retries = max_retries
        self.fallback_enabled = fallback_enabled

    # ------------------------------------------------------------------
    # Factory
    # ------------------------------------------------------------------
    @classmethod
    def from_config(cls) -> "LLMClient":
        """Build a client from the current config.py settings."""
        from nyayamitra.config import (
            LLM_FALLBACK_TO_DETERMINISTIC,
            LLM_MAX_RETRIES,
            LLM_PROVIDER,
            OLLAMA_HOST,
            OLLAMA_MODEL,
            LLM_TIMEOUT_SECONDS,
        )

        if LLM_PROVIDER == "ollama":
            provider = OllamaProvider(
                host=OLLAMA_HOST,
                model=OLLAMA_MODEL,
                timeout=LLM_TIMEOUT_SECONDS,
            )
        else:
            provider = DeterministicProvider()

        return cls(
            provider=provider,
            fallback=DeterministicProvider(),
            max_retries=LLM_MAX_RETRIES,
            fallback_enabled=LLM_FALLBACK_TO_DETERMINISTIC,
        )

    # ------------------------------------------------------------------
    # Core generation
    # ------------------------------------------------------------------
    async def generate(
        self,
        prompt: str,
        system: str | None = None,
        max_tokens: int = 1024,
        temperature: float = 0.3,
        json_mode: bool = False,
    ) -> LLMResponse:
        """Generate text. Retries on failure, then falls back."""
        last_err: Exception | None = None

        for attempt in range(1, self.max_retries + 1):
            try:
                return await self.provider.generate(
                    prompt=prompt,
                    system=system,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    json_mode=json_mode,
                )
            except (LLMUnavailableError, LLMTimeoutError) as exc:
                last_err = exc
                logger.warning("LLM attempt %d/%d failed: %s", attempt, self.max_retries, exc)
            except LLMError as exc:
                last_err = exc
                logger.warning("LLM attempt %d/%d error: %s", attempt, self.max_retries, exc)

        # All retries exhausted — try fallback
        if self.fallback_enabled:
            logger.warning("LLM retries exhausted, falling back to deterministic provider")
            return await self.fallback.generate(
                prompt=prompt,
                system=system,
                max_tokens=max_tokens,
                temperature=temperature,
                json_mode=json_mode,
            )

        raise last_err or LLMUnavailableError("LLM unavailable after retries")

    # ------------------------------------------------------------------
    # Structured JSON generation
    # ------------------------------------------------------------------
    async def generate_json(
        self,
        prompt: str,
        system: str | None = None,
        schema: Type[BaseModel] | None = None,
        max_tokens: int = 1024,
        temperature: float = 0.3,
    ) -> dict[str, Any]:
        """Generate JSON and optionally validate against a Pydantic schema.

        Retries up to ``max_retries`` times if JSON is malformed.
        Returns the parsed dict (validated against *schema* if provided).
        """
        last_err: Exception | None = None

        for attempt in range(1, self.max_retries + 1):
            try:
                resp = await self.generate(
                    prompt=prompt,
                    system=system,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    json_mode=True,
                )

                text = resp.text.strip()

                # Some models wrap JSON in ```json ... ```
                if text.startswith("```"):
                    text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()

                parsed = json.loads(text)

                if schema is not None:
                    schema.model_validate(parsed)

                return parsed

            except json.JSONDecodeError as exc:
                last_err = LLMParseError(f"Invalid JSON on attempt {attempt}: {exc}")
                logger.warning("JSON parse failed (attempt %d/%d): %s", attempt, self.max_retries, exc)
            except Exception as exc:
                last_err = LLMParseError(f"Validation failed on attempt {attempt}: {exc}")
                logger.warning("Schema validation failed (attempt %d/%d): %s", attempt, self.max_retries, exc)

        # All retries exhausted — try deterministic fallback
        if self.fallback_enabled:
            logger.warning("JSON generation failed, falling back to deterministic")
            resp = await self.fallback.generate(
                prompt=prompt, system=system, json_mode=True,
            )
            return json.loads(resp.text) if resp.text.strip() else {}

        raise last_err or LLMParseError("Could not generate valid JSON")

    # ------------------------------------------------------------------
    # Health
    # ------------------------------------------------------------------
    async def health_check(self) -> bool:
        """Check if the primary provider is reachable."""
        return await self.provider.health_check()
