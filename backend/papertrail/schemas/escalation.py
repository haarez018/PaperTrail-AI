from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class EscalationType(str, Enum):
    RTI = "rti"
    GRIEVANCE = "grievance"
    LOKAYUKTA = "lokayukta"
    RTS_ACT = "rts_act"


class EscalationLetter(BaseModel):
    type: EscalationType
    drafted_to: str = ""
    subject: str = ""
    body_en: str = ""
    body_ta: str = ""
    legal_citations: list[str] = Field(default_factory=list)
    expected_response_days: int = 30
    submission_methods: list[str] = Field(default_factory=list)
    fee_inr: int = 10
