
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import SessionLocal


router = APIRouter(
    prefix="/date-applications",
    tags=["Date Applications"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =========================
# 日付申請一覧
# =========================

@router.get("", response_model=list[schemas.DateApplication])
def get_date_applications(
    date: str | None = None,
    user_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.DateApplication)

    if date:
        query = query.filter(
            models.DateApplication.date == date
        )

    if user_id:
        query = query.filter(
            models.DateApplication.user_id == user_id
        )

    return query.all()


# =========================
# 日付単位の参加申請
# =========================

@router.post("", response_model=schemas.DateApplication)
def create_date_application(
    application: schemas.DateApplicationCreate,
    db: Session = Depends(get_db),
):
    if application.available_people < 1:
        raise HTTPException(
            status_code=400,
            detail="Available people must be at least 1",
        )

    job = (
        db.query(models.Job)
        .filter(models.Job.date == application.date)
        .first()
    )

    if job is None:
        raise HTTPException(
            status_code=400,
            detail="No jobs on this date",
        )

    user = (
        db.query(models.User)
        .filter(models.User.id == application.user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    if user.approval_status != "承認済み":
        raise HTTPException(
            status_code=403,
            detail="User is not approved",
        )

    existing = (
        db.query(models.DateApplication)
        .filter(
            models.DateApplication.date == application.date,
            models.DateApplication.user_id == application.user_id,
        )
        .first()
    )

    if existing is not None:
        if existing.status == "却下":
            existing.status = "申請中"
            existing.available_people = application.available_people
            existing.confirmed_people = 0
            db.commit()
            db.refresh(existing)
            return existing

        raise HTTPException(
            status_code=400,
            detail="Already applied for this date",
        )

    db_application = models.DateApplication(
        date=application.date,
        user_id=application.user_id,
        status="申請中",
        available_people=application.available_people,
        confirmed_people=0,
    )

    db.add(db_application)
    db.commit()
    db.refresh(db_application)

    return db_application


# =========================
# 申請中の人数変更（取引先）
# =========================

@router.put("/{application_id}")
def update_date_application(
    application_id: int,
    update: schemas.DateApplicationUpdate,
    db: Session = Depends(get_db),
):
    application = (
        db.query(models.DateApplication)
        .filter(
            models.DateApplication.id == application_id
        )
        .first()
    )

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Date application not found",
        )

    if application.user_id != update.user_id:
        raise HTTPException(
            status_code=403,
            detail="Not your application",
        )

    if application.status != "申請中":
        raise HTTPException(
            status_code=400,
            detail="Cannot edit after admin decision",
        )

    if update.available_people < 1:
        raise HTTPException(
            status_code=400,
            detail="Available people must be at least 1",
        )

    application.available_people = update.available_people

    db.commit()
    db.refresh(application)

    return application


# =========================
# 管理者による承認・却下
# =========================

@router.put("/{application_id}/status")
def update_date_application_status(
    application_id: int,
    decision: schemas.DateApplicationDecision,
    db: Session = Depends(get_db),
):
    application = (
        db.query(models.DateApplication)
        .filter(
            models.DateApplication.id == application_id
        )
        .first()
    )

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Date application not found",
        )

    if decision.status not in ["承認", "却下"]:
        raise HTTPException(
            status_code=400,
            detail="Status must be 承認 or 却下",
        )

    if decision.status == "承認":
        if decision.confirmed_people < 1:
            raise HTTPException(
                status_code=400,
                detail="Confirmed people must be at least 1",
            )

        if decision.confirmed_people > application.available_people:
            raise HTTPException(
                status_code=400,
                detail="Confirmed people cannot exceed available people",
            )

        application.status = "承認"
        application.confirmed_people = decision.confirmed_people

    else:
        application.status = "却下"
        application.confirmed_people = 0

    db.commit()
    db.refresh(application)

    return application


# =========================
# 承認後の確定人数変更（管理者）
# =========================

@router.put("/{application_id}/confirmed-people")
def update_confirmed_people(
    application_id: int,
    confirmed_people: int,
    db: Session = Depends(get_db),
):
    application = (
        db.query(models.DateApplication)
        .filter(
            models.DateApplication.id == application_id
        )
        .first()
    )

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Date application not found",
        )

    if application.status != "承認":
        raise HTTPException(
            status_code=400,
            detail="Only approved applications can be changed",
        )

    if confirmed_people < 1:
        raise HTTPException(
            status_code=400,
            detail="Confirmed people must be at least 1",
        )

    if confirmed_people > application.available_people:
        raise HTTPException(
            status_code=400,
            detail="Confirmed people cannot exceed available people",
        )

    application.confirmed_people = confirmed_people

    db.commit()
    db.refresh(application)

    return application
