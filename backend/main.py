from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from nyayamitra.api.routes_case import router as case_router
from nyayamitra.api.routes_chat import router as chat_router
from nyayamitra.api.routes_documents import router as documents_router
from nyayamitra.config import FRONTEND_URL
from nyayamitra.db.session import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize DB on startup."""
    init_db()
    yield


app = FastAPI(
    title="NyayaMitra API",
    description="Agentic AI system for navigating Indian government bureaucracy",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(case_router)
app.include_router(documents_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "nyayamitra"}
