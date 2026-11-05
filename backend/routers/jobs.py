from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import SessionLocal


router = APIRouter(prefix="/jobs", tags=["Jobs"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =========================
# 案件一覧
# =========================

@router.get("", response_model=list[schemas.Job])
def get_jobs(db: Session = Depends(get_db)):
    return db.query(models.Job).order_by(models.Job.date).all()


# =========================
# 案件作成
# =========================

@router.post("", response_model=schemas.Job)
def create_job(
    job: schemas.JobCreate,
    db: Session = Depends(get_db),
):
    db_job = models.Job(
        date=job.date,
        customer=job.customer,
        work=job.work,
        required_people=job.required_people,
        status=job.status,
        technician=job.technician,
        contractor=job.contractor,
    )

    db.add(db_job)
    db.commit()
    db.refresh(db_job)

    # 参加対象者を登録
    for user_id in job.target_user_ids:
        user = (
            db.query(models.User)
            .filter(models.User.id == user_id)
            .first()
        )

        if user is None:
            raise HTTPException(
                status_code=404,
                detail=f"User {user_id} not found",
            )

        target = models.JobTargetUser(
            job_id=db_job.id,
            user_id=user_id,
        )

        db.add(target)

    db.commit()
    db.refresh(db_job)

    return db_job


# =========================
# 案件編集
# =========================

@router.put("/{job_id}", response_model=schemas.Job)
def update_job(
    job_id: int,
    job: schemas.JobCreate,
    db: Session = Depends(get_db),
):
    db_job = (
        db.query(models.Job)
        .filter(models.Job.id == job_id)
        .first()
    )

    if db_job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found",
        )

    db_job.date = job.date
    db_job.customer = job.customer
    db_job.work = job.work
    db_job.technician = job.technician
    db_job.contractor = job.contractor
    db_job.required_people = job.required_people
    db_job.status = job.status

    # 既存の参加対象者を削除
    db.query(models.JobTargetUser).filter(
        models.JobTargetUser.job_id == job_id
    ).delete()

    # 新しい参加対象者を登録
    for user_id in job.target_user_ids:
        user = (
            db.query(models.User)
            .filter(models.User.id == user_id)
            .first()
        )

        if user is None:
            raise HTTPException(
                status_code=404,
                detail=f"User {user_id} not found",
            )

        target = models.JobTargetUser(
            job_id=job_id,
            user_id=user_id,
        )

        db.add(target)

    db.commit()
    db.refresh(db_job)

    return db_job


# =========================
# 案件削除
# =========================

@router.delete("/{job_id}")
def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
):
    db_job = (
        db.query(models.Job)
        .filter(models.Job.id == job_id)
        .first()
    )

    if db_job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found",
        )

    db.delete(db_job)
    db.commit()

    return {
        "message": "Deleted",
    }