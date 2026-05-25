from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class ProcedureStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    BLOCKED = "blocked"
    ESCALATED = "escalated"


class PlannedProcedure(BaseModel):
    procedure_id: str
    order: int
    depends_on_procedure_ids: list[str] = Field(default_factory=list)
    why_this_is_needed: str = ""
    estimated_start_after_days: int = 0
    status: ProcedureStatus = ProcedureStatus.PENDING


class ProcedurePlan(BaseModel):
    case_id: str
    procedures: list[PlannedProcedure] = Field(default_factory=list)
    total_estimated_days: int = 0
    total_estimated_cost_inr: int = 0
    without_papertrail_baseline_days: int = 180
    without_papertrail_baseline_cost_inr: int = 15000
