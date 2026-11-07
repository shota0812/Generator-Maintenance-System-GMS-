from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from security import get_db, get_current_admin


router = APIRouter(
    prefix="/assignments",
    tags=["Assignments"],
)


# =========================
# 割り当て一覧（管理者のみ）
# =========================

@router.get("", response_model=list[schemas.JobAssignment])
def get_assignments(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    return db.query(models.JobAssignment).all()


# =========================
# 案件ごとの割り当て一覧（管理者のみ）
# =========================

@router.get(
    "/job/{job_id}",
    response_model=list[schemas.JobAssignment],
)
def get_job_assignments(
    job_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    return (
        db.query(models.JobAssignment)
        .filter(models.JobAssignment.job_id == job_id)
        .all()
    )


# =========================
# 担当者の割り当て（管理者のみ）
# =========================

@router.post("", response_model=schemas.JobAssignment)
def create_assignment(
    assignment: schemas.JobAssignmentCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
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

    if user.approval_status != "承認済み":
        raise HTTPException(
            status_code=403,
            detail="User is not approved",
        )

    date_application = (
        db.query(models.DateApplication)
        .filter(
            models.DateApplication.date == job.date,
            models.DateApplication.user_id == assignment.user_id,
            models.DateApplication.status == "承認",
        )
        .first()
    )

    if date_application is None:
        raise HTTPException(
            status_code=400,
            detail="Date application is not approved",
        )

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
# 割り当て解除（管理者のみ）
# =========================

@router.delete("/{assignment_id}")
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
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