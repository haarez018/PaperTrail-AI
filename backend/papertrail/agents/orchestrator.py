"""Orchestrator — state machine coordinating all agents.

State flows:
  START -> intake -> planning -> [followup/document/navigate/escalate] -> done

Supports both sync (deterministic-only) and async (LLM-hybrid) paths.
"""

from __future__ import annotations

import logging
import re
import time
from typing import Any, TypedDict

from papertrail.agents.intake_agent import DeterministicIntake, IntakeAgent
from papertrail.agents.procedure_agent import build_procedure_plan
from papertrail.schemas.case_file import CaseFile, CaseStatus
from papertrail.schemas.plan import ProcedurePlan

logger = logging.getLogger(__name__)


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


# ─── Follow-up intent classifier ────────────────────────────────────────────

_RE_NEXT = re.compile(
    r"\b(next|start|begin|proceed|continue|how|process|steps?|guide|walk|explain|"
    r"do|what|first|go ahead|tell me|show me|help)\b",
    re.IGNORECASE,
)
_RE_STEP_N = re.compile(r"\bstep\s*(\d+)\b|\b(\d+)\s*(?:st|nd|rd|th)\s*step\b", re.IGNORECASE)
_RE_PLAN = re.compile(r"\b(plan|summary|overview|list|all procedures?|show)\b", re.IGNORECASE)
_RE_DONE = re.compile(r"\b(done|finished|completed?|marked?)\b", re.IGNORECASE)


def _followup_response(state: CaseState) -> str:
    """Build a rich conversational response for post-plan messages."""
    message = state["user_message"]
    plan_data = state.get("plan") or {}
    procedures = plan_data.get("procedures", [])

    from papertrail.kg.loader import get_procedure

    # ── Did the user say they completed something? ───────────────────────────
    if _RE_DONE.search(message):
        pending = [p for p in procedures if p.get("status") != "done"]
        if not pending:
            return (
                "🎉 **All done!** Congratulations — all your procedures are complete.\n\n"
                "Your name change is now officially registered. Keep copies of all receipts "
                "and certificates in a safe place.\n\n"
                "If you need anything else — another name change, pension, or property issue — "
                "just start a new conversation."
            )
        # Show the remaining steps
        next_p = pending[0]
        proc = get_procedure(next_p["procedure_id"])
        name = proc.name_en if proc else next_p["procedure_id"]
        remaining_names = []
        for p in pending[1:]:
            pr = get_procedure(p["procedure_id"])
            remaining_names.append(pr.name_en if pr else p["procedure_id"])
        lines = [
            f"✅ Great progress! Let's keep going.\n",
            f"**Up next → Step {next_p['order']}: {name}**",
        ]
        if remaining_names:
            lines.append(f"\nAfter that: {' → '.join(remaining_names)}")
        lines.append("\nType **\"how do I do this?\"** and I'll walk you through it step by step.")
        return "\n".join(lines)

    # ── Did the user ask about a specific step number? ───────────────────────
    m = _RE_STEP_N.search(message)
    if m:
        n = int(m.group(1) or m.group(2))
        match = next((p for p in procedures if p.get("order") == n), None)
        if match:
            return _procedure_walkthrough(match, procedures, get_procedure)

    # ── User wants the plan summary ──────────────────────────────────────────
    if _RE_PLAN.search(message) and not _RE_NEXT.search(message):
        lines = ["📋 **Here's your full plan:**\n"]
        for p in procedures:
            proc = get_procedure(p["procedure_id"])
            name = proc.name_en if proc else p["procedure_id"]
            status_icon = "✅" if p.get("status") == "done" else "⏳"
            lines.append(f"{status_icon} **Step {p['order']}**: {name}")
            if p.get("depends_on_procedure_ids"):
                lines.append(f"   ↳ Requires: {', '.join(p['depends_on_procedure_ids'])}")
        lines.append(
            "\nClick any procedure in the timeline on the right to generate forms, "
            "get navigation, or draft an RTI letter."
        )
        return "\n".join(lines)

    # ── "What next" after a step was just explained — advance to the next step ─
    # Look at the most recent agent message in history to see which step was
    # last discussed, so "what next" progresses rather than repeating step 1.
    if _RE_NEXT.search(message):
        history = state.get("messages") or []
        last_agent_content = next(
            (m.get("content", "") for m in reversed(history) if m.get("role") == "agent"),
            "",
        )
        last_step_match = re.search(r"## Step (\d+):", last_agent_content)
        if last_step_match:
            last_n = int(last_step_match.group(1))
            next_proc = next(
                (p for p in procedures if p.get("order") == last_n + 1), None
            )
            if next_proc:
                return _procedure_walkthrough(next_proc, procedures, get_procedure)
            # No next step → all explained
            return (
                "🎉 You've gone through all the steps!\n\n"
                "Click **Generate Form** on each procedure card in the timeline to get "
                "pre-filled PDFs ready to print and submit.\n\n"
                "Type **\"show my plan\"** for a full summary, or ask about any specific step."
            )

    # ── Default: guide them to the first pending step ────────────────────────
    pending = [p for p in procedures if p.get("status") != "done"]
    if not pending:
        return (
            "🎉 All your procedures are complete! If you need to handle anything else, "
            "start a new case from the home page."
        )

    return _procedure_walkthrough(pending[0], procedures, get_procedure)


def _procedure_walkthrough(
    plan_proc: dict,
    all_procedures: list[dict],
    get_proc_fn: Any,
) -> str:
    """Return a rich step-by-step walkthrough for a single procedure."""
    proc = get_proc_fn(plan_proc["procedure_id"])
    if not proc:
        return (
            f"Your next step is **{plan_proc['procedure_id']}**. "
            "Click it in the timeline to generate forms and get navigation help."
        )

    order = plan_proc.get("order", 1)
    lines = [
        f"## Step {order}: {proc.name_en}",
        "",
        f"**What this is:** {proc.applicable_when}",
        "",
        f"⏱️ **Time needed:** {proc.estimated_duration_days.min}–{proc.estimated_duration_days.max} days",
        f"💰 **Govt. fee:** Rs. {proc.fee_inr}",
        f"🏛️ **Office:** {proc.issuing_authority or proc.office_type or 'Local government office'}",
        "",
    ]

    # Documents checklist
    if proc.documents_required:
        lines.append("**📄 Documents to bring:**")
        for doc in proc.documents_required:
            req = " *(required)*" if doc.mandatory else " *(optional)*"
            where = f" — get from: {doc.where_to_get}" if doc.where_to_get else ""
            lines.append(f"• {doc.name}{req}{where}")
        lines.append("")

    # Step-by-step instructions
    lines.append("**📝 What to do:**")
    lines += [
        "1. Collect all documents listed above",
        f"2. Visit **{proc.issuing_authority or 'the office'}** — click **Navigate** on the timeline card to get the exact address, best time to visit, and what to say at the counter",
        f"3. Submit your application and pay Rs. {proc.fee_inr}",
        "4. Collect your **acknowledgement receipt** — keep it safely",
        f"5. Wait {proc.estimated_duration_days.min}–{proc.estimated_duration_days.max} days for the certificate",
        "6. If delayed beyond the deadline, click **Escalate** to auto-generate an RTI letter",
        "",
    ]

    # Rejection tips
    if proc.common_rejection_reasons:
        lines.append("**⚠️ Common reasons for rejection (avoid these):**")
        for reason in proc.common_rejection_reasons[:3]:
            lines.append(f"• {reason}")
        lines.append("")

    # Legal basis
    if proc.legal_basis:
        lines.append(f"**⚖️ Legal basis:** {proc.legal_basis}")
        lines.append("")

    # What's next
    pending_after = [
        p for p in all_procedures
        if p.get("order", 0) > order and p.get("status") != "done"
    ]
    if pending_after:
        next_p = pending_after[0]
        next_proc = get_proc_fn(next_p["procedure_id"])
        next_name = next_proc.name_en if next_proc else next_p["procedure_id"]
        lines.append(f"➡️ **After this:** Step {next_p['order']} — {next_name}")
        lines.append("")

    lines.append(
        "💡 **Quick action:** Click the procedure card in the timeline → "
        "**Generate Form** for a pre-filled PDF to print and take to the office."
    )

    return "\n".join(lines)


# ─── Orchestrator nodes ──────────────────────────────────────────────────────

def run_intake(state: CaseState) -> CaseState:
    """Run the deterministic intake agent to update the case file."""
    case_file = CaseFile(**state["case_file"])
    processor = DeterministicIntake(case_file)

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


async def run_intake_async(state: CaseState, llm_client: Any = None) -> CaseState:
    """Run the LLM-enhanced intake agent (falls back to deterministic)."""
    case_file = CaseFile(**state["case_file"])
    agent = IntakeAgent(llm_client=llm_client, case_file=case_file)

    case_file, next_question = await agent.process(state["user_message"])

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
    _t0 = time.monotonic()
    case_file = CaseFile(**state["case_file"])
    plan = build_procedure_plan(case_file)
    logger.debug(
        "run_procedure_agent: %dms  procedures=%d",
        int((time.monotonic() - _t0) * 1000),
        len(plan.procedures),
    )

    state["plan"] = plan.model_dump()
    state["case_file"]["status"] = CaseStatus.IN_PROGRESS.value
    state["current_agent"] = "done"

    # Build a human-readable summary
    lines = [
        f"✅ I've identified **{len(plan.procedures)} procedures** you need to complete.",
        f"",
        f"⏱️ Estimated timeline: **{plan.total_estimated_days} days** "
        f"(vs ~{plan.without_papertrail_baseline_days} days without PaperTrail AI)",
        f"💰 Estimated govt. fees: **Rs.{plan.total_estimated_cost_inr}** "
        f"(vs ~Rs.{plan.without_papertrail_baseline_cost_inr} in agent/middleman fees)",
        f"",
        f"**Here's your step-by-step plan:**",
        f"",
    ]

    from papertrail.kg.loader import get_procedure

    for p in plan.procedures:
        proc = get_procedure(p.procedure_id)
        name = proc.name_en if proc else p.procedure_id
        lines.append(f"**{p.order}. {name}**")
        lines.append(f"   {p.why_this_is_needed}")
        if p.depends_on_procedure_ids:
            deps = [
                (get_procedure(d).name_en if get_procedure(d) else d)
                for d in p.depends_on_procedure_ids
            ]
            lines.append(f"   ↳ *Requires: {', '.join(deps)}*")
        lines.append("")

    lines += [
        "---",
        "💬 **Type \"walk me through step 1\"** to get detailed instructions, or click any "
        "procedure in the timeline on the right to generate forms and get navigation help.",
    ]

    state["agent_response"] = "\n".join(lines)
    state["is_complete"] = True
    return state


def handle_followup(state: CaseState) -> CaseState:
    """Handle messages when a plan already exists — conversational guidance mode."""
    state["agent_response"] = _followup_response(state)
    state["current_agent"] = "navigation"
    state["is_complete"] = False
    return state


# ─── Main entry points ───────────────────────────────────────────────────────

def process_message(
    user_message: str,
    case_file: CaseFile | None = None,
    existing_plan: ProcedurePlan | None = None,
    history: list[dict] | None = None,
) -> CaseState:
    """Process a message synchronously (deterministic path).

    If a plan already exists, route to follow-up conversation handler instead
    of re-running intake + procedure agent (which would just repeat the plan).
    """
    state = create_initial_state(user_message, case_file)
    if history:
        state["messages"] = history

    if existing_plan:
        state["plan"] = existing_plan.model_dump()
        # Plan already built — answer follow-up questions conversationally
        state = handle_followup(state)
        return state

    # Normal intake → plan flow
    state = run_intake(state)

    if state["current_agent"] == "procedure":
        state = run_procedure_agent(state)

    return state


async def process_message_async(
    user_message: str,
    case_file: CaseFile | None = None,
    existing_plan: ProcedurePlan | None = None,
    llm_client: Any = None,
    history: list[dict] | None = None,
) -> CaseState:
    """Process a message asynchronously (LLM-hybrid path).

    Uses LLM for intake when available, deterministic for everything else.
    If a plan already exists, route to follow-up conversation handler.
    """
    state = create_initial_state(user_message, case_file)
    if history:
        state["messages"] = history

    if existing_plan:
        state["plan"] = existing_plan.model_dump()
        state = handle_followup(state)
        return state

    # Use async intake with LLM
    state = await run_intake_async(state, llm_client=llm_client)

    # Procedure agent stays deterministic (no LLM needed)
    if state["current_agent"] == "procedure":
        state = run_procedure_agent(state)

    return state
