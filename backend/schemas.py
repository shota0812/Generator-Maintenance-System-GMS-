
from pydantic import BaseModel


# =========================
# Job
# =========================

class JobCreate(BaseModel):
    date: str
    customer: str
    work: str
    technician: str | None = None
    contractor: str | None = None
    status: str = "予定"


class Job(JobCreate):
    id: int

    class Config:
        from_attributes = True


# =========================
# User
# =========================

class UserCreate(BaseModel):
    company: str
    name: str
    email: str
    password: str


class User(BaseModel):
    id: int
    company: str
    name: str
    role: str
    email: str | None = None
    approval_status: str

    class Config:
        from_attributes = True


# =========================
# 旧Application（既存データ維持）
# =========================

class ApplicationCreate(BaseModel):
    job_id: int
    user_id: int


class ApplicationUser(BaseModel):
    id: int
    company: str
    name: str
    role: str

    class Config:
        from_attributes = True


class Application(BaseModel):
    id: int
    job_id: int
    user_id: int
    status: str
    user: ApplicationUser

    class Config:
        from_attributes = True


# =========================
# DateApplication（日付単位の申請）
# =========================

class DateApplicationCreate(BaseModel):
    date: str
    user_id: int
    available_people: int


class DateApplicationUpdate(BaseModel):
    user_id: int
    available_people: int


class DateApplicationDecision(BaseModel):
    status: str
    confirmed_people: int = 0


class DateApplication(BaseModel):
    id: int
    date: str
    user_id: int
    status: str
    available_people: int
    confirmed_people: int
    user: ApplicationUser

    class Config:
        from_attributes = True


# =========================
# Job Assignment
# =========================

class JobAssignmentCreate(BaseModel):
    job_id: int
    user_id: int


class JobAssignment(BaseModel):
    id: int
    job_id: int
    user_id: int
    user: ApplicationUser

    class Config:
        from_attributes = True


# =========================
# Customer Unavailable Period
# =========================

class CustomerUnavailablePeriodCreate(BaseModel):
    customer: str
    start_date: str
    end_date: str
    reason: str | None = None


class CustomerUnavailablePeriodUpdate(BaseModel):
    customer: str
    start_date: str
    end_date: str
    reason: str | None = None


class CustomerUnavailablePeriod(BaseModel):
    id: int
    customer: str
    start_date: str
    end_date: str
    reason: str | None = None

    class Config:
        from_attributes = True
