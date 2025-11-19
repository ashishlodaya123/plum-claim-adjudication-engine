from fastapi import FastAPI
from app.api.routes import claims
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI()

# Add Prometheus instrumentation
Instrumentator().instrument(app).expose(app)

app.include_router(claims.router, prefix="/claims", tags=["claims"])

@app.get("/")
async def root():
    return {"message": "PlumHQ Automated Claims Adjudication System"}
