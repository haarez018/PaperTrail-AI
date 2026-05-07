"""Intake Agent — builds a CaseFile from user conversation.

In demo/offline mode: parses user input deterministically.
With LLM: uses Ollama to conduct a warm, one-question-at-a-time conversation.
"""

from __future__ import annotations

import re
from pathlib import Path

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

PROMPT_PATH = Path(__file__).parent / "prompts" / "intake.txt"


# ---------- deterministic keyword extraction (works without LLM) ----------

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
    "father": Relationship.CHILD,
    "mother": Relationship.CHILD,
    "dad": Relationship.CHILD,
    "mom": Relationship.CHILD,
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
    # Common Tamil Nadu cities
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


class IntakeProcessor:
    """Processes user messages to build/update a CaseFile.

    Tracks what information is still missing and generates follow-up questions.
    """

    def __init__(self, case_file: CaseFile | None = None):
        self.case = case_file or CaseFile()
        self.questions_asked: list[str] = []

    def process_message(self, message: str) -> tuple[CaseFile, str | None]:
        """Process a user message and return updated CaseFile + next question.

        Returns (case_file, next_question). next_question is None when intake is complete.
        """
        self.case.language = detect_language(message)

        # Try to extract event type
        if self.case.life_event.type is None:
            event = extract_event_type(message)
            if event:
                self.case.life_event.type = event

        # Try to extract relationship
        if self.case.user.relationship_to_subject is None:
            rel = extract_relationship(message)
            if rel:
                self.case.user.relationship_to_subject = rel

        # Try to extract location
        if self.case.life_event.location is None:
            loc = extract_location(message)
            if loc:
                self.case.life_event.location = loc
                self.case.user.state = "tn"

        # Extract context
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

        # Generate next question
        next_q = self._get_next_question()

        if next_q is None:
            self.case.status = CaseStatus.PLANNING

        return self.case, next_q

    def _get_next_question(self) -> str | None:
        """Determine what to ask next based on missing fields."""
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
        """Check if we have enough info to generate a plan."""
        return self.case.status == CaseStatus.PLANNING
