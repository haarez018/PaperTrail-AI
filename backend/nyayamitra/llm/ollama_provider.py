"""Ollama LLM provider — calls a local Ollama server via HTTP."""

from __future__ import annotations

import json
import logging
import time

import httpx

from nyayamitra.llm.base import LLMProvider, LLMResponse
from nyayamitra.llm.exceptions import LLMTimeoutError, LLMUnavailableError

logger = logging.getLogger(__name__)


class OllamaProvider(LLMProvider):
    """Talks to a running ``ollama serve`` instance."""

    def __init__(self, host: str, model: str, timeout: int = 60) -> None:
        self.host = host.rstrip("/")
        self.model = model
        self.timeout = timeout

    # ------------------------------------------------------------------
    async def generate(
        self,
        prompt: str,
        system: str | None = None,
        max_tokens: int = 1024,
        temperature: float = 0.3,
        json_mode: bool = False,
    ) -> LLMResponse:
        payload: dict = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "num_predict": max_tokens,
                "temperature": temperature,
            },
        }
        if system:
            payload["system"] = system
        if json_mode:
            payload["format"] = "json"

        t0 = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(
                    f"{self.host}/api/generate",
                    json=payload,
                )
                resp.raise_for_status()
        except httpx.ConnectError as exc:
            raise LLMUnavailableError(f"Cannot reach Ollama at {self.host}: {exc}") from exc
        except httpx.TimeoutException as exc:
            raise LLMTimeoutError(f"Ollama timed out after {self.timeout}s: {exc}") from exc
        except httpx.HTTPStatusError as exc:
            raise LLMUnavailableError(f"Ollama HTTP {exc.response.status_code}: {exc}") from exc

        latency_ms = int((time.perf_counter() - t0) * 1000)
        data = resp.json()

        text = data.get("response", "").strip()
        eval_count = data.get("eval_count", 0)
        prompt_eval_count = data.get("prompt_eval_count", 0)

        return LLMResponse(
            text=text,
            model=self.model,
            provider="ollama",
            tokens_estimated=eval_count + prompt_eval_count,
            latency_ms=latency_ms,
            finish_reason="stop" if data.get("done") else "length",
        )

    # ------------------------------------------------------------------
    async def health_check(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(f"{self.host}/api/tags")
                resp.raise_for_status()
                models = [m["name"] for m in resp.json().get("models", [])]
                return self.model in models
        except Exception:
            return False
