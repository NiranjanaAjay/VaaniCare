import os
import json
import uuid
from typing import Optional, Dict

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_core.tools import tool
from datetime import datetime
import ollama

# Load environment variables
load_dotenv()

# Configure Ollama - make sure Ollama server is running on localhost:11434
# You can change the model here: "mistral", "neural-chat", "llama2", "zephyr"
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "mistral")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")

# Simple wrapper to call Ollama
def call_ollama(prompt: str) -> str:
    """Call Ollama model with a prompt"""
    try:
        response = ollama.generate(
            model=OLLAMA_MODEL,
            prompt=prompt,
            stream=False,
            options={
                "temperature": 0.7,
                "top_p": 0.9,
            }
        )
        return response.response if hasattr(response, 'response') else response.get('response', '')
    except Exception as e:
        print(f"Error calling Ollama: {e}")
        return ""

# Template for a fresh appointment context
EMPTY_CONTEXT = {
    "doctor_specialty": None,
    "preferred_date": None,
    "preferred_time": None,
    "patient_name": None,
    "patient_age": None,
    "patient_phone": None,
    "reason": None,
    "symptoms": None,
}


def new_context() -> Dict[str, Optional[str]]:
    return {k: None for k in EMPTY_CONTEXT}


# In-memory session store (request/response API conversations)
session_contexts: Dict[str, Dict[str, Optional[str]]] = {}


# FastAPI app for request/response usage
app = FastAPI(title="Appointment Agent API")


class ChatRequest(BaseModel):
    user_input: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    session_id: str
    status: str
    message: str
    collected_info: Dict[str, str] = {}
    missing_fields: Optional[list] = None
    questions: Optional[str] = None
    extracted_info: Optional[Dict[str, str]] = None

# ========== CORE LOGIC FUNCTIONS ==========

def extract_appointment_info_logic(user_input: str) -> dict:
    """
    Extracts appointment-related information from user input using Ollama.
    Returns dict with extracted fields.
    """
    extraction_prompt = f"""Extract appointment booking information from this user message. Return ONLY valid JSON.

Instructions:
- Extract values that are explicitly mentioned
- Return null for fields not mentioned
- For dates: parse "tomorrow", "next Monday" etc to actual dates (today is 2026-01-04)
- For doctor specialty: accept common terms like "pediatrician", "paediatric", "paediatrician", "cardiologist", etc.
- For time: parse "noon" as "12:00 PM", "morning" as a range, etc.
- Only extract information actually stated by the user

Fields to extract (all should be present, use null if not mentioned):
- doctor_specialty
- preferred_date
- preferred_time
- patient_name
- patient_age
- patient_phone
- reason
- symptoms

User message: "{user_input}"

Return ONLY valid JSON, no explanation."""
    
    response_text = call_ollama(extraction_prompt)
    
    # Remove markdown code blocks if present
    response_text = response_text.strip()
    if response_text.startswith("```json"):
        response_text = response_text[7:]  # Remove ```json
    if response_text.startswith("```"):
        response_text = response_text[3:]  # Remove ```
    if response_text.endswith("```"):
        response_text = response_text[:-3]  # Remove trailing ```
    response_text = response_text.strip()
    
    try:
        extracted = json.loads(response_text)
        return extracted
    except json.JSONDecodeError as e:
        print(f"DEBUG: Failed to parse JSON from response: {response_text}")
        return {}

def identify_missing_info_logic(context: dict) -> list:
    """
    Identifies which REQUIRED appointment information is missing.
    Returns list of missing fields.
    """
    # Only these fields are REQUIRED for booking
    required_fields = ["doctor_specialty", "preferred_date", "preferred_time", "patient_name", "reason"]
    missing = [field for field in required_fields if not context.get(field)]
    return missing

def generate_clarification_questions_logic(missing_fields: list) -> str:
    """
    Generates user-friendly questions to collect missing information using Ollama.
    """
    if not missing_fields:
        return "All information collected!"
    
    # Create a more natural question asking for all missing fields at once
    fields_text = ", ".join([f.replace("_", " ") for f in missing_fields])
    
    questions_prompt = f"""Generate 1-2 brief, natural follow-up questions to ask the user to get this missing information:
{fields_text}

Be conversational and helpful. Ask for all the missing information together if possible.
Keep questions short and natural, as if talking to someone in person.
Do not number the questions. Just ask naturally."""
    
    return call_ollama(questions_prompt)

def build_appointment_prompt_logic(context: dict) -> str:
    """
    Builds a complete appointment booking prompt from all collected information using Ollama.
    """
    context_str = json.dumps(context, indent=2)
    build_prompt = f"""Based on this complete appointment information:
{context_str}

Create a concise summary that can be used to book an appointment. Include:
1. Patient details
2. Doctor specialty needed
3. Preferred appointment time
4. Reason for visit
5. Any relevant symptoms

Format it as a clear, professional appointment request."""
    
    return call_ollama(build_prompt)

def mock_book_appointment_logic(appointment_summary: str) -> str:
    """
    Simulates booking an appointment with a doctor using Ollama.
    """
    confirmation_prompt = f"""Create a confirmation message for this appointment booking:
{appointment_summary}

Include confirmation number (format: APT-XXXXX), appointment details, and next steps.
Keep it professional and brief."""
    
    return call_ollama(confirmation_prompt)

# ========== TOOL DEFINITIONS (for agent use) ==========

@tool
def extract_appointment_info(user_input: str) -> str:
    """Extracts appointment-related information from user input."""
    result = extract_appointment_info_logic(user_input)
    return json.dumps(result)

@tool
def identify_missing_info(context: str) -> str:
    """Identifies which appointment information is missing."""
    try:
        context_dict = json.loads(context)
    except:
        context_dict = {}
    missing = identify_missing_info_logic(context_dict)
    return json.dumps(missing)

@tool
def generate_clarification_questions(missing_fields: str) -> str:
    """Generates questions to collect missing information."""
    try:
        fields = json.loads(missing_fields)
    except:
        fields = missing_fields.split(", ")
    return generate_clarification_questions_logic(fields)

@tool
def build_appointment_prompt(context: str) -> str:
    """Builds a complete appointment booking prompt."""
    try:
        context_dict = json.loads(context)
    except:
        context_dict = {}
    return build_appointment_prompt_logic(context_dict)

@tool
def mock_book_appointment(appointment_summary: str) -> str:
    """Simulates booking an appointment."""
    return mock_book_appointment_logic(appointment_summary)

def update_appointment_context(context: dict, extracted_info: dict) -> None:
    """
    Updates the provided appointment context with newly extracted information.
    Only updates fields that have actual values (not null).
    """
    if not extracted_info:
        return

    for key in context:
        # Only update if we have a new value and field is currently empty
        if extracted_info.get(key) and not context.get(key):
            context[key] = extracted_info[key]

def process_appointment_booking(user_input: str, context: dict) -> dict:
    """
    Manages the appointment booking flow with interactive information gathering.
    """
    # Step 1: Extract information from user input
    extracted = extract_appointment_info_logic(user_input)

    # Step 2: Update context with new information (only if not already set)
    update_appointment_context(context, extracted)

    # If we got symptoms but no reason, use symptoms as reason
    if context.get("symptoms") and not context.get("reason"):
        context["reason"] = context["symptoms"]

    # Step 3: Identify missing information
    missing_required = identify_missing_info_logic(context)

    # Get info we've already collected for display
    collected_info = {k: v for k, v in context.items() if v}

    if missing_required:
        # Step 4: Generate clarification questions only for truly missing info
        questions = generate_clarification_questions_logic(missing_required)

        collected_display = ""
        if collected_info:
            collected_display = "✓ Information collected so far:\n"
            for key, value in collected_info.items():
                display_key = key.replace("_", " ").title()
                collected_display += f"  • {display_key}: {value}\n"
            collected_display += "\n"

        return {
            "status": "collecting_info",
            "extracted_info": context.copy(),
            "collected_info": collected_info,
            "missing_fields": missing_required,
            "questions": questions,
            "message": f"{collected_display}Still need: {', '.join([f.replace('_', ' ') for f in missing_required])}\n\n{questions}"
        }
    else:
        # Step 5: All required info collected - ask for additional symptoms
        return {
            "status": "ask_symptoms",
            "extracted_info": context.copy(),
            "collected_info": collected_info,
            "message": "Great! I have all the required information.\n\nDo you have any additional symptoms or concerns you'd like to mention? (Type 'done' if nothing more to add)"
        }

def process_user_input(user_input: str, context: dict) -> dict:
    """
    Main entry point for processing user input for appointment booking.
    """
    try:
        result = process_appointment_booking(user_input, context)
        return result
    except Exception as e:
        return {
            "status": "error",
            "response": str(e)
        }

def is_all_fields_filled(context: dict) -> bool:
    """Check if all fields in a given appointment context are filled"""
    return all(value is not None for value in context.values())

# Main function kept for optional CLI use
def main():
    ctx = new_context()
    print("=" * 70)
    print("Doctor Appointment Booking Agent (CLI)")
    print("=" * 70)
    print("\nType 'exit' to quit\n")

    while True:
        user_input = input("You: ").strip()

        if user_input.lower() == 'exit':
            print("\nThank you for using Doctor Appointment Booking Agent. Goodbye!")
            break

        if not user_input:
            print("Please enter a valid input.\n")
            continue

        result = process_user_input(user_input, ctx)
        print(result.get("message", result))


@app.post("/api/appointment/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    # Create or retrieve session
    session_id = request.session_id or str(uuid.uuid4())
    if session_id not in session_contexts:
        session_contexts[session_id] = new_context()

    ctx = session_contexts[session_id]

    result = process_user_input(request.user_input, ctx)

    # Reset if we reached final state and user said done/no in symptoms flow
    if result.get("status") == "ask_symptoms" and request.user_input.strip().lower() in {"done", "no"}:
        session_contexts[session_id] = new_context()

    return ChatResponse(
        session_id=session_id,
        status=result.get("status", "error"),
        message=result.get("message", ""),
        collected_info=result.get("collected_info", {}),
        missing_fields=result.get("missing_fields"),
        questions=result.get("questions"),
        extracted_info=result.get("extracted_info"),
    )


@app.post("/api/appointment/reset")
def reset_session(session_id: Optional[str] = None):
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")
    session_contexts[session_id] = new_context()
    return {"status": "reset", "session_id": session_id}


if __name__ == "__main__":
    main()
