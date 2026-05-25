"""End-to-end demo runner: hardcoded CaseFile -> ProcedurePlan.

Phase 2 verification: this should produce a valid plan for the death scenario.
"""

import json
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from papertrail.agents.procedure_agent import build_procedure_plan
from papertrail.schemas.case_file import (
    CaseContext,
    CaseFile,
    CaseStatus,
    Language,
    LifeEvent,
    LifeEventType,
    Relationship,
    UserInfo,
)


def main() -> None:
    # Hardcoded demo case: grandfather passed away in Chennai
    case = CaseFile(
        language=Language.ENGLISH,
        user=UserInfo(
            name="Haarez",
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
            free_text="Grandfather had a government pension, one house in Saidapet, two bank accounts in SBI and Indian Bank.",
        ),
        status=CaseStatus.PLANNING,
    )

    print("=" * 60)
    print("PaperTrail AI Demo - Death Scenario")
    print("=" * 60)
    print(f"\nCase: {case.life_event.subject_name} ({case.life_event.type.value})")
    print(f"Filed by: {case.user.name} ({case.user.relationship_to_subject.value})")
    print(f"Context: pension={case.context.had_pension}, property={case.context.had_property}, banks={case.context.had_bank_accounts}")
    print()

    plan = build_procedure_plan(case)

    print(f"Procedures found: {len(plan.procedures)}")
    print(f"Estimated total days: {plan.total_estimated_days}")
    print(f"Estimated total cost: Rs.{plan.total_estimated_cost_inr}")
    print(f"Without PaperTrail AI: ~{plan.without_papertrail_baseline_days} days, Rs.{plan.without_papertrail_baseline_cost_inr}")
    print()

    print("PROCEDURE PLAN:")
    print("-" * 60)
    for p in plan.procedures:
        deps = ", ".join(p.depends_on_procedure_ids) if p.depends_on_procedure_ids else "none"
        print(f"\n  {p.order}. {p.procedure_id}")
        print(f"     Depends on: {deps}")
        print(f"     Starts after day: {p.estimated_start_after_days}")
        print(f"     Why: {p.why_this_is_needed}")

    print("\n" + "=" * 60)
    print("Full ProcedurePlan JSON:")
    print("=" * 60)
    print(json.dumps(plan.model_dump(), indent=2))


if __name__ == "__main__":
    main()
