from __future__ import annotations

from pydantic import BaseModel, Field


class Office(BaseModel):
    name: str
    address: str = ""
    lat_lng: list[float] = Field(default_factory=list)
    counter: str = ""
    hours: str = ""
    phone: str | None = None


class ConditionalAdvice(BaseModel):
    if_asked: str
    say: str


class NavigationPlan(BaseModel):
    procedure_id: str
    office: Office
    what_to_bring: list[str] = Field(default_factory=list)
    what_to_say: str = ""
    if_they_ask_X_say_Y: list[ConditionalAdvice] = Field(default_factory=list)
    average_wait_minutes: int = 60
    best_time_to_visit: str = ""
