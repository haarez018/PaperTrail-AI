from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from nyayamitra.config import FRONTEND_URL

app = FastAPI(
    title="NyayaMitra API",
    description="Agentic AI system for navigating Indian government bureaucracy",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "nyayamitra"}
