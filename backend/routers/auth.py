from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pwdlib import PasswordHash

import models
import schemas
from database import SessionLocal


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)

password_hash = PasswordHash.recommended()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =========================
# 申請者アカウント登録
# =========================

@router.post("", response_model=schemas.User)
def create_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db),
):
    existing_user = (
        db.query(models.User)
        .filter(models.User.email == user.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="このメールアドレスは既に登録されています",
        )

    db_user = models.User(
        company=user.company,
        name=user.name,
        email=user.email,
        password_hash=password_hash.hash(user.password),
        role="外注",
        approval_status="承認待ち",
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


# =========================
# ログイン
# =========================

@router.post("/login", response_model=schemas.User)
def login(
    email: str,
    password: str,
    db: Session = Depends(get_db),
):
    user = (
        db.query(models.User)
        .filter(models.User.email == email)
        .first()
    )

    if (
        user is None
        or user.password_hash is None
        or not password_hash.verify(
            password,
            user.password_hash,
        )
    ):
        raise HTTPException(
            status_code=401,
            detail="メールアドレスまたはパスワードが違います",
        )

    if user.approval_status != "承認済み":
        raise HTTPException(
            status_code=403,
            detail="管理者の承認が完了していません",
        )

    return user


# =========================
# ユーザー一覧
# =========================

@router.get("", response_model=list[schemas.User])
def get_users(
    db: Session = Depends(get_db),
):
    return db.query(models.User).all()


# =========================
# 承認待ちユーザー一覧
# =========================

@router.get(
    "/pending",
    response_model=list[schemas.User],
)
def get_pending_users(
    db: Session = Depends(get_db),
):
    return (
        db.query(models.User)
        .filter(models.User.approval_status == "承認待ち")
        .all()
    )


# =========================
# 申請者アカウントの承認・却下
# =========================

@router.put(
    "/{user_id}/approval-status",
    response_model=schemas.User,
)
def update_user_approval_status(
    user_id: int,
    status: str,
    db: Session = Depends(get_db),
):
    user = (
        db.query(models.User)
        .filter(models.User.id == user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    # 管理者アカウントは変更させない
    if user.id == 1:
        raise HTTPException(
            status_code=400,
            detail="管理者アカウントは変更できません",
        )

    if user.role != "外注":
        raise HTTPException(
            status_code=400,
            detail="外注ユーザーのみ変更できます",
        )

    if status not in ["承認済み", "却下"]:
        raise HTTPException(
            status_code=400,
            detail="Status must be 承認済み or 却下",
        )

    user.approval_status = status

    db.commit()
    db.refresh(user)

    return user


# =========================
# ユーザー削除
# =========================

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
):
    user = (
        db.query(models.User)
        .filter(models.User.id == user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    if user.id == 1:
        raise HTTPException(
            status_code=400,
            detail="管理者アカウントは削除できません",
        )

    db.delete(user)
    db.commit()

    return {
        "message": "Deleted",
    }