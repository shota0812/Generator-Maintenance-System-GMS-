from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
from routers import jobs, approval, auth, personal_events

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://generator-maintenance-system-gms.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs.router)
app.include_router(approval.router)
app.include_router(auth.router)
app.include_router(personal_events.router)

@app.get("/")
def root():
    return {
        "system": "Generator Maintenance System",
        "status": "running",
    }