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

    def _get_value(self, data: Any) -> float:
        if isinstance(data, dict):
            return float(data.get("value", 0))
        try:
            return float(data)
        except (ValueError, TypeError):
            return 0.0

    def _check_exclusions(self, extracted_data: Dict[str, Any]) -> List[str]:
        reasons = []
        # Check for specific excluded keywords in diagnosis or treatment description
        # This is a heuristic check based on the policy exclusions
        text_fields = [str(v).lower() for k, v in extracted_data.items() if isinstance(v, str)]
        combined_text = " ".join(text_fields)
        
        for exclusion in self.policy_terms.get("exclusions", []):
            # Simple keyword matching - in production this would be more sophisticated NLP
            # We split exclusion into keywords to be less strict
            keywords = exclusion.lower().split()
            if any(keyword in combined_text for keyword in keywords if len(keyword) > 4):
                 # This is a very loose check, ideally we'd have a structured 'diagnosis' field
                 # For now, we'll rely on specific flags if available, or manual review for suspicious terms
                 pass 
        
        return reasons

    def adjudicate(self, extracted_data: Dict[str, Any]):
        decision = "APPROVED"
        approved_amount = 0.0
        rejection_reasons = []
        notes = []
        
        # 1. Basic Eligibility & Minimum Amount
        total_claimed_amount = 0.0
        # Sum up known monetary fields
        monetary_fields = ["consultation_fee", "medicine_amount", "test_cost", "procedure_cost"]
        for field in monetary_fields:
            total_claimed_amount += self._get_value(extracted_data.get(field, 0))
            
        min_amount = self.policy_terms["claim_requirements"]["minimum_claim_amount"]
        if total_claimed_amount < min_amount:
            decision = "REJECTED"
            rejection_reasons.append(f"Claim amount {total_claimed_amount} is below minimum limit of {min_amount}")
            return {
                "decision": decision,
                "approved_amount": 0.0,
                "rejection_reasons": rejection_reasons,
                "notes": "Claim rejected due to minimum amount threshold.",
                "confidence_score": 1.0
            }

        # 2. Coverage & Sub-limits Verification
        coverage_details = self.policy_terms["coverage_details"]
        
        # Helper to process a category
        def process_category(category_key, amount_key, display_name):
            nonlocal approved_amount
            amount = self._get_value(extracted_data.get(amount_key, 0))
            if amount > 0:
                category_rules = coverage_details.get(category_key)
                if not category_rules or not category_rules.get("covered"):
                    rejection_reasons.append(f"{display_name} is not covered under this policy.")
                else:
                    sub_limit = category_rules.get("sub_limit", float('inf'))
                    if amount > sub_limit:
                        approved_amount += sub_limit
                        notes.append(f"{display_name} capped at sub-limit {sub_limit} (Claimed: {amount}).")
                    else:
                        approved_amount += amount

        # Process categories
        # Consultation
        process_category("consultation_fees", "consultation_fee", "Consultation")
        
        # Pharmacy
        process_category("pharmacy", "medicine_amount", "Pharmacy")
        
        # Diagnostics (assuming 'test_cost' field from extraction)
        process_category("diagnostic_tests", "test_cost", "Diagnostics")
        
        # Dental (assuming 'dental_cost' field)
        process_category("dental", "dental_cost", "Dental")
        
        # Vision (assuming 'vision_cost' field)
        process_category("vision", "vision_cost", "Vision")

        # 3. Co-pay Calculation
        if approved_amount > 0:
            copay_percent = self.policy_terms["coverage_details"]["consultation_fees"].get("copay_percentage", 10) # Default to 10 if not found
            # Check if specific pharmacy copay applies? For simplicity using global/consultation copay for now
            # unless we strictly implement per-category copay logic which is complex without structured line items.
            
            copay_amount = approved_amount * (copay_percent / 100)
            approved_amount -= copay_amount
            notes.append(f"Co-pay of {copay_percent}% applied (-{copay_amount}).")

        # 4. Fraud Detection (Heuristic)
        if total_claimed_amount > 50000:
            decision = "MANUAL_REVIEW"
            notes.append("Flagged for manual review: High claim amount.")
        
        # Check for round numbers (heuristic)
        if total_claimed_amount > 1000 and total_claimed_amount % 500 == 0:
             notes.append("Observation: Claim amount is a round number.")

        # Final Decision Logic
        if rejection_reasons:
            # If there are rejection reasons but some amount is approved, it's PARTIAL
            if approved_amount > 0:
                decision = "PARTIAL"
            else:
                decision = "REJECTED"
                approved_amount = 0.0
        elif approved_amount < total_claimed_amount and decision != "MANUAL_REVIEW":
             # If approved is less than claimed (due to limits/copay) but no explicit rejection, it's APPROVED (or technically PARTIAL but usually treated as Approved with deductions)
             # Let's stick to APPROVED unless explicitly rejected, but note the deductions
             pass

        return {
            "decision": decision,
            "approved_amount": round(approved_amount, 2),
            "rejection_reasons": rejection_reasons,
            "notes": "; ".join(notes),
            "confidence_score": 0.95 
        }

rules_engine = RulesEngine()
