from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_track_started=True,
    # task_routes={
    #     "app.workers.tasks.process_claim": "main-queue"
    # },
    imports=("app.workers.tasks",)
)

# Auto-discover tasks
celery_app.autodiscover_tasks(["app.workers"])