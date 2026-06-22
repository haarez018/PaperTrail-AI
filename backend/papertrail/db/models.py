"""SQLModel database models for persisting cases."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlmodel import Field, SQLModel


class CaseRecord(SQLModel, table=True):
    """Persisted case record."""

    __tablename__ = "cases"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    case_data: str = "{}"  # JSON-serialized CaseFile
    plan_data: str | None = None  # JSON-serialized ProcedurePlan
    status: str = "intake"


class ReviewRecord(SQLModel, table=True):
    """Star rating review from a user."""

    __tablename__ = "reviews"

    id: int | None = Field(default=None, primary_key=True)
    rating: int
    comment: str = ""
    case_id: str = ""
    user_id: str = ""
    procedure_name: str = ""
    language: str = "en"
    created_at: datetime = Field(default_factory=datetime.now)


class FeedbackRecord(SQLModel, table=True):
    """User feedback on a procedure or overall plan."""

    __tablename__ = "feedback"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    created_at: datetime = Field(default_factory=datetime.now)
    case_id: str | None = None
    procedure_id: str | None = None  # None = overall plan rating
    rating: int  # 1 (thumbs up) or -1 (thumbs down)
    comment: str | None = None
    language: str = "en"
