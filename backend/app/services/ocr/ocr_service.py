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
        # Explicitly disable GPU to save memory and avoid CUDA overhead on CPU-only envs
        self.reader = easyocr.Reader(['en'], gpu=False)

    def preprocess_image(self, image_path):
        image = cv2.imread(image_path)
        if image is None:
            return None
        
        # Resize if image is too large (max dimension 1800px)
        height, width = image.shape[:2]
        # Resize if image is too large (max dimension 1280px) for faster processing
        height, width = image.shape[:2]
        max_dim = 1280
        if max(height, width) > max_dim:
            scaling_factor = max_dim / float(max(height, width))
            new_size = (int(width * scaling_factor), int(height * scaling_factor))
            image = cv2.resize(image, new_size, interpolation=cv2.INTER_AREA)
            print(f"Resized image from ({width}, {height}) to {new_size}")

        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply adaptive thresholding which is better for varying lighting/handwriting
        # adaptive_thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
        
        # For EasyOCR, raw grayscale often works better than binary thresholding
        # We will return the grayscale image for EasyOCR
        return gray

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
        print("Running EasyOCR...")
        easyocr_result = self.reader.readtext(preprocessed_image)
        easyocr_text = " ".join([res[1] for res in easyocr_result])
        easyocr_confidence = np.mean([res[2] for res in easyocr_result]) if easyocr_result else 0.0
        
        print(f"EasyOCR Raw Result: {easyocr_text}")
        print(f"EasyOCR Confidence: {easyocr_confidence}")

        # Lower threshold to 0.4 because handwritten text often has lower confidence
        if easyocr_confidence > 0.4:
            return easyocr_text, easyocr_confidence, "easyocr"
        else:
            # Fallback to Tesseract
            print("Falling back to Tesseract...")
            # Tesseract might prefer thresholded image, but let's try with the same grayscale first
            tesseract_text = pytesseract.image_to_string(preprocessed_image)
            return tesseract_text, 0.0, "tesseract"

    async def ocr_claim_documents(self, claim_id: str, db: AsyncSession):
        documents = await db.execute(Document.__table__.select().where(Document.claim_id == uuid.UUID(claim_id)))
        ocr_results = []
        for doc in documents:
            print(f"Processing document: {doc.filename}")
            local_path = os.path.join(tempfile.gettempdir(), doc.filename)

            try:
                print(f"Downloading from MinIO: {doc.storage_path} -> {local_path}")
                minio_service.download_file(doc.storage_path, local_path)
                print(f"Download complete. File size: {os.path.getsize(local_path)}")
            except Exception as e:
                print(f"Failed to download file: {e}")
                continue

            print("Running OCR...")
            text, confidence, method = self.run_ocr(local_path)
            print(f"OCR complete. Method: {method}, Confidence: {confidence}, Text length: {len(text)}")

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

            if os.path.exists(local_path):
                os.remove(local_path)

        return ocr_results

ocr_service = OcrService()
