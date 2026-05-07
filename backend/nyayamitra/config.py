"""NyayaMitra configuration — loaded from .env file."""

import os
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv

_env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(_env_path, override=True)

# Application
DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() == "true"
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/nyayamitra.db")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# LLM Configuration
LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "ollama")
LLM_MODE: str = os.getenv("LLM_MODE", "hybrid")
OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2:latest")
LLM_TIMEOUT_SECONDS: int = int(os.getenv("LLM_TIMEOUT_SECONDS", "60"))
LLM_TEMPERATURE_INTAKE: float = float(os.getenv("LLM_TEMPERATURE_INTAKE", "0.4"))
LLM_TEMPERATURE_DOCUMENT: float = float(os.getenv("LLM_TEMPERATURE_DOCUMENT", "0.2"))
LLM_TEMPERATURE_ESCALATION: float = float(os.getenv("LLM_TEMPERATURE_ESCALATION", "0.2"))
LLM_MAX_RETRIES: int = int(os.getenv("LLM_MAX_RETRIES", "2"))
LLM_FALLBACK_TO_DETERMINISTIC: bool = os.getenv("LLM_FALLBACK_TO_DETERMINISTIC", "true").lower() == "true"
