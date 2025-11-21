from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from typing import List
from sqlalchemy import select
import uuid
import os
import aiofiles
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.core.db import get_db
from app.models.claims import Claim, Document, Decision
from app.workers.tasks import process_claim
from app.services.minio_service import minio_service

router = APIRouter()

@router.post("/")
async def upload_claim(files: List[UploadFile] = File(...), db: AsyncSession = Depends(get_db)):
    claim_id = uuid.uuid4()

    # Create a new claim
    new_claim = Claim(id=claim_id)
    db.add(new_claim)
    await db.commit()
    await db.refresh(new_claim)

    # Create a temporary directory to store the uploaded files
    temp_dir = f"/tmp/{claim_id}"
    os.makedirs(temp_dir, exist_ok=True)

    for file in files:
        # Save the file to a temporary location
        temp_path = os.path.join(temp_dir, file.filename)
        async with aiofiles.open(temp_path, "wb") as out_file:
            content = await file.read()
            await out_file.write(content)

        # Upload the file to MinIO
        storage_path = f"claims/{claim_id}/{file.filename}"
        minio_service.upload_file(temp_path, storage_path)

        # Create a new document record
        new_document = Document(
            claim_id=claim_id,
            filename=file.filename,
            storage_path=storage_path,
            document_type="unknown" # TODO: Determine document type
        )
        db.add(new_document)
        await db.commit()
        await db.refresh(new_document)

        # Clean up the temporary file
        os.remove(temp_path)

    # Clean up the temporary directory
    os.rmdir(temp_dir)

    # Trigger the Celery task
    task = process_claim.delay(str(claim_id))

    return {"claim_id": str(claim_id), "job_id": task.id}

@router.get("/{claim_id}")
async def get_claim_status(claim_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Claim).options(selectinload(Claim.decision)).where(Claim.id == uuid.UUID(claim_id))
    )
    claim = result.scalar_one_or_none()

    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    if not claim.decision:
        return {"claim_id": str(claim.id), "status": claim.status, "decision": None}

    return {
        "claim_id": str(claim.id),
        "decision": claim.decision.decision,
        "approved_amount": claim.decision.approved_amount,
        "rejection_reasons": claim.decision.rejection_reasons,
        "confidence_score": claim.decision.confidence_score,
        "notes": claim.decision.notes
    }

@router.get("/jobs/{job_id}")
async def get_job_progress(job_id: str):
    task = process_claim.AsyncResult(job_id)
    return {"job_id": job_id, "status": task.status, "result": task.result}