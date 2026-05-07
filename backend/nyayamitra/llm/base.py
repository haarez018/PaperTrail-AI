"""Abstract base class for LLM providers + response model."""

from __future__ import annotations

from abc import ABC, abstractmethod

from pydantic import BaseModel


class LLMResponse(BaseModel):
    """Standardised response from any LLM provider."""

    text: str
    model: str
    provider: str
    tokens_estimated: int = 0
    latency_ms: int = 0
    finish_reason: str = "stop"


class LLMProvider(ABC):
    """Interface that every LLM backend must implement."""

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system: str | None = None,
        max_tokens: int = 1024,
        temperature: float = 0.3,
        json_mode: bool = False,
    ) -> LLMResponse:
        """Generate a completion. Raise LLMError on failure."""
        ...

    @abstractmethod
    async def health_check(self) -> bool:
        """Return True if the provider is reachable and the model is loaded."""
        ...
