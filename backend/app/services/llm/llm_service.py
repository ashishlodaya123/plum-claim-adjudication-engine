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
        Text: {text}

        Respond with a JSON object that conforms to the following Pydantic schema:
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
                model="llama3-8b-8192",
                temperature=0,
                response_format={"type": "json_object"},
            )
            response_json = json.loads(chat_completion.choices[0].message.content)
            validated_data = schema(**response_json)
            return validated_data.dict(), 1.0 # High confidence for successful LLM extraction
        except (json.JSONDecodeError, ValidationError) as e:
            print(f"Error in LLM extraction: {e}")
            return None, 0.0

llm_service = LLMService()
