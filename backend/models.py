from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String

from database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)

    date = Column(String)
    customer = Column(String)
    work = Column(String)
    technician = Column(String)
    contractor = Column(String)
    status = Column(String)