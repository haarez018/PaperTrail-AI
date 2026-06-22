import asyncio
import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from papertrail.api.routes_case import router as case_router
from papertrail.api.routes_chat import router as chat_router
from papertrail.api.routes_documents import router as documents_router
from papertrail.api.routes_export import router as export_router
from papertrail.api.routes_ocr import router as ocr_router
from papertrail.api.routes_reviews import router as reviews_router
from papertrail.config import FRONTEND_URL, LLM_MODE
from papertrail.db.session import init_db

logger = logging.getLogger(__name__)

# ── Global LLM status for the health endpoint ──
_llm_status: str = "unknown"   # "ok" | "unavailable" | "deterministic_only"


async def _warmup_llm() -> None:
    """Ping Ollama on startup so first real call is fast."""
    global _llm_status
    if LLM_MODE == "deterministic_only":
        _llm_status = "deterministic_only"
        logger.info("[startup] LLM mode: deterministic_only — warmup skipped")
        return
    try:
        from papertrail.llm.client import LLMClient
        client = LLMClient.from_config()
        t0 = time.perf_counter()
        ok = await asyncio.wait_for(client.health_check(), timeout=5.0)
        ms = int((time.perf_counter() - t0) * 1000)
        _llm_status = "ok" if ok else "unavailable"
        logger.info("[startup] LLM warmup: %s (%dms)", _llm_status, ms)
    except Exception as exc:
        _llm_status = "unavailable"
        logger.warning("[startup] LLM warmup failed: %s", exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize DB and warm up LLM on startup."""
    init_db()
    asyncio.create_task(_warmup_llm())
    yield


app = FastAPI(
    title="PaperTrail AI API",
    description="Agentic AI system for navigating Indian government bureaucracy",
    version="1.0.0",
    lifespan=lifespan,
)

_cors_origins = [
    FRONTEND_URL,
    "http://localhost:3000",
    "http://localhost:3001",
]
# Allow any Vercel preview / production deployment
_cors_regex = r"https://.*\.vercel\.app"

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_origin_regex=_cors_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(case_router)
app.include_router(documents_router)
app.include_router(export_router)
app.include_router(ocr_router)
app.include_router(reviews_router)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "papertrail-ai",
        "llm_mode": LLM_MODE,
        "llm_status": _llm_status,
    }
