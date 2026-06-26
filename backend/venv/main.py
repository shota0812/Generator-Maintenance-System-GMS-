from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {
        "system": "Generator Maintenance System",
        "status": "running"
    }