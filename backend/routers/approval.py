from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from security import get_db, get_current_user, get_current_admin


router = APIRouter(
    prefix="/applications",
    tags=["Applications"],
)


# =========================
# 参加申請（ログインユーザー本人）
# =========================

@router.post("", response_model=schemas.Application)
def create_application(
    application: schemas.ApplicationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role != "外注":
        raise HTTPException(
            status_code=403,
            detail="外注ユーザーのみ申請できます",
        )

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

    existing = (
        db.query(models.Application)
        .filter(
            models.Application.job_id == application.job_id,
            models.Application.user_id == current_user.id,
        )
        .first()
    )

    if existing is not None:
        if existing.status == "却下":
            existing.status = "申請中"
            db.commit()
            db.refresh(existing)
            return existing

        raise HTTPException(
            status_code=400,
            detail="Already applied",
        )

    db_application = models.Application(
        job_id=application.job_id,
        user_id=current_user.id,
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
    current_user=Depends(get_current_user),
):
    query = db.query(models.Application)

    if current_user.role != "管理者":
        query = query.filter(
            models.Application.user_id == current_user.id
        )

    return query.all()


# =========================
# 承認・却下（管理者のみ）
# =========================

@router.put("/{application_id}/status")
def update_application_status(
    application_id: int,
    status: str,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
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

    db.commit()
    db.refresh(application)

    return application