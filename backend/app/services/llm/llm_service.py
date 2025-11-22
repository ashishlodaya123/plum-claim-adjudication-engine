from groq import Groq
from app.core.config import settings
import json
from pydantic import BaseModel, ValidationError

class LLMService:
    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)

    def extract_with_llm(self, text: str, schema: BaseModel):
        prompt = f"""
        Extract the following information from the text below.
        The text is extracted from a medical claim document using OCR and may contain typos or errors (e.g., 'Cliwic' instead of 'Clinic', 'Hospita' instead of 'Hospital').
        Please correct these errors and infer the correct values based on context where possible.
        
        Text: {text}

        Respond with a JSON object that conforms to the following structure:
        {{
            "data": <extracted_data_conforming_to_schema>,
            "confidence_score": <float_between_0.0_and_1.0_indicating_confidence_in_extraction>
        }}

        Schema for "data":
        {schema.schema_json(indent=2)}
        """

        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                model="llama-3.3-70b-versatile",
                temperature=0,
                response_format={"type": "json_object"},
            )
            response_json = json.loads(chat_completion.choices[0].message.content)
            
            # Handle potential variations in LLM response structure
            if "data" in response_json:
                data_json = response_json["data"]
                confidence = response_json.get("confidence_score", 0.5)
            else:
                # Fallback if LLM doesn't follow the wrapper structure strictly
                data_json = response_json
                confidence = 0.5

            validated_data = schema(**data_json)
            return validated_data.dict(), float(confidence)
        except (json.JSONDecodeError, ValidationError) as e:
            print(f"Error in LLM extraction: {e}")
            return None, 0.0

llm_service = LLMService()
