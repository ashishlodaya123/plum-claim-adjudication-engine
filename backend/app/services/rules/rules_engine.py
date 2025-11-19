import json
from pathlib import Path
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.claims import Extraction
import uuid
from sqlalchemy import select

class RulesEngine:
    def __init__(self):
        self.policy_terms = self.load_policy_terms()

    def load_policy_terms(self):
        policy_path = Path(__file__).parent / "policy_terms.json"
        with open(policy_path) as f:
            return json.load(f)

    async def get_extracted_data(self, claim_id: str, db: AsyncSession) -> Dict[str, Any]:
        stmt = select(Extraction).where(Extraction.claim.has(id=uuid.UUID(claim_id)))
        result = await db.execute(stmt)
        extractions = result.scalars().all()

        extracted_data = {}
        for extraction in extractions:
            # Since we are saving the same extracted data for all documents,
            # we can just take the first one we see.
            if extraction.field not in extracted_data:
                 extracted_data[extraction.field] = extraction.value
        return extracted_data

    def adjudicate(self, extracted_data: Dict[str, Any]):
        decision = "APPROVED"
        approved_amount = 0
        rejection_reasons = []
        notes = []

        # Rule: Waiting Period (Placeholder - needs claim date)
        # Rule: Exclusions (Placeholder - needs diagnosis)

        # Rule: Sub-limits
        consultation_fee = extracted_data.get("consultation_fee", 0)
        if consultation_fee > self.policy_terms["sub_limits"]["consultation_fee"]:
            approved_amount += self.policy_terms["sub_limits"]["consultation_fee"]
            rejection_reasons.append("Consultation fee exceeds sub-limit.")
            notes.append(f"Consultation fee capped at {self.policy_terms['sub_limits']['consultation_fee']}.")
        else:
            approved_amount += consultation_fee

        medicine_amount = extracted_data.get("medicine_amount", 0)
        approved_amount += medicine_amount


        # Rule: Co-pay
        if approved_amount > 0:
            copay_amount = approved_amount * self.policy_terms["copay"]
            approved_amount -= copay_amount
            notes.append(f"Copay of {self.policy_terms['copay'] * 100}% applied.")

        # Rule: Fraud Detection (Heuristic)
        total_claim_amount = consultation_fee + medicine_amount
        if total_claim_amount > 50000:
            decision = "MANUAL_REVIEW"
            notes.append("Claim flagged for manual review due to high amount.")

        if not rejection_reasons:
            rejection_reasons = []

        return {
            "decision": decision,
            "approved_amount": approved_amount,
            "rejection_reasons": rejection_reasons,
            "notes": ", ".join(notes),
            "confidence_score": 0.95 # Placeholder
        }

rules_engine = RulesEngine()
