from app.services.minio_service import minio_service
import easyocr
import pytesseract
import cv2
import numpy as np
import os
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.claims import Document, Extraction
import uuid
import tempfile

class OcrService:
    def __init__(self):
        self.reader = easyocr.Reader(['en'])

    def preprocess_image(self, image_path):
        image = cv2.imread(image_path)
        if image is None:
            return None
        # Grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        # Denoise
        denoised = cv2.medianBlur(gray, 3)
        # Thresholding
        thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
        return thresh

    def run_ocr(self, document_path: str):
        # Check file extension
        _, ext = os.path.splitext(document_path)
        if ext.lower() == '.txt':
            with open(document_path, 'r', encoding='utf-8') as f:
                return f.read(), 1.0, "text_file"

        preprocessed_image = self.preprocess_image(document_path)
        if preprocessed_image is None:
             print(f"Warning: Could not read image at {document_path}")
             return "", 0.0, "error"

        # Run EasyOCR
        easyocr_result = self.reader.readtext(preprocessed_image)
        easyocr_text = " ".join([res[1] for res in easyocr_result])
        easyocr_confidence = np.mean([res[2] for res in easyocr_result]) if easyocr_result else 0.0

        if easyocr_confidence > 0.8:
            return easyocr_text, easyocr_confidence, "easyocr"
        else:
            # Fallback to Tesseract
            tesseract_text = pytesseract.image_to_string(preprocessed_image)
            return tesseract_text, 0.0, "tesseract" # Confidence is not easily available for tesseract

    async def ocr_claim_documents(self, claim_id: str, db: AsyncSession):
        documents = await db.execute(Document.__table__.select().where(Document.claim_id == uuid.UUID(claim_id)))
        ocr_results = []
        for doc in documents:
            local_path = os.path.join(tempfile.gettempdir(), doc.filename)

            minio_service.download_file(doc.storage_path, local_path)

            text, confidence, method = self.run_ocr(local_path)

            # Store OCR result in the database
            new_extraction = Extraction(
                document_id=doc.id,
                field="full_text",
                value={"text": text},
                confidence=confidence,
                method=method
            )
            db.add(new_extraction)
            await db.commit()

            ocr_results.append({"document_id": str(doc.id), "text": text})

            os.remove(local_path)

        return ocr_results

ocr_service = OcrService()
