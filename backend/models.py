from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)

    date = Column(String, nullable=False)
    customer = Column(String, nullable=False)
    work = Column(String, nullable=False)
    technician = Column(String, nullable=True)
    contractor = Column(String, nullable=True)

    # この案件に必要な人数
    required_people = Column(Integer, default=1)

    # 案件そのものの状態
    status = Column(String, default="予定")

    # この案件に対する申請
    applications = relationship(
        "Application",
        back_populates="job",
        cascade="all, delete-orphan",
    )


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    company = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, default="外注")

    # アカウント認証用
    email = Column(String, unique=True, nullable=True)
    password_hash = Column(String, nullable=True)

    # 承認待ち / 承認済み / 却下
    approval_status = Column(
        String,
        default="承認待ち",
        nullable=False,
    )

    applications = relationship(
        "Application",
        back_populates="user",
        cascade="all, delete-orphan",
    )
class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)

    # どの案件への申請か
    job_id = Column(
        Integer,
        ForeignKey("jobs.id"),
        nullable=False,
    )

    # 誰が申請したか
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    # 申請状態
    # 未申請 / 申請中 / 承認 / 却下
    status = Column(
        String,
        default="申請中",
    )

    # 案件との関係
    job = relationship(
        "Job",
        back_populates="applications",
    )

    # ユーザーとの関係
    user = relationship(
        "User",
        back_populates="applications",
    )

class PersonalEvent(Base):
    __tablename__ = "personal_events"

    id = Column(Integer, primary_key=True, index=True)

    # 予定を登録したユーザー
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    # 予定の日付
    date = Column(String, nullable=False)

    # 予定のタイトル
    title = Column(String, nullable=False)

    # 予定の詳細
    description = Column(String, nullable=True)