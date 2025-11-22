from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import claims, metrics
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add Prometheus instrumentation
Instrumentator().instrument(app).expose(app)

app.include_router(claims.router, prefix="/claims", tags=["claims"])
app.include_router(metrics.router, prefix="/admin", tags=["admin"])

@app.get("/")
async def root():
    return {"message": "PlumHQ Automated Claims Adjudication System"}