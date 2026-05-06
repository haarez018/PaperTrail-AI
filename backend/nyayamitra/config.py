import os

from dotenv import load_dotenv

load_dotenv()

LLM_API_KEY = os.getenv("LLM_API_KEY", "")
DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() == "true"
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/nyayamitra.db")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

MODEL_HEAVY = "llm-model-opus"
MODEL_LIGHT = "llm-model-haiku"
