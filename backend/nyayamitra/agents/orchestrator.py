"""Orchestrator — LangGraph-based state machine coordinating all agents.

State flows:
  START -> intake -> planning -> [document/navigate/escalate] -> done
"""

from __future__ import annotations

from typing import Any, TypedDict

from nyayamitra.agents.intake_agent import IntakeProcessor
from nyayamitra.agents.procedure_agent import build_procedure_plan
from nyayamitra.schemas.case_file import CaseFile, CaseStatus
from nyayamitra.schemas.plan import ProcedurePlan


class CaseState(TypedDict, total=False):
    """Shared state passed through the orchestrator."""

    case_file: dict
    plan: dict | None
    messages: list[dict]  # conversation history
    current_agent: str
    user_message: str
    agent_response: str
    is_complete: bool


def create_initial_state(user_message: str, case_file: CaseFile | None = None) -> CaseState:
    """Create initial state for a new conversation turn."""
    cf = case_file or CaseFile()
    return CaseState(
        case_file=cf.model_dump(),
        plan=None,
        messages=[],
        current_agent="intake",
        user_message=user_message,
        agent_response="",
        is_complete=False,
    )


def run_intake(state: CaseState) -> CaseState:
    """Run the intake agent to update the case file."""
    case_file = CaseFile(**state["case_file"])
    processor = IntakeProcessor(case_file)

    case_file, next_question = processor.process_message(state["user_message"])

    state["case_file"] = case_file.model_dump()

    if next_question:
        state["agent_response"] = next_question
        state["current_agent"] = "intake"
        state["is_complete"] = False
    else:
        state["current_agent"] = "procedure"
        state["is_complete"] = False

    return state


def run_procedure_agent(state: CaseState) -> CaseState:
    """Run the procedure agent to generate a plan."""
    case_file = CaseFile(**state["case_file"])
    plan = build_procedure_plan(case_file)

    state["plan"] = plan.model_dump()
    state["case_file"]["status"] = CaseStatus.IN_PROGRESS.value
    state["current_agent"] = "done"

    # Build a human-readable response
    lines = [
        f"I've identified **{len(plan.procedures)} procedures** your family needs to complete.",
        f"",
        f"Estimated timeline: **{plan.total_estimated_days} days** (vs ~{plan.without_nyayamitra_baseline_days} days without help)",
        f"Estimated cost: **Rs.{plan.total_estimated_cost_inr}** (vs ~Rs.{plan.without_nyayamitra_baseline_cost_inr} in agent fees)",
        f"",
        f"Here's your step-by-step plan:",
        f"",
    ]

    for p in plan.procedures:
        from nyayamitra.kg.loader import get_procedure

        proc = get_procedure(p.procedure_id)
        name = proc.name_en if proc else p.procedure_id
        lines.append(f"**{p.order}. {name}**")
        lines.append(f"   {p.why_this_is_needed}")
        if p.depends_on_procedure_ids:
            lines.append(f"   _Depends on: {', '.join(p.depends_on_procedure_ids)}_")
        lines.append("")

    state["agent_response"] = "\n".join(lines)
    state["is_complete"] = True
    return state


def process_message(
    user_message: str,
    case_file: CaseFile | None = None,
    existing_plan: ProcedurePlan | None = None,
) -> CaseState:
    """Process a single user message through the orchestrator.

    This is the main entry point for the chat API.
    """
    state = create_initial_state(user_message, case_file)

    if existing_plan:
        state["plan"] = existing_plan.model_dump()

    # Run intake
    state = run_intake(state)

    # If intake is done, run procedure agent
    if state["current_agent"] == "procedure":
        state = run_procedure_agent(state)

    return state
