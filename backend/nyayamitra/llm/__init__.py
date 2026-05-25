"""LLM abstraction layer — provider-agnostic client for PaperTrail AI agents."""

from nyayamitra.llm.client import LLMClient
from nyayamitra.llm.exceptions import LLMError, LLMParseError, LLMTimeoutError, LLMUnavailableError

__all__ = ["LLMClient", "LLMError", "LLMUnavailableError", "LLMTimeoutError", "LLMParseError"]
