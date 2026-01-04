/**
 * Execution Store for VaaniCare
 * Manages the state of task execution in conversations
 */

import { create } from "zustand";
import type { Locale, ServiceDomain } from "../types";

export interface SpeechContent {
  id?: string;
  text: string;
  textMalayalam: string;
}

export interface PendingClarification {
  field: string;
  question: string;
  questionMalayalam: string;
}

export interface Scheme {
  title: string;
  url: string;
  snippet: string;
  source_query: string;
}

export interface ExecutionEvent {
  type:
  | "step_started"
  | "step_completed"
  | "step_failed"
  | "clarify"
  | "task_completed"
  | "task_failed";
  message: string;
  messageMalayalam: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

export type ExecutionStatus =
  | "idle"
  | "running"
  | "waiting_input"
  | "completed"
  | "failed";

interface ExecutionState {
  status: ExecutionStatus;
  currentSpeech: SpeechContent | null;
  pendingClarification: PendingClarification | null;
  events: ExecutionEvent[];
  currentDomain: ServiceDomain | null;
  currentIntent: string | null;
  entities: Record<string, unknown>;
  locale: Locale;
}

interface ExecutionActions {
  startTask: (
    domain: ServiceDomain,
    intent: string,
    entities: Record<string, unknown>,
    locale: Locale,
  ) => Promise<void>;
  provideAnswer: (field: string, answer: string) => Promise<void>;
  cancelTask: () => void;
  reset: () => void;
}

type ExecutionStore = ExecutionState & ExecutionActions;

const initialState: ExecutionState = {
  status: "idle",
  currentSpeech: null,
  pendingClarification: null,
  events: [],
  currentDomain: null,
  currentIntent: null,
  entities: {},
  locale: "en-IN",
};

const GOVERNMENT_REQUIRED_FIELDS = [
  "age",
  "gender",
  "state",
  "income_bracket",
  "occupation",
  "category",
];

export const useExecutionStore = create<ExecutionStore>((set, get) => ({
  ...initialState,

  startTask: async (domain, intent, entities, locale) => {
    set({
      status: "running",
      currentDomain: domain,
      currentIntent: intent,
      entities,
      locale,
      events: [],
    });

    // Add start event
    const startEvent: ExecutionEvent = {
      type: "step_started",
      message: `Processing your ${domain} request...`,
      messageMalayalam: `നിങ്ങളുടെ ${domain} അഭ്യർത്ഥന പ്രോസസ്സ് ചെയ്യുന്നു...`,
      timestamp: Date.now(),
    };

    set((state) => ({
      events: [...state.events, startEvent],
    }));

    // Start processing
    await processTaskLogic(get, set, domain, intent, entities);
  },

  provideAnswer: async (field, answer) => {
    const { currentDomain, currentIntent, entities } = get();

    if (!currentDomain || !currentIntent) return;

    // Add the answer to entities
    const updatedEntities = { ...entities, [field]: answer };

    set({
      status: "running",
      entities: updatedEntities,
      pendingClarification: null,
    });

    // Continue processing with new info
    await processTaskLogic(get, set, currentDomain, currentIntent, updatedEntities);
  },

  cancelTask: () => {
    set({
      ...initialState,
      events: get().events,
    });

    const cancelEvent: ExecutionEvent = {
      type: "task_failed",
      message: "Task cancelled",
      messageMalayalam: "ടാസ്ക് റദ്ദാക്കി",
      timestamp: Date.now(),
    };

    set((state) => ({
      events: [...state.events, cancelEvent],
    }));
  },

  reset: () => {
    set(initialState);
  },
}));

// Core logic for processing tasks
async function processTaskLogic(
  get: () => ExecutionStore,
  set: (state: Partial<ExecutionState>) => void,
  domain: ServiceDomain,
  intent: string,
  entities: Record<string, unknown>
) {
  // Simulate thinking delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Special handling for Government Scheme Search
  if (domain === "government" && intent === "find_schemes") {
    const missingField = GOVERNMENT_REQUIRED_FIELDS.find(f => !entities[f]);

    if (missingField) {
      const question = getGovernmentQuestion(missingField);

      set({
        status: "waiting_input",
        pendingClarification: question,
        currentSpeech: {
          id: `speech-${Date.now()}`,
          text: question.question,
          textMalayalam: question.questionMalayalam
        }
      });

      const clarifyEvent: ExecutionEvent = {
        type: "clarify",
        message: question.question,
        messageMalayalam: question.questionMalayalam,
        timestamp: Date.now()
      };

      set({ events: [...get().events, clarifyEvent] });
      return;
    }

    // All fields collected, call API
    try {
      const response = await fetch("http://127.0.0.1:8000/find-schemes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entities)
      });

      if (!response.ok) throw new Error("Failed to fetch schemes");

      const data = await response.json();

      const count = data.count || 0;
      const schemes = data.schemes || [];

      const message = `I found ${count} schemes for you in ${entities.state}.`;
      const messageMl = `${entities.state}-ൽ നിങ്ങൾക്കായി ${count} പദ്ധതികൾ കണ്ടെത്തി.`;

      const completedEvent: ExecutionEvent = {
        type: "task_completed",
        message,
        messageMalayalam: messageMl,
        timestamp: Date.now(),
        data: { schemes, ...data }
      };

      set({
        status: "completed",
        currentSpeech: { id: `speech-${Date.now()}`, text: message, textMalayalam: messageMl },
        events: [...get().events, completedEvent]
      });

    } catch (error) {
      console.error(error);
      const errorEvent: ExecutionEvent = {
        type: "task_failed",
        message: "Sorry, I encountered an error finding schemes.",
        messageMalayalam: "ക്ഷമിക്കണം, പദ്ധതികൾ കണ്ടെത്തുന്നതിൽ ഒരു പിശക് സംഭവിച്ചു.",
        timestamp: Date.now()
      };

      set({
        status: "failed",
        currentSpeech: { text: "Sorry, something went wrong.", textMalayalam: "ക്ഷമിക്കണം, എന്തോ കുഴപ്പം സംഭവിച്ചു." },
        events: [...get().events, errorEvent]
      });
    }
    return;
  }

  // Default existing logic for other domains
  const needsClarification = Object.keys(entities).length === 0;

  if (needsClarification) {
    const clarificationQuestions = getClarificationQuestion(domain, intent);
    set({
      status: "waiting_input",
      pendingClarification: clarificationQuestions,
      currentSpeech: {
        id: `speech-${Date.now()}`,
        text: clarificationQuestions.question,
        textMalayalam: clarificationQuestions.questionMalayalam,
      },
    });

    const clarifyEvent: ExecutionEvent = {
      type: "clarify",
      message: clarificationQuestions.question,
      messageMalayalam: clarificationQuestions.questionMalayalam,
      timestamp: Date.now(),
    };

    set({
      events: [...get().events, clarifyEvent],
    });
  } else {
    // Complete the task (Mock)
    await completeTaskMock(get, set, domain, intent, entities);
  }
}

function getGovernmentQuestion(field: string): PendingClarification {
  const questions: Record<string, PendingClarification> = {
    age: {
      field: "age",
      question: "What is your age?",
      questionMalayalam: "നിങ്ങളുടെ പ്രായം എത്രയാണ്?"
    },
    gender: {
      field: "gender",
      question: "What is your gender?",
      questionMalayalam: "നിങ്ങളുടെ ലിംഗഭേദം എന്താണ്?"
    },
    state: {
      field: "state",
      question: "Which state are you from?",
      questionMalayalam: "ഏത് സംസ്ഥാനത്താണ് നിങ്ങൾ താമസിക്കുന്നത്?"
    },
    income_bracket: {
      field: "income_bracket",
      question: "What is your annual income bracket?",
      questionMalayalam: "നിങ്ങളുടെ വാർഷിക വരുമാനം എത്രയാണ്?"
    },
    occupation: {
      field: "occupation",
      question: "What is your occupation?",
      questionMalayalam: "നിങ്ങളുടെ തൊഴിൽ എന്താണ്?"
    },
    category: {
      field: "category",
      question: "What is your category? (e.g., General, OBC, SC, ST)",
      questionMalayalam: "നിങ്ങളുടെ വിഭാഗം ഏതാണ്? (ഉദാഹരണത്തിന് General, OBC, SC, ST)"
    }
  };
  return questions[field] || { field, question: `What is your ${field}?`, questionMalayalam: `${field} എന്താണ്?` };
}

// Helper function to get clarification questions (Legacy/Other domains)
function getClarificationQuestion(
  domain: ServiceDomain,
  intent: string,
): PendingClarification {
  const questions: Record<string, Record<string, PendingClarification>> = {
    healthcare: {
      find_hospital: {
        field: "location",
        question: "Where are you located? I'll find hospitals near you.",
        questionMalayalam:
          "നിങ്ങൾ എവിടെയാണ്? നിങ്ങളുടെ അടുത്തുള്ള ആശുപത്രികൾ കണ്ടെത്താം.",
      },
      book_appointment: {
        field: "specialty",
        question:
          "What type of doctor do you need? For example, general physician, cardiologist, etc.",
        questionMalayalam:
          "ഏത് തരം ഡോക്ടറാണ് വേണ്ടത്? ഉദാഹരണത്തിന്, ജനറൽ ഫിസിഷ്യൻ, കാർഡിയോളജിസ്റ്റ് മുതലായവ.",
      },
      default: {
        field: "details",
        question: "Can you tell me more about what you need help with?",
        questionMalayalam: "എന്താണ് വേണ്ടതെന്ന് കൂടുതൽ പറയാമോ?",
      },
    },
    emergency: {
      default: {
        field: "situation",
        question: "What is your emergency? Are you safe right now?",
        questionMalayalam:
          "എന്താണ് നിങ്ങളുടെ അടിയന്തര സാഹചര്യം? നിങ്ങൾ ഇപ്പോൾ സുരക്ഷിതരാണോ?",
      },
    },
    legal: {
      default: {
        field: "issue",
        question: "What legal issue do you need help with?",
        questionMalayalam: "ഏത് നിയമ പ്രശ്നത്തിലാണ് സഹായം വേണ്ടത്?",
      },
    },
    government: {
      default: {
        field: "scheme_type",
        question:
          "What type of government scheme are you looking for? For example, pension, housing, healthcare, etc.",
        questionMalayalam:
          "ഏത് തരം സർക്കാർ പദ്ധതിയാണ് നോക്കുന്നത്? ഉദാഹരണത്തിന്, പെൻഷൻ, ഭവനം, ആരോഗ്യ പരിരക്ഷ മുതലായവ.",
      },
    },
    employment: {
      default: {
        field: "job_type",
        question: "What type of job are you looking for?",
        questionMalayalam: "ഏത് തരം ജോലിയാണ് നോക്കുന്നത്?",
      },
    },
  };

  const domainQuestions = questions[domain] || questions.healthcare;
  return (
    domainQuestions[intent] ||
    domainQuestions.default || {
      field: "details",
      question: "Can you tell me more about what you need?",
      questionMalayalam: "എന്താണ് വേണ്ടതെന്ന് കൂടുതൽ പറയാമോ?",
    }
  );
}

// Helper function to complete a task (Mock for non-government)
async function completeTaskMock(
  get: () => ExecutionStore,
  set: (state: Partial<ExecutionState>) => void,
  domain: ServiceDomain,
  intent: string,
  entities: Record<string, unknown>,
) {
  // Simulate processing
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Generate response based on domain and intent
  const response = generateResponse(domain, intent, entities);

  const completedEvent: ExecutionEvent = {
    type: "task_completed",
    message: response.en,
    messageMalayalam: response.ml,
    timestamp: Date.now(),
    data: { domain, intent, entities },
  };

  set({
    status: "completed",
    currentSpeech: {
      id: `speech-${Date.now()}`,
      text: response.en,
      textMalayalam: response.ml,
    },
    events: [...get().events, completedEvent],
  });
}

// Generate response based on domain and intent
function generateResponse(
  domain: ServiceDomain,
  intent: string,
  entities: Record<string, unknown>,
): { en: string; ml: string } {
  const responses: Record<ServiceDomain, { en: string; ml: string }> = {
    healthcare: {
      en: `I found some healthcare options for you. ${entities.location ? `Near ${entities.location}, ` : ""}I can help you find hospitals and doctors.`,
      ml: `നിങ്ങൾക്കായി ചില ആരോഗ്യ സേവന ഓപ്ഷനുകൾ കണ്ടെത്തി. ${entities.location ? `${entities.location}ന് സമീപം, ` : ""}ആശുപത്രികളും ഡോക്ടർമാരെയും കണ്ടെത്താൻ എനിക്ക് സഹായിക്കാനാകും.`,
    },
    emergency: {
      en: "I understand this is urgent. Here are the emergency contacts: Police - 100, Ambulance - 108, Fire - 101. Stay safe!",
      ml: "ഇത് അടിയന്തരമാണെന്ന് മനസ്സിലായി. അടിയന്തര നമ്പറുകൾ: പോലീസ് - 100, ആംബുലൻസ് - 108, ഫയർ - 101. സുരക്ഷിതരായിരിക്കുക!",
    },
    legal: {
      en: "I can connect you with legal aid services. There are free legal aid clinics and NGOs that can help.",
      ml: "നിയമ സഹായ സേവനങ്ങളുമായി ബന്ധപ്പെടുത്താൻ എനിക്ക് കഴിയും. സഹായിക്കാൻ കഴിയുന്ന സൗജന്യ നിയമ സഹായ ക്ലിനിക്കുകളും എൻജിഒകളും ഉണ്ട്.",
    },
    government: {
      en: "I found some government schemes you may be eligible for. Let me show you the options.",
      ml: "നിങ്ങൾക്ക് യോഗ്യതയുള്ള ചില സർക്കാർ പദ്ധതികൾ കണ്ടെത്തി. ഓപ്ഷനുകൾ കാണിക്കാം.",
    },
    employment: {
      en: "I found some job opportunities that might interest you. Let me share the details.",
      ml: "നിങ്ങൾക്ക് താൽപ്പര്യമുണ്ടാകാവുന്ന ചില ജോലി അവസരങ്ങൾ കണ്ടെത്തി. വിശദാംശങ്ങൾ പങ്കിടാം.",
    },
  };

  return responses[domain] || responses.healthcare;
}
