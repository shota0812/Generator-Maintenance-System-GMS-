from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from security import get_db, get_current_user, get_current_admin


router = APIRouter(prefix="/jobs", tags=["Jobs"])


# =========================
# 案件一覧（承認済みユーザー）
# =========================

@router.get("", response_model=list[schemas.Job])
def get_jobs(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return db.query(models.Job).order_by(models.Job.date).all()


# =========================
# 案件作成（管理者のみ）
# =========================

@router.post("", response_model=schemas.Job)
def create_job(
    job: schemas.JobCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    db_job = models.Job(
        date=job.date,
        customer=job.customer,
        work=job.work,
        technician=job.technician,
        contractor=job.contractor,
        status=job.status,
    )

    db.add(db_job)
    db.commit()
    db.refresh(db_job)

    return db_job


# =========================
# 案件編集（管理者のみ）
# =========================

@router.put("/{job_id}", response_model=schemas.Job)
def update_job(
    job_id: int,
    job: schemas.JobCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
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
    db_job.status = job.status

    db.commit()
    db.refresh(db_job)

    return db_job


# =========================
# 案件削除（管理者のみ）
# =========================

@router.delete("/{job_id}")
def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
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