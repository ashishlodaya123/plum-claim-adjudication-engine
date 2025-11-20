from app.core.celery_app import celery_app
from app.core.db import SessionLocal
from app.services.ocr.ocr_service import ocr_service
from app.services.extraction.extraction_service import extraction_service
from app.services.rules.rules_engine import rules_engine
from app.models.claims import Decision, Claim
import uuid
from asgiref.sync import async_to_sync
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from asgiref.sync import async_to_sync

async def process_claim_async(claim_id: str):
    async with SessionLocal() as db:
        try:
            # 1. OCR Pipeline
            ocr_results = await ocr_service.ocr_claim_documents(claim_id, db)

            # 2. Extraction Pipeline
            extracted_data = await extraction_service.extract_and_save_claim_data(claim_id, ocr_results, db)

            # 3. Rule Engine
            decision_data = rules_engine.adjudicate(extracted_data)

            # 4. Save Decision
            await save_decision(claim_id, decision_data, db)

            return decision_data
        except Exception as e:
            print(f"Error processing claim {claim_id}: {e}")
            # Re-query to get a fresh object attached to this session
            result = await db.execute(select(Claim).where(Claim.id == uuid.UUID(claim_id)))
            claim = result.scalar_one_or_none()
            
            if claim:
                claim.status = "FAILED"
                await db.commit()
            raise e

@celery_app.task(acks_late=True)
def process_claim(claim_id: str):
    """
    This is the main task that orchestrates the entire claim processing pipeline.
    """
    return async_to_sync(process_claim_async)(claim_id)

async def save_decision(claim_id: str, decision_data: dict, db: AsyncSession):
    """
    Saves the decision to the database.
    """
    result = await db.execute(select(Claim).where(Claim.id == uuid.UUID(claim_id)))
    claim = result.scalar_one_or_none()
    
    if claim:
        new_decision = Decision(
            claim_id=claim.id,
            decision=decision_data["decision"],
            approved_amount=decision_data["approved_amount"],
            rejection_reasons=decision_data["rejection_reasons"],
            notes=decision_data["notes"],
            confidence_score=decision_data["confidence_score"]
        )
        db.add(new_decision)
        claim.status = decision_data["decision"]
        await db.commit()
