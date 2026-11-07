
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import SessionLocal
from models import CustomerUnavailablePeriod
from schemas import (
    CustomerUnavailablePeriodCreate,
    CustomerUnavailablePeriodUpdate,
)


router = APIRouter(
    prefix="/customer-unavailable-periods",
    tags=["customer-unavailable-periods"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/")
def get_periods(db: Session = Depends(get_db)):
    return (
        db.query(CustomerUnavailablePeriod)
        .order_by(CustomerUnavailablePeriod.start_date)
        .all()
    )


@router.post("/")
def create_period(
    period: CustomerUnavailablePeriodCreate,
    db: Session = Depends(get_db),
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


@router.put("/{period_id}")
def update_period(
    period_id: int,
    period: CustomerUnavailablePeriodUpdate,
    db: Session = Depends(get_db),
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


@router.delete("/{period_id}")
def delete_period(
    period_id: int,
    db: Session = Depends(get_db),
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
