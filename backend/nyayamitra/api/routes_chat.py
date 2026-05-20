"""Chat endpoint — streaming SSE responses."""

from __future__ import annotations

import json
import logging
import time
from typing import AsyncGenerator

from fastapi import APIRouter
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from nyayamitra.agents.orchestrator import process_message, process_message_async
from nyayamitra.config import DEMO_MODE, LLM_MODE
from nyayamitra.db.models import CaseRecord
from nyayamitra.db.session import get_session
from nyayamitra.demo_cache import get_demo_response, match_demo_prompt
from nyayamitra.schemas.case_file import CaseFile, Language as CaseLanguage
from nyayamitra.schemas.plan import ProcedurePlan

_UI_LANG_MAP: dict[str, CaseLanguage] = {
    "en": CaseLanguage.ENGLISH,
    "ta": CaseLanguage.TAMIL,
    "hi": CaseLanguage.HINDI,
}

logger = logging.getLogger(__name__)

router = APIRouter()


class HistoryMessage(BaseModel):
    role: str  # "user" | "agent"
    content: str


class ChatRequest(BaseModel):
    case_id: str | None = None
    message: str
    language: str = "en"
    history: list[HistoryMessage] = []


async def _stream_response(request: ChatRequest) -> AsyncGenerator[dict, None]:
    """Generate SSE events for a chat message."""
    _t_start = time.monotonic()

    # 2.5 — Immediate ack so the browser sees first byte instantly
    yield {"event": "ack", "data": json.dumps({"status": "received"})}

    # Load existing case if any
    existing_plan = None

    if request.case_id:
        with get_session() as session:
            record = session.get(CaseRecord, request.case_id)
            if record:
                case_file = CaseFile(**json.loads(record.case_data))
                if record.plan_data:
                    existing_plan = ProcedurePlan(**json.loads(record.plan_data))
            else:
                case_file = CaseFile()
    else:
        case_file = CaseFile()

    # ALWAYS respect the UI language preference — never let the LLM override it.
    # This prevents the model from switching to Tamil because it sees "Chennai".
    case_file.language = _UI_LANG_MAP.get(request.language, CaseLanguage.ENGLISH)

    # Check demo mode
    if DEMO_MODE:
        demo_id = match_demo_prompt(request.message)
        if demo_id:
            demo = get_demo_response(demo_id)
            if demo:
                yield {"event": "agent_thinking", "data": json.dumps({"agent": "intake", "message": "Understanding your situation..."})}
                yield {"event": "agent_thinking", "data": json.dumps({"agent": "procedure", "message": "Building your procedure plan..."})}
                yield {"event": "agent_response", "data": json.dumps({"agent": "done", "content": demo["response"]})}
                yield {"event": "case_state_update", "data": json.dumps({"case": demo["case_file"]})}
                yield {"event": "plan_ready", "data": json.dumps({"plan": demo["plan"]})}
                yield {"event": "done", "data": json.dumps({"case_id": demo["case_file"]["case_id"]})}
                return

    # Signal agent thinking
    yield {"event": "agent_thinking", "data": json.dumps({"agent": "orchestrator", "message": "Processing..."})}

    # Convert history to plain dicts
    history_dicts = [{"role": h.role, "content": h.content} for h in request.history]

    # Run orchestrator — use async path if hybrid mode
    if LLM_MODE == "hybrid":
        try:
            from nyayamitra.llm.client import LLMClient
            llm_client = LLMClient.from_config()
            state = await process_message_async(
                user_message=request.message,
                case_file=case_file,
                existing_plan=existing_plan,
                llm_client=llm_client,
                history=history_dicts,
            )
        except Exception as e:
            logger.warning("Async orchestrator failed, falling back to sync: %s", e)
            state = process_message(
                user_message=request.message,
                case_file=case_file,
                existing_plan=existing_plan,
                history=history_dicts,
            )
    else:
        state = process_message(
            user_message=request.message,
            case_file=case_file,
            existing_plan=existing_plan,
            history=history_dicts,
        )

    updated_case = CaseFile(**state["case_file"])

    # A plan is "new" only if it was just generated this turn (no prior plan existed).
    # Follow-up turns carry the existing plan in state but must NOT re-emit plan_ready
    # (which would replay the sound and flicker the timeline on every message).
    plan_is_new = state.get("plan") and existing_plan is None

    # Signal which agent responded
    agent_name = state.get("current_agent", "orchestrator")
    if plan_is_new:
        yield {
            "event": "agent_thinking",
            "data": json.dumps({"agent": "procedure", "message": "Building your procedure plan..."}),
        }

    # Send the response
    yield {
        "event": "agent_response",
        "data": json.dumps({"agent": agent_name, "content": state["agent_response"]}),
    }

    # Send updated case state
    yield {
        "event": "case_state_update",
        "data": json.dumps({"case": state["case_file"]}),
    }

    # Only emit plan_ready for newly generated plans — not for every follow-up
    if plan_is_new:
        yield {
            "event": "plan_ready",
            "data": json.dumps({"plan": state["plan"]}),
        }

    # Persist case
    with get_session() as session:
        case_id = updated_case.case_id
        record = session.get(CaseRecord, case_id)
        if record:
            record.case_data = json.dumps(state["case_file"])
            if state.get("plan"):
                record.plan_data = json.dumps(state["plan"])
            record.status = updated_case.status.value
        else:
            record = CaseRecord(
                id=case_id,
                case_data=json.dumps(state["case_file"]),
                plan_data=json.dumps(state["plan"]) if state.get("plan") else None,
                status=updated_case.status.value,
            )
            session.add(record)
        session.commit()

    _elapsed_ms = int((time.monotonic() - _t_start) * 1000)
    logger.info("chat SSE end-to-end: %dms  agent=%s", _elapsed_ms, state.get("current_agent", "?"))

    # Signal done
    yield {
        "event": "done",
        "data": json.dumps({"case_id": updated_case.case_id}),
    }


@router.post("/api/chat")
async def chat(request: ChatRequest):
    """Streaming chat endpoint using Server-Sent Events."""
    return EventSourceResponse(_stream_response(request))
