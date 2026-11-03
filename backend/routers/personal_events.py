from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import SessionLocal
from models import PersonalEvent


router = APIRouter(
    prefix="/personal-events",
    tags=["personal-events"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class PersonalEventCreate(BaseModel):
    user_id: int
    date: str
    title: str
    description: str | None = None


@router.get("/")
def get_personal_events(
    user_id: int,
    db: Session = Depends(get_db),
):
    return (
        db.query(PersonalEvent)
        .filter(PersonalEvent.user_id == user_id)
        .order_by(PersonalEvent.date)
        .all()
    )


@router.post("/")
def create_personal_event(
    event: PersonalEventCreate,
    db: Session = Depends(get_db),
):
    new_event = PersonalEvent(
        user_id=event.user_id,
        date=event.date,
        title=event.title,
        description=event.description,
    )

    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    return new_event


@router.delete("/{event_id}")
def delete_personal_event(
    event_id: int,
    user_id: int,
    db: Session = Depends(get_db),
):
    event = (
        db.query(PersonalEvent)
        .filter(
            PersonalEvent.id == event_id,
            PersonalEvent.user_id == user_id,
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