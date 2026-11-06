
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

@router.post(
    "",
    response_model=schemas.DateApplication,
)
def create_date_application(
    application: schemas.DateApplicationCreate,
    db: Session = Depends(get_db),
):
    # その日に案件が存在するか確認
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

    # ユーザーの存在確認
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

    # アカウント承認確認
    if user.approval_status != "承認済み":
        raise HTTPException(
            status_code=403,
            detail="User is not approved",
        )

    # 既存申請の確認
    existing = (
        db.query(models.DateApplication)
        .filter(
            models.DateApplication.date == application.date,
            models.DateApplication.user_id == application.user_id,
        )
        .first()
    )

    if existing is not None:
        # 却下済みの場合は再申請
        if existing.status == "却下":
            existing.status = "申請中"
            db.commit()
            db.refresh(existing)
            return existing

        raise HTTPException(
            status_code=400,
            detail="Already applied for this date",
        )

    # 日付申請を登録
    db_application = models.DateApplication(
        date=application.date,
        user_id=application.user_id,
        status="申請中",
    )

    db.add(db_application)
    db.commit()
    db.refresh(db_application)

    return db_application


# =========================
# 管理者による承認・却下
# =========================

@router.put("/{application_id}/status")
def update_date_application_status(
    application_id: int,
    status: str,
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

    if status not in ["承認", "却下"]:
        raise HTTPException(
            status_code=400,
            detail="Status must be 承認 or 却下",
        )

    application.status = status

    db.commit()
    db.refresh(application)

    return application
