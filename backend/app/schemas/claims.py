from pydantic import BaseModel, Field
from typing import List, Optional

class ExtractedClaimData(BaseModel):
    consultation_fee: Optional[float] = Field(None, description="The consultation fee.")
    medicine_amount: Optional[float] = Field(None, description="The total amount for medicines.")
    hospital_name: Optional[str] = Field(None, description="The name of the hospital.")
    dates_of_admission: Optional[List[str]] = Field(None, description="The dates of admission.")
    diagnosis: Optional[str] = Field(None, description="The diagnosis.")
    test_cost: Optional[float] = Field(None, description="The cost of diagnostic tests.")
    dental_cost: Optional[float] = Field(None, description="The cost of dental procedures.")
    vision_cost: Optional[float] = Field(None, description="The cost of vision care (glasses, lenses, etc.).")
    procedure_cost: Optional[float] = Field(None, description="The cost of other medical procedures.")
    patient_name: Optional[str] = Field(None, description="The name of the patient.")
