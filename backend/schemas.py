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
    required_people: int = 1
    status: str = "予定"

    # 案件の参加対象者
    target_user_ids: list[int] = []


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
# Application
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
# Approved Application
# =========================

class ApprovedApplication(BaseModel):
    id: int
    job_id: int
    user_id: int
    status: str
    user: User

    class Config:
        from_attributes = True