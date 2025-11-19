from app.core.celery_app import celery_app
from app.core.db import SessionLocal
from app.services.ocr.ocr_service import ocr_service
from app.services.extraction.extraction_service import extraction_service
from app.services.rules.rules_engine import rules_engine
from app.models.claims import Decision, Claim
import uuid

@celery_app.task(acks_late=True)
def process_claim(claim_id: str):
    """
    This is the main task that orchestrates the entire claim processing pipeline.
    """
    db = SessionLocal()

    try:
        # 1. OCR Pipeline
        ocr_results = ocr_service.ocr_claim_documents(claim_id, db)

        # 2. Extraction Pipeline
        extracted_data = extraction_service.extract_and_save_claim_data(claim_id, ocr_results, db)

        # 3. Rule Engine
        decision_data = rules_engine.adjudicate(extracted_data)

        # 4. Save Decision
        save_decision(claim_id, decision_data, db)

        return decision_data
    finally:
        db.close()

def save_decision(claim_id: str, decision_data: dict, db):
    """
    Saves the decision to the database.
    """
    claim = db.query(Claim).filter(Claim.id == uuid.UUID(claim_id)).first()
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
        db.commit()
