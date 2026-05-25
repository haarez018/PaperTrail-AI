"""LLM abstraction layer — provider-agnostic client for PaperTrail AI agents."""

from papertrail.llm.client import LLMClient
from papertrail.llm.exceptions import LLMError, LLMParseError, LLMTimeoutError, LLMUnavailableError

__all__ = ["LLMClient", "LLMError", "LLMUnavailableError", "LLMTimeoutError", "LLMParseError"]
