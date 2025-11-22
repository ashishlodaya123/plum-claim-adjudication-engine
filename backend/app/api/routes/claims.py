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

from app.services.rules.rules_engine import rules_engine

router = APIRouter()

@router.get("/policy-terms")
async def get_policy_terms():
    return rules_engine.policy_terms

@router.post("/policy-terms")
async def update_policy_terms(terms: dict):
    return rules_engine.update_policy_terms(terms)

@router.get("/")
async def list_claims(status: str = None, db: AsyncSession = Depends(get_db)):
    query = select(Claim).options(selectinload(Claim.decision))
    if status:
        query = query.where(Claim.status == status)
    
    result = await db.execute(query)
    claims = result.scalars().all()
    
    response = []
    for claim in claims:
        claim_data = {
            "claim_id": str(claim.id),
            "status": claim.status,
            "created_at": str(claim.created_at) if hasattr(claim, "created_at") else None
        }
        if claim.decision:
            claim_data.update({
                "decision": claim.decision.decision,
                "approved_amount": claim.decision.approved_amount,
                "confidence_score": claim.decision.confidence_score
            })
        response.append(claim_data)
    return response

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
    # Fetch claim with decision
    result = await db.execute(
        select(Claim).options(selectinload(Claim.decision)).where(Claim.id == uuid.UUID(claim_id))
    )
    claim = result.scalar_one_or_none()

    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    # Fetch extractions for this claim
    # We join Document and Extraction to get fields for this claim
    from app.models.claims import Extraction
    
    extractions_result = await db.execute(
        select(Extraction)
        .join(Document, Extraction.document_id == Document.id)
        .where(Document.claim_id == uuid.UUID(claim_id))
        .where(Extraction.field.in_(["patient_name", "hospital_name"]))
    )
    extractions = extractions_result.scalars().all()
    
    patient_name = "N/A"
    hospital_name = "N/A"
    
    for ext in extractions:
        if ext.field == "patient_name":
            patient_name = ext.value
        elif ext.field == "hospital_name":
            hospital_name = ext.value

    if not claim.decision:
        return {
            "claim_id": str(claim.id), 
            "status": claim.status, 
            "decision": None,
            "patient_name": patient_name,
            "hospital_name": hospital_name
        }

    return {
        "claim_id": str(claim.id),
        "status": claim.status,
        "decision": claim.decision.decision,
        "approved_amount": claim.decision.approved_amount,
        "rejection_reasons": claim.decision.rejection_reasons,
        "confidence_score": claim.decision.confidence_score,
        "notes": claim.decision.notes,
        "patient_name": patient_name,
        "hospital_name": hospital_name
    }

from pydantic import BaseModel
from typing import Optional

class DecisionUpdate(BaseModel):
    decision: str
    notes: Optional[str] = None

@router.put("/{claim_id}/decision")
async def update_claim_decision(claim_id: str, update: DecisionUpdate, db: AsyncSession = Depends(get_db)):
    # Fetch claim
    result = await db.execute(
        select(Claim).options(selectinload(Claim.decision)).where(Claim.id == uuid.UUID(claim_id))
    )
    claim = result.scalar_one_or_none()

    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    # Update Claim Status
    claim.status = update.decision
    
    # Update Decision Record
    if claim.decision:
        claim.decision.decision = update.decision
        if update.notes:
            claim.decision.notes = (claim.decision.notes or "") + f" [Manual Override: {update.notes}]"
    else:
        # Create decision if it doesn't exist (unlikely but safe)
        new_decision = Decision(
            claim_id=claim.id,
            decision=update.decision,
            approved_amount=0.0, # Default to 0 if manual reject/approve without amount logic
            confidence_score=1.0, # Manual is 100% confident
            notes=f"Manual Override: {update.notes}" if update.notes else "Manual Override"
        )
        db.add(new_decision)

    await db.commit()
    await db.refresh(claim)
    return {"status": "success", "claim_id": str(claim.id), "new_status": claim.status}

@router.get("/jobs/{job_id}")
async def get_job_progress(job_id: str):
    task = process_claim.AsyncResult(job_id)
    return {"job_id": job_id, "status": task.status, "result": task.result}