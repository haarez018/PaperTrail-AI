"""Demo mode cached responses for stage-reliable demos.

When DEMO_MODE=true, the system serves pre-recorded responses for known
demo prompts. This ensures the demo never fails due to API issues.
"""

from __future__ import annotations

import re

from nyayamitra.agents.procedure_agent import build_procedure_plan
from nyayamitra.schemas.case_file import (
    CaseContext,
    CaseFile,
    CaseStatus,
    Language,
    LifeEvent,
    LifeEventType,
    Relationship,
    UserInfo,
)

# Pre-built case for the primary demo scenario
DEMO_CASE = CaseFile(
    language=Language.ENGLISH,
    user=UserInfo(
        name="Demo User",
        age=21,
        pincode="600015",
        state="tn",
        relationship_to_subject=Relationship.GRANDCHILD,
    ),
    life_event=LifeEvent(
        type=LifeEventType.DEATH,
        subject_name="Rajendran K",
        subject_age_at_event=78,
        event_date="2026-04-30",
        location="Chennai, Tamil Nadu",
    ),
    context=CaseContext(
        had_pension=True,
        had_property=True,
        had_bank_accounts=2,
        had_insurance=False,
    ),
    status=CaseStatus.IN_PROGRESS,
)

# Keywords that trigger demo mode
_DEMO_PATTERNS = [
    (r"grandfather.*(?:passed|died|death)", "death_demo"),
    (r"grandmother.*(?:passed|died|death)", "death_demo"),
    (r"name.*change.*(?:marriage|aadhaar)", "marriage_demo"),
    (r"widow.*pension.*rejected", "pension_demo"),
    (r"rti.*ration", "rti_demo"),
]


def match_demo_prompt(message: str) -> str | None:
    """Check if a message matches a known demo prompt."""
    lower = message.lower()
    for pattern, demo_id in _DEMO_PATTERNS:
        if re.search(pattern, lower):
            return demo_id
    return None


def get_demo_response(demo_id: str) -> dict | None:
    """Get a pre-cached response for a demo scenario."""
    if demo_id == "death_demo":
        plan = build_procedure_plan(DEMO_CASE)
        return {
            "case_file": DEMO_CASE.model_dump(),
            "plan": plan.model_dump(),
            "response": _build_death_response(plan),
        }
    return None


def _build_death_response(plan) -> str:
    from nyayamitra.kg.loader import get_procedure

    lines = [
        "I'm so sorry for your loss. Let me help you handle everything.",
        "",
        f"I've identified **{len(plan.procedures)} procedures** your family needs to complete.",
        "",
        f"With PaperTrail AI: **~{plan.total_estimated_days} days, Rs.{plan.total_estimated_cost_inr} in govt. fees**",
        f"Without help: ~{plan.without_nyayamitra_baseline_days} days, Rs.{plan.without_nyayamitra_baseline_cost_inr} in agent fees",
        "",
        "Here's your step-by-step plan:",
        "",
    ]

    for p in plan.procedures:
        proc = get_procedure(p.procedure_id)
        name = proc.name_en if proc else p.procedure_id
        lines.append(f"**{p.order}. {name}**")
        lines.append(f"   {p.why_this_is_needed}")
        if p.depends_on_procedure_ids:
            deps = ", ".join(
                (get_procedure(d).name_en if get_procedure(d) else d)
                for d in p.depends_on_procedure_ids
            )
            lines.append(f"   _Depends on: {deps}_")
        lines.append("")

    lines.append("Click any procedure on the right to generate forms, get directions, or draft an RTI if needed.")

    return "\n".join(lines)
