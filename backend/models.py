
from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
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

    status = Column(String, default="予定")

    applications = relationship(
        "Application",
        back_populates="job",
        cascade="all, delete-orphan",
    )

    assignments = relationship(
        "JobAssignment",
        back_populates="job",
        cascade="all, delete-orphan",
    )


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    company = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, default="外注")

    email = Column(String, unique=True, nullable=True)
    password_hash = Column(String, nullable=True)

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

    assignments = relationship(
        "JobAssignment",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    date_applications = relationship(
        "DateApplication",
        back_populates="user",
        cascade="all, delete-orphan",
    )


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)

    job_id = Column(
        Integer,
        ForeignKey("jobs.id"),
        nullable=False,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    status = Column(String, default="申請中")

    job = relationship(
        "Job",
        back_populates="applications",
    )

    user = relationship(
        "User",
        back_populates="applications",
    )


class DateApplication(Base):
    __tablename__ = "date_applications"

    __table_args__ = (
        UniqueConstraint(
            "date",
            "user_id",
            name="uq_date_application_user",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    date = Column(String, nullable=False, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    status = Column(
        String,
        default="申請中",
        nullable=False,
    )

    user = relationship(
        "User",
        back_populates="date_applications",
    )


class JobAssignment(Base):
    __tablename__ = "job_assignments"

    id = Column(Integer, primary_key=True, index=True)

    job_id = Column(
        Integer,
        ForeignKey("jobs.id"),
        nullable=False,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    job = relationship(
        "Job",
        back_populates="assignments",
    )

    user = relationship(
        "User",
        back_populates="assignments",
    )


class PersonalEvent(Base):
    __tablename__ = "personal_events"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    date = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
