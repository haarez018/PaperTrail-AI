from __future__ import annotations

from pydantic import BaseModel, Field


class DocumentRequired(BaseModel):
    name: str
    mandatory: bool = True
    where_to_get: str | None = None
    template_id: str | None = None


class DurationEstimate(BaseModel):
    min: int
    max: int


class Procedure(BaseModel):
    procedure_id: str
    name_en: str
    name_ta: str = ""
    issuing_authority: str = ""
    jurisdiction: str = "tn"
    applicable_when: str = ""
    dependencies: list[str] = Field(default_factory=list)
    blocks: list[str] = Field(default_factory=list)
    documents_required: list[DocumentRequired] = Field(default_factory=list)
    estimated_duration_days: DurationEstimate = Field(default_factory=lambda: DurationEstimate(min=7, max=30))
    fee_inr: int = 0
    form_template_id: str | None = None
    office_type: str = ""
    online_option_url: str | None = None
    common_rejection_reasons: list[str] = Field(default_factory=list)
    legal_basis: str = ""
    rti_template_id: str | None = None
