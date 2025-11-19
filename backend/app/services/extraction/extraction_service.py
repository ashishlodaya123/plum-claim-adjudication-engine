import re
from app.services.llm.llm_service import llm_service
from app.schemas.claims import ExtractedClaimData
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.claims import Extraction
from typing import List, Dict, Any

class ExtractionService:
    def extract_from_text(self, text: str) -> Dict[str, Any]:
        extracted_fields = {}

        # Regex for consultation fee
        consultation_fee_match = re.search(r"consultation fee\s*[:\-]?\s*(\d+\.?\d*)", text, re.IGNORECASE)
        if consultation_fee_match:
            extracted_fields["consultation_fee"] = {"value": float(consultation_fee_match.group(1)), "confidence": 0.98, "method": "regex"}

        # Regex for hospital name
        hospital_name_match = re.search(r"(?:hospital|clinic)\s*:\s*(.*)", text, re.IGNORECASE)
        if hospital_name_match:
            extracted_fields["hospital_name"] = {"value": hospital_name_match.group(1).strip(), "confidence": 0.95, "method": "regex"}

        # Regex for medicine amount
        medicine_amount_match = re.search(r"medicines?\s*[:\-]?\s*(\d+\.?\d*)", text, re.IGNORECASE)
        if medicine_amount_match:
            extracted_fields["medicine_amount"] = {"value": float(medicine_amount_match.group(1)), "confidence": 0.90, "method": "regex"}

        # If deterministic extraction fails for some fields, fallback to LLM
        if len(extracted_fields) < 3: # Arbitrary threshold
            llm_extracted_data, llm_confidence = llm_service.extract_with_llm(text, ExtractedClaimData)
            if llm_extracted_data:
                for key, value in llm_extracted_data.items():
                    if value is not None and key not in extracted_fields:
                        extracted_fields[key] = {"value": value, "confidence": llm_confidence, "method": "llm"}

        return extracted_fields

    async def extract_and_save_claim_data(self, claim_id: str, ocr_results: List[Dict[str, Any]], db: AsyncSession):
        combined_text = " ".join([result["text"] for result in ocr_results])

        extracted_fields = self.extract_from_text(combined_text)

        for document_result in ocr_results:
            document_id = document_result['document_id']
            for field, data in extracted_fields.items():
                new_extraction = Extraction(
                    document_id=document_id,
                    field=field,
                    value=data["value"],
                    confidence=data["confidence"],
                    method=data["method"]
                )
                db.add(new_extraction)

        await db.commit()
        return extracted_fields

extraction_service = ExtractionService()
