from pydantic import BaseModel


class JobCreate(BaseModel):
    date: str
    customer: str
    work: str
    technician: str
    contractor: str
    status: str


class Job(JobCreate):
    id: int

    class Config:
        from_attributes = True