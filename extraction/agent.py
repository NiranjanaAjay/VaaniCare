import os
import json
from dotenv import load_dotenv
from langchain_core.tools import tool
from datetime import datetime
from typing import Optional
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

# Store appointment context for the session
appointment_context = {
    "doctor_specialty": None,
    "preferred_date": None,
    "preferred_time": None,
    "patient_name": None,
    "reason": None,
    "symptoms": None
}

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

def update_appointment_context(extracted_info: dict) -> None:
    """
    Updates global appointment context with newly extracted information.
    Only updates fields that have actual values (not null).
    """
    if not extracted_info:
        return
    
    for key in appointment_context:
        # Only update if we have a new value and field is currently empty
        if extracted_info.get(key) and not appointment_context[key]:
            appointment_context[key] = extracted_info[key]

def process_appointment_booking(user_input: str) -> dict:
    """
    Manages the appointment booking flow with interactive information gathering.
    """
    # Step 1: Extract information from user input
    extracted = extract_appointment_info_logic(user_input)
    
    # Step 2: Update context with new information (only if not already set)
    for key, value in extracted.items():
        if value and not appointment_context[key]:
            appointment_context[key] = value
    
    # If we got symptoms but no reason, use symptoms as reason
    if appointment_context.get("symptoms") and not appointment_context.get("reason"):
        appointment_context["reason"] = appointment_context["symptoms"]
    
    # Step 3: Identify missing information
    missing_required = identify_missing_info_logic(appointment_context)
    
    # Get info we've already collected for display
    collected_info = {k: v for k, v in appointment_context.items() if v}
    
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
            "extracted_info": appointment_context.copy(),
            "collected_info": collected_info,
            "missing_fields": missing_required,
            "questions": questions,
            "message": f"{collected_display}Still need: {', '.join([f.replace('_', ' ') for f in missing_required])}\n\n{questions}"
        }
    else:
        # Step 5: All required info collected - ask for additional symptoms
        return {
            "status": "ask_symptoms",
            "extracted_info": appointment_context.copy(),
            "collected_info": collected_info,
            "message": "Great! I have all the required information.\n\nDo you have any additional symptoms or concerns you'd like to mention? (Type 'done' if nothing more to add)"
        }

def process_user_input(user_input: str) -> dict:
    """
    Main entry point for processing user input for appointment booking.
    """
    try:
        result = process_appointment_booking(user_input)
        return result
    except Exception as e:
        return {
            "status": "error",
            "response": str(e)
        }

def is_all_fields_filled() -> bool:
    """Check if all fields in appointment_context are filled"""
    return all(value is not None for value in appointment_context.values())

# Main function
def main():
    print("=" * 70)
    print("Doctor Appointment Booking Agent")
    print("=" * 70)
    print("\nThis agent will help you book a doctor appointment.")
    print("Just tell me what you need, and I'll gather any missing information.")
    print("\nType 'exit' to quit\n")
    
    while True:
        user_input = input("You: ").strip()
        
        if user_input.lower() == 'exit':
            print("\nThank you for using Doctor Appointment Booking Agent. Goodbye!")
            break
        
        if not user_input:
            print("Please enter a valid input.\n")
            continue
        
        print("\n🤖 Processing your request...")
        try:
            result = process_user_input(user_input)
            
            print(f"\n{'='*70}")
            
            if result["status"] == "collecting_info":
                print("Agent:")
                print(result["message"])
                print(f"{'='*70}\n")
            
            elif result["status"] == "ask_symptoms":
                print("Agent:")
                print(result["message"])
                print(f"{'='*70}\n")
                
                # Inner loop to handle symptoms collection
                while True:
                    symptoms_input = input("You: ").strip()
                    
                    if symptoms_input.lower() == 'done' or symptoms_input.lower() == 'no':
                        # All done, print final appointment context
                        print(f"\n{'='*70}")
                        print("✅ APPOINTMENT DETAILS FINALIZED!")
                        print("\nFinal Appointment Context:")
                        print(json.dumps(appointment_context, indent=2))
                        print(f"{'='*70}\n")
                        
                        # Reset context for next appointment
                        for key in appointment_context:
                            appointment_context[key] = None
                        
                        # Check if all fields are filled, exit outer loop if yes
                        print("\nThank you for using Doctor Appointment Booking Agent. Goodbye!")
                        return
                    else:
                        # User provided additional symptoms
                        print("\n🤖 Processing additional symptoms...")
                        extracted_symptoms = extract_appointment_info_logic(symptoms_input)
                        
                        # Update symptoms in context
                        if extracted_symptoms.get("symptoms"):
                            symptom_text = extracted_symptoms["symptoms"]
                            # Convert list to string if needed
                            if isinstance(symptom_text, list):
                                symptom_text = ", ".join(symptom_text)
                            
                            if appointment_context["symptoms"]:
                                # Convert existing symptoms to string if it's a list
                                existing = appointment_context["symptoms"]
                                if isinstance(existing, list):
                                    existing = ", ".join(existing)
                                appointment_context["symptoms"] = existing + ", " + symptom_text
                            else:
                                appointment_context["symptoms"] = symptom_text
                        
                        # Check if all fields are now filled
                        if is_all_fields_filled():
                            print(f"\n{'='*70}")
                            print("✅ ALL APPOINTMENT DETAILS FILLED!")
                            print("\nFinal Appointment Context:")
                            print(json.dumps(appointment_context, indent=2))
                            print(f"{'='*70}\n")
                            
                            # Reset context for next appointment
                            for key in appointment_context:
                                appointment_context[key] = None
                            
                            print("Thank you for using Doctor Appointment Booking Agent. Goodbye!")
                            return
                        
                        print(f"\n{'='*70}")
                        print("Agent: Got it! Any other symptoms or concerns? (Type 'done' if nothing more to add)")
                        print(f"{'='*70}\n")
                
            else:
                print(f"Error: {result.get('response', 'Unknown error')}")
                print(f"{'='*70}\n")
            
        except Exception as e:
            print(f"Error: {str(e)}\n")

if __name__ == "__main__":
    main()
