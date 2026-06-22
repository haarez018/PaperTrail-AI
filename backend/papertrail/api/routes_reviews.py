"""Reviews API — submit, retrieve, and delete star ratings."""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from sqlmodel import select

from papertrail.config import ADMIN_SECRET
from papertrail.db.models import ReviewRecord
from papertrail.db.session import get_session

router = APIRouter()


class ReviewRequest(BaseModel):
    rating: int
    comment: str = ""
    case_id: str = ""
    user_id: str = ""
    procedure_name: str = ""
    language: str = "en"


@router.post("/api/reviews")
async def submit_review(request: ReviewRequest):
    if request.rating < 1 or request.rating > 5:
        raise HTTPException(status_code=422, detail="Rating must be between 1 and 5")

    review = ReviewRecord(
        rating=request.rating,
        comment=request.comment.strip(),
        case_id=request.case_id,
        user_id=request.user_id,
        procedure_name=request.procedure_name,
        language=request.language,
        created_at=datetime.now(),
    )
    with get_session() as session:
        session.add(review)
        session.commit()
        session.refresh(review)
        return {"status": "ok", "id": review.id}


@router.get("/api/reviews")
async def get_reviews():
    with get_session() as session:
        reviews = session.exec(
            select(ReviewRecord).order_by(ReviewRecord.created_at.desc())
        ).all()

    avg_rating = round(sum(r.rating for r in reviews) / len(reviews), 1) if reviews else 0
    distribution = {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
    for r in reviews:
        distribution[str(r.rating)] += 1

    return {
        "reviews": [
            {
                "id": r.id,
                "rating": r.rating,
                "comment": r.comment,
                "procedure_name": r.procedure_name,
                "language": r.language,
                "created_at": r.created_at.isoformat(),
            }
            for r in reviews
        ],
        "average_rating": avg_rating,
        "total_count": len(reviews),
        "distribution": distribution,
    }


@router.get("/api/reviews/summary")
async def get_summary():
    with get_session() as session:
        reviews = session.exec(select(ReviewRecord)).all()

    if not reviews:
        return {"average_rating": 0, "total_count": 0, "five_star_percentage": 0}

    avg = sum(r.rating for r in reviews) / len(reviews)
    five_star = len([r for r in reviews if r.rating == 5])

    return {
        "average_rating": round(avg, 1),
        "total_count": len(reviews),
        "five_star_percentage": round((five_star / len(reviews)) * 100),
    }


@router.delete("/api/reviews/{review_id}")
async def delete_own_review(review_id: int, user_id: str):
    """User self-service delete — only works when user_id matches the stored one."""
    with get_session() as session:
        review = session.get(ReviewRecord, review_id)
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")
        if not user_id or review.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not your review")
        session.delete(review)
        session.commit()
    return {"status": "ok"}


def _require_admin(key: str) -> None:
    if not ADMIN_SECRET or key != ADMIN_SECRET:
        raise HTTPException(status_code=401, detail="Invalid admin key")


@router.get("/api/admin/reviews")
async def admin_get_reviews(x_admin_key: str = Header(default="")):
    """Admin-only: full review list including user_id and case_id."""
    _require_admin(x_admin_key)
    with get_session() as session:
        reviews = session.exec(
            select(ReviewRecord).order_by(ReviewRecord.created_at.desc())
        ).all()

    avg = round(sum(r.rating for r in reviews) / len(reviews), 1) if reviews else 0
    distribution = {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
    for r in reviews:
        distribution[str(r.rating)] += 1

    return {
        "reviews": [
            {
                "id": r.id,
                "rating": r.rating,
                "comment": r.comment,
                "procedure_name": r.procedure_name,
                "language": r.language,
                "user_id": r.user_id,
                "case_id": r.case_id,
                "created_at": r.created_at.isoformat(),
            }
            for r in reviews
        ],
        "total_count": len(reviews),
        "average_rating": avg,
        "distribution": distribution,
    }


@router.delete("/api/admin/reviews/{review_id}")
async def admin_delete_review(review_id: int, x_admin_key: str = Header(default="")):
    """Admin-only: delete any review regardless of user_id."""
    _require_admin(x_admin_key)
    with get_session() as session:
        review = session.get(ReviewRecord, review_id)
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")
        session.delete(review)
        session.commit()
    return {"status": "ok"}
