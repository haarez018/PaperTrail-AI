"""PaperTrail AI configuration — loaded from .env file."""

import os
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv

_env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(_env_path, override=True)

# Application
DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() == "true"
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/papertrail.db")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# LLM Configuration
LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "ollama")
# "deterministic_only" = instant, zero-LLM, 100% reliable (DEFAULT)
# "hybrid"             = uses Ollama for polish when available (set LLM_MODE=hybrid in .env)
LLM_MODE: str = os.getenv("LLM_MODE", "deterministic_only")
OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2:latest")
LLM_TIMEOUT_SECONDS: int = int(os.getenv("LLM_TIMEOUT_SECONDS", "8"))   # fail fast
LLM_TEMPERATURE_INTAKE: float = float(os.getenv("LLM_TEMPERATURE_INTAKE", "0.4"))
LLM_TEMPERATURE_DOCUMENT: float = float(os.getenv("LLM_TEMPERATURE_DOCUMENT", "0.2"))
LLM_TEMPERATURE_ESCALATION: float = float(os.getenv("LLM_TEMPERATURE_ESCALATION", "0.2"))
LLM_MAX_RETRIES: int = int(os.getenv("LLM_MAX_RETRIES", "1"))            # 1 attempt only
LLM_FALLBACK_TO_DETERMINISTIC: bool = os.getenv("LLM_FALLBACK_TO_DETERMINISTIC", "true").lower() == "true"

# Token limits per agent (keep responses tight and fast)
LLM_MAX_TOKENS_INTAKE: int = int(os.getenv("LLM_MAX_TOKENS_INTAKE", "150"))
LLM_MAX_TOKENS_DOCUMENT: int = int(os.getenv("LLM_MAX_TOKENS_DOCUMENT", "400"))
LLM_MAX_TOKENS_ESCALATION: int = int(os.getenv("LLM_MAX_TOKENS_ESCALATION", "300"))
LLM_MAX_TOKENS_MEMORY: int = int(os.getenv("LLM_MAX_TOKENS_MEMORY", "200"))
