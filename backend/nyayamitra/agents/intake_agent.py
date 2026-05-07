"""Intake Agent — builds a CaseFile from user conversation.

Two paths:
  1. LLM path (hybrid mode): Uses Ollama to understand natural language
     including Tamil, Hindi, Tanglish, and code-mixed input.
  2. Deterministic path: keyword extraction — always available as fallback.
"""

from __future__ import annotations

import json
import logging
import re
from pathlib import Path
from typing import Any

from nyayamitra.schemas.case_file import (
    CaseContext,
    CaseFile,
    CaseStatus,
    Language,
    LifeEvent,
    LifeEventType,
    Relationship,
    UploadedDocument,
    UserInfo,
)

logger = logging.getLogger(__name__)

PROMPT_PATH = Path(__file__).parent / "prompts" / "intake.txt"


# ═══════════════════════════════════════════════════════════════════════
# Deterministic keyword extraction (the original, always-available path)
# ═══════════════════════════════════════════════════════════════════════

_EVENT_KEYWORDS: dict[str, LifeEventType] = {
    "died": LifeEventType.DEATH,
    "death": LifeEventType.DEATH,
    "passed away": LifeEventType.DEATH,
    "passed": LifeEventType.DEATH,
    "expired": LifeEventType.DEATH,
    "lost": LifeEventType.DEATH,
    "marriage": LifeEventType.MARRIAGE,
    "married": LifeEventType.MARRIAGE,
    "wedding": LifeEventType.MARRIAGE,
    "pension": LifeEventType.PENSION_CLAIM,
    "widow pension": LifeEventType.PENSION_CLAIM,
    "rti": LifeEventType.GRIEVANCE,
    "complaint": LifeEventType.GRIEVANCE,
    "grievance": LifeEventType.GRIEVANCE,
    "ration card": LifeEventType.GRIEVANCE,
    "name change": LifeEventType.NAME_CHANGE,
    "property": LifeEventType.PROPERTY_PURCHASE,
    "birth": LifeEventType.BIRTH,
}

_RELATIONSHIP_KEYWORDS: dict[str, Relationship] = {
    "grandfather": Relationship.GRANDCHILD,
    "grandmother": Relationship.GRANDCHILD,
    "grandpa": Relationship.GRANDCHILD,
    "grandma": Relationship.GRANDCHILD,
    "thatha": Relationship.GRANDCHILD,
    "thaatha": Relationship.GRANDCHILD,
    "paatti": Relationship.GRANDCHILD,
    "father": Relationship.CHILD,
    "mother": Relationship.CHILD,
    "dad": Relationship.CHILD,
    "mom": Relationship.CHILD,
    "appa": Relationship.CHILD,
    "amma": Relationship.CHILD,
    "husband": Relationship.SPOUSE,
    "wife": Relationship.SPOUSE,
    "spouse": Relationship.SPOUSE,
    "brother": Relationship.SIBLING,
    "sister": Relationship.SIBLING,
}


def detect_language(text: str) -> Language:
    """Detect language from text content."""
    tamil_range = re.compile(r"[஀-௿]")
    hindi_range = re.compile(r"[ऀ-ॿ]")

    if tamil_range.search(text):
        return Language.TAMIL
    if hindi_range.search(text):
        return Language.HINDI
    return Language.ENGLISH


def extract_event_type(text: str) -> LifeEventType | None:
    """Extract life event type from user message."""
    lower = text.lower()
    for keyword, event in _EVENT_KEYWORDS.items():
        if keyword in lower:
            return event
    return None


def extract_relationship(text: str) -> Relationship | None:
    """Extract user's relationship to the subject."""
    lower = text.lower()
    for keyword, rel in _RELATIONSHIP_KEYWORDS.items():
        if keyword in lower:
            return rel
    return None


def extract_context(text: str) -> CaseContext:
    """Extract case context flags from user message."""
    lower = text.lower()
    return CaseContext(
        had_pension="pension" in lower or "yes pension" in lower,
        had_property="property" in lower or "house" in lower or "land" in lower,
        had_bank_accounts=_count_banks(lower),
        had_insurance="insurance" in lower or "lic" in lower or "policy" in lower,
        free_text=text,
    )


def _count_banks(text: str) -> int:
    """Count bank accounts mentioned."""
    match = re.search(r"(\d+)\s*bank\s*account", text)
    if match:
        return int(match.group(1))
    if "bank account" in text or "bank" in text:
        return 1
    return 0


def extract_location(text: str) -> str | None:
    """Extract location from text."""
    cities = [
        "chennai", "madurai", "coimbatore", "tiruchirappalli", "trichy",
        "salem", "tirunelveli", "erode", "vellore", "thoothukudi",
        "thanjavur", "dindigul", "saidapet", "tambaram", "adyar",
    ]
    lower = text.lower()
    for city in cities:
        if city in lower:
            return city.title() + ", Tamil Nadu"
    if "tamil nadu" in lower or "tamilnadu" in lower:
        return "Tamil Nadu"
    return None


# ═══════════════════════════════════════════════════════════════════════
# DeterministicIntake — the original class, untouched logic
# ═══════════════════════════════════════════════════════════════════════

class DeterministicIntake:
    """Processes user messages with pure keyword extraction.

    This is the original intake logic — zero LLM calls. Kept intact as
    the always-available fallback path.
    """

    def __init__(self, case_file: CaseFile | None = None):
        self.case = case_file or CaseFile()

    def process_message(self, message: str) -> tuple[CaseFile, str | None]:
        """Process a user message and return (case_file, next_question).

        next_question is None when intake is complete.
        """
        self.case.language = detect_language(message)

        if self.case.life_event.type is None:
            event = extract_event_type(message)
            if event:
                self.case.life_event.type = event

        if self.case.user.relationship_to_subject is None:
            rel = extract_relationship(message)
            if rel:
                self.case.user.relationship_to_subject = rel

        if self.case.life_event.location is None:
            loc = extract_location(message)
            if loc:
                self.case.life_event.location = loc
                self.case.user.state = "tn"

        new_context = extract_context(message)
        if new_context.had_pension:
            self.case.context.had_pension = True
        if new_context.had_property:
            self.case.context.had_property = True
        if new_context.had_bank_accounts > 0:
            self.case.context.had_bank_accounts = new_context.had_bank_accounts
        if new_context.had_insurance:
            self.case.context.had_insurance = True
        if new_context.free_text and not self.case.context.free_text:
            self.case.context.free_text = new_context.free_text

        next_q = self._get_next_question()
        if next_q is None:
            self.case.status = CaseStatus.PLANNING
        return self.case, next_q

    def _get_next_question(self) -> str | None:
        if self.case.life_event.type is None:
            return (
                "I'm here to help you navigate government procedures. "
                "Could you tell me what happened? For example: a death in the family, "
                "a marriage, a pension issue, or something else?"
            )
        if self.case.life_event.type == LifeEventType.DEATH:
            return self._death_questions()
        if self.case.life_event.type == LifeEventType.MARRIAGE:
            return self._marriage_questions()
        if self.case.life_event.type == LifeEventType.PENSION_CLAIM:
            return self._pension_questions()
        return None

    def _death_questions(self) -> str | None:
        if self.case.user.relationship_to_subject is None:
            return "I'm sorry for your loss. What was your relationship to the person who passed away?"
        if self.case.life_event.location is None:
            self.case.user.state = "tn"
            self.case.life_event.location = "Tamil Nadu"
        if self.case.context.had_pension is None:
            return "Was the deceased receiving any government pension?"
        if self.case.context.had_property is None:
            return "Did they own any property (house or land)?"
        if self.case.context.had_bank_accounts is None or self.case.context.had_bank_accounts == 0:
            return "How many bank accounts did they have?"
        return None

    def _marriage_questions(self) -> str | None:
        if self.case.life_event.location is None:
            self.case.user.state = "tn"
            self.case.life_event.location = "Tamil Nadu"
        return None

    def _pension_questions(self) -> str | None:
        if self.case.life_event.location is None:
            self.case.user.state = "tn"
            self.case.life_event.location = "Tamil Nadu"
        return None

    def is_complete(self) -> bool:
        return self.case.status == CaseStatus.PLANNING


# ═══════════════════════════════════════════════════════════════════════
# LLM-powered IntakeAgent — wraps DeterministicIntake with LLM layer
# ═══════════════════════════════════════════════════════════════════════

_EVENT_MAP: dict[str, LifeEventType] = {
    "death": LifeEventType.DEATH,
    "marriage": LifeEventType.MARRIAGE,
    "birth": LifeEventType.BIRTH,
    "property": LifeEventType.PROPERTY_PURCHASE,
    "name_change": LifeEventType.NAME_CHANGE,
    "pension": LifeEventType.PENSION_CLAIM,
    "grievance": LifeEventType.GRIEVANCE,
    "other": LifeEventType.OTHER,
}

_REL_MAP: dict[str, Relationship] = {
    "child": Relationship.CHILD,
    "grandchild": Relationship.GRANDCHILD,
    "spouse": Relationship.SPOUSE,
    "sibling": Relationship.SIBLING,
    "self": Relationship.SELF,
}

_LANG_MAP: dict[str, Language] = {
    "en": Language.ENGLISH,
    "ta": Language.TAMIL,
    "hi": Language.HINDI,
}


class IntakeAgent:
    """LLM-enhanced intake agent with deterministic fallback.

    In hybrid mode: tries LLM extraction first, falls back to keywords.
    In deterministic_only mode: goes straight to keyword extraction.
    """

    def __init__(self, llm_client: Any = None, case_file: CaseFile | None = None):
        from nyayamitra.config import LLM_MODE
        self._llm = llm_client
        self._mode = LLM_MODE
        self._deterministic = DeterministicIntake(case_file)
        self._case = case_file or CaseFile()

    async def process(self, message: str, case_file: CaseFile | None = None) -> tuple[CaseFile, str | None]:
        """Process a user message. Returns (updated_case_file, next_question)."""
        if case_file is not None:
            self._case = case_file
            self._deterministic = DeterministicIntake(case_file)

        if self._mode == "deterministic_only" or self._llm is None:
            return self._deterministic.process_message(message)

        # Try LLM extraction
        try:
            return await self._llm_process(message)
        except Exception as e:
            logger.warning("LLM intake failed, falling back to deterministic: %s", e)
            return self._deterministic.process_message(message)

    async def _llm_process(self, message: str) -> tuple[CaseFile, str | None]:
        """Use LLM to extract case info from natural language."""
        from nyayamitra.llm.prompts import load_prompt
        from nyayamitra.config import LLM_TEMPERATURE_INTAKE

        system_prompt = load_prompt("intake_system.txt")

        result = await self._llm.generate_json(
            prompt=message,
            system=system_prompt,
            temperature=LLM_TEMPERATURE_INTAKE,
            max_tokens=512,
        )

        # Apply LLM extractions to the case file
        self._apply_llm_result(result, message)

        # Determine next question
        needs_followup = result.get("needs_followup", True)
        followup = result.get("followup_question_in_user_language")

        if needs_followup and followup:
            return self._case, followup

        # If LLM says no followup needed, verify with deterministic check
        det = DeterministicIntake(self._case)
        _, det_question = det.process_message(message)
        if det_question:
            # LLM thought we were done but deterministic disagrees — use LLM
            # to generate a nicer version of the follow-up
            return self._case, await self._polish_followup(det_question)

        self._case.status = CaseStatus.PLANNING
        return self._case, None

    def _apply_llm_result(self, result: dict, original_message: str) -> None:
        """Apply LLM-extracted fields to the case file."""
        # Language
        lang_code = result.get("language_detected", "en")
        self._case.language = _LANG_MAP.get(lang_code, Language.ENGLISH)

        # Life event
        event_str = result.get("life_event")
        if event_str and self._case.life_event.type is None:
            event_type = _EVENT_MAP.get(event_str)
            if event_type:
                self._case.life_event.type = event_type

        # Subject name
        subject = result.get("subject_name")
        if subject and not self._case.life_event.subject_name:
            self._case.life_event.subject_name = subject

        # Relationship
        rel_str = result.get("user_relationship")
        if rel_str and self._case.user.relationship_to_subject is None:
            rel = _REL_MAP.get(rel_str)
            if rel:
                self._case.user.relationship_to_subject = rel

        # Location
        location = result.get("location")
        if location and not self._case.life_event.location:
            self._case.life_event.location = location
            self._case.user.state = "tn"

        # Context flags
        if result.get("had_pension") is True:
            self._case.context.had_pension = True
        if result.get("had_property") is True:
            self._case.context.had_property = True
        bank_count = result.get("had_bank_accounts")
        if bank_count is not None and isinstance(bank_count, int) and bank_count > 0:
            self._case.context.had_bank_accounts = bank_count
        if result.get("had_insurance") is True:
            self._case.context.had_insurance = True

        # Store original text
        if not self._case.context.free_text:
            self._case.context.free_text = original_message

    async def _polish_followup(self, deterministic_question: str) -> str:
        """Use LLM to make a deterministic follow-up warmer. Falls back to original."""
        try:
            from nyayamitra.llm.prompts import load_prompt

            lang_map = {Language.ENGLISH: "en", Language.TAMIL: "ta", Language.HINDI: "hi"}
            lang = lang_map.get(self._case.language, "en")

            prompt_template = load_prompt("intake_followup.txt")
            prompt = prompt_template.format(
                life_event=self._case.life_event.type.value if self._case.life_event.type else "unknown",
                known_fields=self._summarize_known(),
                missing_fields=self._summarize_missing(),
                language=lang,
            )

            resp = await self._llm.generate(
                prompt=prompt,
                temperature=0.4,
                max_tokens=200,
            )

            if resp.text.strip():
                return resp.text.strip()
        except Exception as e:
            logger.warning("Follow-up polish failed: %s", e)

        return deterministic_question

    def _summarize_known(self) -> str:
        """Summarize what we already know about the case."""
        parts = []
        if self._case.life_event.type:
            parts.append(f"event={self._case.life_event.type.value}")
        if self._case.user.relationship_to_subject:
            parts.append(f"relationship={self._case.user.relationship_to_subject.value}")
        if self._case.life_event.location:
            parts.append(f"location={self._case.life_event.location}")
        if self._case.context.had_pension:
            parts.append("pension=yes")
        if self._case.context.had_property:
            parts.append("property=yes")
        if self._case.context.had_bank_accounts:
            parts.append(f"banks={self._case.context.had_bank_accounts}")
        return ", ".join(parts) if parts else "nothing yet"

    def _summarize_missing(self) -> str:
        """Summarize what we still need."""
        missing = []
        if self._case.life_event.type is None:
            missing.append("life_event type")
        if self._case.user.relationship_to_subject is None:
            missing.append("relationship to subject")
        if self._case.life_event.location is None:
            missing.append("location")
        if self._case.context.had_pension is None:
            missing.append("pension status")
        if self._case.context.had_property is None:
            missing.append("property status")
        if not self._case.context.had_bank_accounts:
            missing.append("bank accounts count")
        return ", ".join(missing) if missing else "nothing - intake complete"


# ═══════════════════════════════════════════════════════════════════════
# Backward compatibility: IntakeProcessor alias
# ═══════════════════════════════════════════════════════════════════════

# The orchestrator uses IntakeProcessor synchronously — keep that working
IntakeProcessor = DeterministicIntake
