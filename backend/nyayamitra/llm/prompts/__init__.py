"""Prompt loader utility."""

from __future__ import annotations

from pathlib import Path

_PROMPT_DIR = Path(__file__).parent


def load_prompt(filename: str) -> str:
    """Load a prompt template from the prompts directory."""
    return (_PROMPT_DIR / filename).read_text(encoding="utf-8")
