from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from government import duckduckgo_scheme_search
import os
import tempfile

# Load environment variables
load_dotenv()

app = FastAPI(title="Government Scheme & Legal AI API")

# Check for both GROQ_API_KEY and VITE_GROQ_API_KEY
GROQ_API_KEY = os.getenv("GROQ_API_KEY") or os.getenv("VITE_GROQ_API_KEY", "")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


# Allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserProfile(BaseModel):
    age: str
    gender: str
    state: str
    income_bracket: str
    occupation: str
    category: str

class LegalQuery(BaseModel):
    issue: str
    location: str

@app.post("/find-schemes")
def find_schemes(user: UserProfile):
    schemes = duckduckgo_scheme_search(user.dict())

    return {
        "query_state": user.state,
        "count": len(schemes),
        "schemes": schemes,
        "disclaimer": "Final eligibility is determined by the concerned government department."
    }

@app.post("/find-lawyers")
def find_lawyers(query: LegalQuery):
    results = duckduckgo_legal_search(query.issue, query.location)
    return {
        "issue": query.issue,
        "location": query.location,
        "count": len(results),
        "results": results
    }

class AdviceQuery(BaseModel):
    issue: str
    language: str = "en"

@app.post("/legal-advice")
async def get_legal_advice(query: AdviceQuery):
    if not GROQ_API_KEY:
        return {"error": "Groq API key not configured"}

    system_prompt = (
        "You are a helpful legal assistant for VaaniCare, an app for elderly and rural users in India. "
        "Provide simple, clear legal advice or guidance based on the user's issue. "
        "If the language is 'ml', respond in Malayalam. Otherwise, respond in English. "
        "Keep the advice practical and easy to understand. "
        "Disclaimer: This is for informational purposes only, not a substitute for professional legal advice."
    )

    prompt = f"User Issue: {query.issue}\nPlease provide legal guidance in {query.language} language."

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.5,
                    "max_tokens": 1024
                },
                timeout=30.0
            )
            response.raise_for_status()
            result = response.json()
            advice = result["choices"][0]["message"]["content"]
            return {"advice": advice}
        except Exception as e:
            print(f"Error calling Groq: {e}")
            return {"error": str(e)}

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    # Save uploaded file to temp
    pass
