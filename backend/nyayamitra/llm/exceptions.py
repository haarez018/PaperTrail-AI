"""LLM-specific exceptions."""


class LLMError(Exception):
    """Base exception for all LLM errors."""


class LLMUnavailableError(LLMError):
    """Raised when the LLM provider is unreachable."""


class LLMTimeoutError(LLMError):
    """Raised when the LLM provider takes too long to respond."""


class LLMParseError(LLMError):
    """Raised when the LLM response cannot be parsed (e.g., invalid JSON)."""
