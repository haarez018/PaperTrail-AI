"""Database session management."""

from __future__ import annotations

from pathlib import Path

from sqlmodel import Session, SQLModel, create_engine

from papertrail.config import DATABASE_URL

# Ensure data directory exists
_db_path = DATABASE_URL.replace("sqlite:///", "")
if _db_path.startswith("./"):
    Path(_db_path).parent.mkdir(parents=True, exist_ok=True)

engine = create_engine(DATABASE_URL, echo=False)


def init_db() -> None:
    """Create all tables."""
    SQLModel.metadata.create_all(engine)


def get_session() -> Session:
    """Get a new DB session."""
    return Session(engine)
