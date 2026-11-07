from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from security import get_db, get_current_user
from models import PersonalEvent


router = APIRouter(
    prefix="/personal-events",
    tags=["personal-events"],
)


class PersonalEventCreate(BaseModel):
    date: str
    title: str
    description: str | None = None


# =========================
# 個人予定一覧（本人のみ）
# =========================

@router.get("/")
def get_personal_events(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return (
        db.query(PersonalEvent)
        .filter(PersonalEvent.user_id == current_user.id)
        .order_by(PersonalEvent.date)
        .all()
    )


# =========================
# 個人予定登録（本人のみ）
# =========================

@router.post("/")
def create_personal_event(
    event: PersonalEventCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    new_event = PersonalEvent(
        user_id=current_user.id,
        date=event.date,
        title=event.title,
        description=event.description,
    )

    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    return new_event


# =========================
# 個人予定削除（本人のみ）
# =========================

@router.delete("/{event_id}")
def delete_personal_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    event = (
        db.query(PersonalEvent)
        .filter(
            PersonalEvent.id == event_id,
            PersonalEvent.user_id == current_user.id,
        )
        .first()
    )

    if event is None:
        raise HTTPException(
            status_code=404,
            detail="個人予定が見つかりません",
        )

    db.delete(event)
    db.commit()

    return {"message": "個人予定を削除しました"}