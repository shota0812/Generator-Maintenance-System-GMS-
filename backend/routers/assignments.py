
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import SessionLocal


router = APIRouter(
    prefix="/assignments",
    tags=["Assignments"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =========================
# 割り当て一覧
# =========================

@router.get("", response_model=list[schemas.JobAssignment])
def get_assignments(
    db: Session = Depends(get_db),
):
    return db.query(models.JobAssignment).all()


# =========================
# 案件ごとの割り当て一覧
# =========================

@router.get(
    "/job/{job_id}",
    response_model=list[schemas.JobAssignment],
)
def get_job_assignments(
    job_id: int,
    db: Session = Depends(get_db),
):
    return (
        db.query(models.JobAssignment)
        .filter(models.JobAssignment.job_id == job_id)
        .all()
    )


# =========================
# 担当者の割り当て
# =========================

@router.post("", response_model=schemas.JobAssignment)
def create_assignment(
    assignment: schemas.JobAssignmentCreate,
    db: Session = Depends(get_db),
):
    # 案件の存在確認
    job = (
        db.query(models.Job)
        .filter(models.Job.id == assignment.job_id)
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
        .filter(models.User.id == assignment.user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    # 承認済み申請か確認
    application = (
        db.query(models.Application)
        .filter(
            models.Application.job_id == assignment.job_id,
            models.Application.user_id == assignment.user_id,
            models.Application.status == "承認",
        )
        .first()
    )

    if application is None:
        raise HTTPException(
            status_code=400,
            detail="Application is not approved",
        )

    # 二重割り当て防止
    existing = (
        db.query(models.JobAssignment)
        .filter(
            models.JobAssignment.job_id == assignment.job_id,
            models.JobAssignment.user_id == assignment.user_id,
        )
        .first()
    )

    if existing is not None:
        raise HTTPException(
            status_code=400,
            detail="Already assigned",
        )

    db_assignment = models.JobAssignment(
        job_id=assignment.job_id,
        user_id=assignment.user_id,
    )

    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)

    return db_assignment


# =========================
# 割り当て解除
# =========================

@router.delete("/{assignment_id}")
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
):
    assignment = (
        db.query(models.JobAssignment)
        .filter(models.JobAssignment.id == assignment_id)
        .first()
    )

    if assignment is None:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found",
        )

    db.delete(assignment)
    db.commit()

    return {
        "message": "Assignment deleted",
    }
