"""Chat endpoint — streaming SSE responses."""

from __future__ import annotations

import json
import logging
from typing import AsyncGenerator

from fastapi import APIRouter
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from nyayamitra.agents.orchestrator import process_message, process_message_async
from nyayamitra.config import DEMO_MODE, LLM_MODE
from nyayamitra.db.models import CaseRecord
from nyayamitra.db.session import get_session
from nyayamitra.demo_cache import get_demo_response, match_demo_prompt
from nyayamitra.schemas.case_file import CaseFile
from nyayamitra.schemas.plan import ProcedurePlan

logger = logging.getLogger(__name__)

router = APIRouter()


class ChatRequest(BaseModel):
    case_id: str | None = None
    message: str
    language: str = "en"


async def _stream_response(request: ChatRequest) -> AsyncGenerator[dict, None]:
    """Generate SSE events for a chat message."""
    # Load existing case if any
    case_file = None
    existing_plan = None

    if request.case_id:
        with get_session() as session:
            record = session.get(CaseRecord, request.case_id)
            if record:
                case_file = CaseFile(**json.loads(record.case_data))
                if record.plan_data:
                    existing_plan = ProcedurePlan(**json.loads(record.plan_data))

    # Check demo mode
    if DEMO_MODE:
        demo_id = match_demo_prompt(request.message)
        if demo_id:
            demo = get_demo_response(demo_id)
            if demo:
                yield {"event": "agent_thinking", "data": json.dumps({"agent": "intake", "message": "Understanding your situation..."})}
                yield {"event": "agent_thinking", "data": json.dumps({"agent": "procedure", "message": "Building your procedure plan..."})}
                yield {"event": "agent_response", "data": json.dumps({"agent": "NyayaMitra", "content": demo["response"]})}
                yield {"event": "case_state_update", "data": json.dumps({"case": demo["case_file"]})}
                yield {"event": "plan_ready", "data": json.dumps({"plan": demo["plan"]})}
                yield {"event": "done", "data": json.dumps({"case_id": demo["case_file"]["case_id"]})}
                return

    # Signal agent thinking
    yield {"event": "agent_thinking", "data": json.dumps({"agent": "orchestrator", "message": "Processing..."})}

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
            )
        except Exception as e:
            logger.warning("Async orchestrator failed, falling back to sync: %s", e)
            state = process_message(
                user_message=request.message,
                case_file=case_file,
                existing_plan=existing_plan,
            )
    else:
        state = process_message(
            user_message=request.message,
            case_file=case_file,
            existing_plan=existing_plan,
        )

    updated_case = CaseFile(**state["case_file"])

    # Signal which agent responded
    agent_name = state.get("current_agent", "orchestrator")
    if state.get("plan"):
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

    # Send plan if ready
    if state.get("plan"):
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

    # Signal done
    yield {
        "event": "done",
        "data": json.dumps({"case_id": updated_case.case_id}),
    }


@router.post("/api/chat")
async def chat(request: ChatRequest):
    """Streaming chat endpoint using Server-Sent Events."""
    return EventSourceResponse(_stream_response(request))
