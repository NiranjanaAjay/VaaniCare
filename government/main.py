from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from government import duckduckgo_scheme_search

app = FastAPI(title="Government Scheme Finder API")

# Allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserProfile(BaseModel):
    age: int
    gender: str
    state: str
    income_bracket: str
    occupation: str
    category: str

@app.post("/find-schemes")
def find_schemes(user: UserProfile):
    schemes = duckduckgo_scheme_search(user.dict())

    return {
        "query_state": user.state,
        "count": len(schemes),
        "schemes": schemes,
        "disclaimer": "Final eligibility is determined by the concerned government department."
    }
