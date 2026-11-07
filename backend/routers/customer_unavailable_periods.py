
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from security import get_db, get_current_user, get_current_admin
from models import CustomerUnavailablePeriod
from schemas import (
    CustomerUnavailablePeriodCreate,
    CustomerUnavailablePeriodUpdate,
)


router = APIRouter(
    prefix="/customer-unavailable-periods",
    tags=["customer-unavailable-periods"],
)


# =========================
# 作業不可期間一覧（ログインユーザー）
# =========================

@router.get("/")
def get_periods(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return (
        db.query(CustomerUnavailablePeriod)
        .order_by(CustomerUnavailablePeriod.start_date)
        .all()
    )


# =========================
# 作業不可期間登録（管理者のみ）
# =========================

@router.post("/")
def create_period(
    period: CustomerUnavailablePeriodCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    if period.start_date > period.end_date:
        raise HTTPException(
            status_code=400,
            detail="終了日は開始日以降にしてください",
        )

    new_period = CustomerUnavailablePeriod(
        customer=period.customer,
        start_date=period.start_date,
        end_date=period.end_date,
        reason=period.reason,
    )

    db.add(new_period)
    db.commit()
    db.refresh(new_period)

    return new_period


# =========================
# 作業不可期間編集（管理者のみ）
# =========================

@router.put("/{period_id}")
def update_period(
    period_id: int,
    period: CustomerUnavailablePeriodUpdate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    existing_period = (
        db.query(CustomerUnavailablePeriod)
        .filter(CustomerUnavailablePeriod.id == period_id)
        .first()
    )

    if existing_period is None:
        raise HTTPException(
            status_code=404,
            detail="作業不可期間が見つかりません",
        )

    if period.start_date > period.end_date:
        raise HTTPException(
            status_code=400,
            detail="終了日は開始日以降にしてください",
        )

    existing_period.customer = period.customer
    existing_period.start_date = period.start_date
    existing_period.end_date = period.end_date
    existing_period.reason = period.reason

    db.commit()
    db.refresh(existing_period)

    return existing_period


# =========================
# 作業不可期間削除（管理者のみ）
# =========================

@router.delete("/{period_id}")
def delete_period(
    period_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    period = (
        db.query(CustomerUnavailablePeriod)
        .filter(CustomerUnavailablePeriod.id == period_id)
        .first()
    )

    if period is None:
        raise HTTPException(
            status_code=404,
            detail="作業不可期間が見つかりません",
        )

    db.delete(period)
    db.commit()

    return {"message": "作業不可期間を削除しました"}
