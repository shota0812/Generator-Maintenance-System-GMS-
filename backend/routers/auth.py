
import os

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pwdlib import PasswordHash
from pydantic import BaseModel

import models
import schemas
from database import SessionLocal
from security import create_access_token, get_current_admin


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


class LoginRequest(BaseModel):
    email: str
    password: str


class AdminLoginRequest(BaseModel):
    email: str
    password: str


# =========================
# 外注ユーザー登録
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
# 外注ユーザーログイン
# =========================

@router.post("/login")
def login(
    request: LoginRequest,
    db: Session = Depends(get_db),
):
    user = (
        db.query(models.User)
        .filter(models.User.email == request.email)
        .first()
    )

    if (
        user is None
        or user.role != "外注"
        or user.password_hash is None
        or not password_hash.verify(
            request.password,
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

    access_token = create_access_token(
        {"sub": str(user.id)}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": schemas.User.model_validate(user),
    }


# =========================
# 管理者ログイン
# =========================

@router.post("/admin/login")
def admin_login(
    request: AdminLoginRequest,
    db: Session = Depends(get_db),
):
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")

    if not admin_email or not admin_password:
        raise HTTPException(
            status_code=500,
            detail="管理者認証の設定がありません",
        )

    if (
        request.email != admin_email
        or request.password != admin_password
    ):
        raise HTTPException(
            status_code=401,
            detail="管理者のメールアドレスまたはパスワードが違います",
        )

    admin_user = (
        db.query(models.User)
        .filter(models.User.email == admin_email)
        .first()
    )

    if admin_user is not None:
        if admin_user.role != "管理者":
            raise HTTPException(
                status_code=409,
                detail="管理者用メールアドレスが外注アカウントに使用されています",
            )
    else:
        admin_user = models.User(
            company="システム管理",
            name="管理者",
            email=admin_email,
            password_hash=None,
            role="管理者",
            approval_status="承認済み",
        )

        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

    access_token = create_access_token(
        {
            "sub": "admin",
            "role": "管理者",
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "authenticated": True,
        "role": "admin",
        "email": admin_email,
    }


# =========================
# ユーザー一覧（管理者のみ）
# =========================

@router.get("", response_model=list[schemas.User])
def get_users(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
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
    admin=Depends(get_current_admin),
):
    return (
        db.query(models.User)
        .filter(models.User.approval_status == "承認待ち")
        .all()
    )


# =========================
# 外注ユーザーの承認・却下
# =========================

@router.put(
    "/{user_id}/approval-status",
    response_model=schemas.User,
)
def update_user_approval_status(
    user_id: int,
    status: str,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
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
# 外注ユーザー削除（管理者のみ）
# =========================

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
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

    if user.role == "管理者":
        raise HTTPException(
            status_code=400,
            detail="管理者アカウントは削除できません",
        )

    db.delete(user)
    db.commit()

    return {"message": "Deleted"}
