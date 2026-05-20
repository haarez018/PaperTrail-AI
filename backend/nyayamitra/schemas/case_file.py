from __future__ import annotations

import random
import string
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


def _generate_case_id() -> str:
    """Generate a human-readable case ID like PT-2026-A3F7."""
    year = datetime.now().year
    chars = string.ascii_uppercase + string.digits
    suffix = "".join(random.choices(chars, k=4))
    return f"PT-{year}-{suffix}"


class Language(str, Enum):
    TAMIL = "ta"
    HINDI = "hi"
    ENGLISH = "en"


class LifeEventType(str, Enum):
    DEATH = "death"
    MARRIAGE = "marriage"
    BIRTH = "birth"
    PROPERTY_PURCHASE = "property_purchase"
    NAME_CHANGE = "name_change"
    PENSION_CLAIM = "pension_claim"
    GRIEVANCE = "grievance"
    OTHER = "other"


class Relationship(str, Enum):
    SELF = "self"
    GRANDCHILD = "grandchild"
    CHILD = "child"
    SPOUSE = "spouse"
    SIBLING = "sibling"
    OTHER = "other"


class CaseStatus(str, Enum):
    INTAKE = "intake"
    PLANNING = "planning"
    IN_PROGRESS = "in_progress"
    ESCALATED = "escalated"
    RESOLVED = "resolved"


class UserInfo(BaseModel):
    name: str | None = None
    age: int | None = None
    pincode: str | None = None
    state: str | None = None
    relationship_to_subject: Relationship | None = None


class LifeEvent(BaseModel):
    type: LifeEventType | None = None
    subject_name: str | None = None
    subject_age_at_event: int | None = None
    event_date: str | None = None
    location: str | None = None


class CaseContext(BaseModel):
    had_pension: bool | None = None
    had_property: bool | None = None
    had_bank_accounts: int | None = None
    had_insurance: bool | None = None
    free_text: str | None = None


class UploadedDocument(BaseModel):
    doc_type: str = "other"
    extracted_fields: dict = Field(default_factory=dict)
    confidence: float = 0.0


class CaseFile(BaseModel):
    case_id: str = Field(default_factory=_generate_case_id)
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    language: Language = Language.ENGLISH
    user: UserInfo = Field(default_factory=UserInfo)
    life_event: LifeEvent = Field(default_factory=LifeEvent)
    context: CaseContext = Field(default_factory=CaseContext)
    uploaded_documents: list[UploadedDocument] = Field(default_factory=list)
    status: CaseStatus = CaseStatus.INTAKE
