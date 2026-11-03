from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import SessionLocal


router = APIRouter(
    prefix="/applications",
    tags=["Applications"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =========================
# 参加申請
# =========================

@router.post("", response_model=schemas.Application)
def create_application(
    application: schemas.ApplicationCreate,
    db: Session = Depends(get_db),
):
    # 案件の存在確認
    job = (
        db.query(models.Job)
        .filter(models.Job.id == application.job_id)
        .first()
    )

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found",
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

    # 二重申請防止
    existing = (
        db.query(models.Application)
        .filter(
            models.Application.job_id == application.job_id,
            models.Application.user_id == application.user_id,
        )
        .first()
    )

    if existing is not None:
        raise HTTPException(
            status_code=400,
            detail="Already applied",
        )

    db_application = models.Application(
        job_id=application.job_id,
        user_id=application.user_id,
        status="申請中",
    )

    db.add(db_application)
    db.commit()
    db.refresh(db_application)

    return db_application


# =========================
# 申請一覧
# =========================

@router.get("", response_model=list[schemas.Application])
def get_applications(
    db: Session = Depends(get_db),
):
    return db.query(models.Application).all()


# =========================
# 承認済み申請一覧
# =========================

@router.get(
    "/approved",
    response_model=list[schemas.ApprovedApplication],
)
def get_approved_applications(
    db: Session = Depends(get_db),
):
    return (
        db.query(models.Application)
        .filter(models.Application.status == "承認")
        .all()
    )


# =========================
# 管理者による承認・却下
# =========================

@router.put("/{application_id}/status")
def update_application_status(
    application_id: int,
    status: str,
    db: Session = Depends(get_db),
):
    application = (
        db.query(models.Application)
        .filter(models.Application.id == application_id)
        .first()
    )

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    if status not in ["承認", "却下"]:
        raise HTTPException(
            status_code=400,
            detail="Status must be 承認 or 却下",
        )

    application.status = status

    # 管理者が承認した場合
    if status == "承認":
        # 案件を確定
        application.job.status = "確定"

        # 承認されたユーザーを案件の担当者として登録
        application.job.technician = application.user.name
        application.job.contractor = application.user.company

    db.commit()
    db.refresh(application)

    return application