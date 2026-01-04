import { useParams, useNavigate } from "react-router-dom";
import {
  Heart,
  ShieldAlert,
  Landmark,
  ArrowLeft,
  Mic,
  MicOff,
  Activity,
  CheckCircle,
  AlertCircle,
  Loader2,
  Volume2,
  VolumeX,
  Scale,
  Briefcase,
  Send,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useCallback, useState, useRef } from "react";
import { useExecutionStore } from "../services";
import { useVoiceBridge } from "../hooks";
import type { ServiceDomain, Locale } from "../types";

interface ServiceDetail {
  title: string;
  titleMalayalam: string;
  icon: LucideIcon;
  domain: ServiceDomain;
  welcomeMessage: string;
  welcomeMessageMalayalam: string;
}

const serviceDetails: Record<string, ServiceDetail> = {
  healthcare: {
    title: "Healthcare",
    titleMalayalam: "ആരോഗ്യ സേവനങ്ങൾ",
    icon: Heart,
    domain: "healthcare",
    welcomeMessage:
      "I can help you find hospitals, book appointments, or get medical guidance. What do you need?",
    welcomeMessageMalayalam:
      "ആശുപത്രികൾ കണ്ടെത്താനോ അപ്പോയിന്റ്മെന്റ് ബുക്ക് ചെയ്യാനോ മെഡിക്കൽ മാർഗ്ഗനിർദ്ദേശം നേടാനോ എനിക്ക് നിങ്ങളെ സഹായിക്കാനാകും. എന്താണ് വേണ്ടത്?",
  },
  emergency: {
    title: "Emergency",
    titleMalayalam: "അടിയന്തര സേവനങ്ങൾ",
    icon: ShieldAlert,
    domain: "emergency",
    welcomeMessage:
      "I'm here to help in emergencies. Tell me what's happening and I'll connect you to the right help.",
    welcomeMessageMalayalam:
      "അടിയന്തര സാഹചര്യങ്ങളിൽ സഹായിക്കാൻ ഞാൻ ഇവിടെയുണ്ട്. എന്താണ് സംഭവിക്കുന്നതെന്ന് പറയൂ.",
  },
  legal: {
    title: "Legal Aid",
    titleMalayalam: "നിയമ സഹായം",
    icon: Scale,
    domain: "legal",
    welcomeMessage:
      "I can help you find legal aid, connect with NGOs, or guide you through legal processes.",
    welcomeMessageMalayalam:
      "നിയമ സഹായം കണ്ടെത്താനോ എൻജിഒകളുമായി ബന്ധപ്പെടാനോ നിയമ പ്രക്രിയകളിലൂടെ നിങ്ങളെ നയിക്കാനോ എനിക്ക് സഹായിക്കാനാകും.",
  },
  government: {
    title: "Government",
    titleMalayalam: "സർക്കാർ പദ്ധതികൾ",
    icon: Landmark,
    domain: "government",
    welcomeMessage:
      "I can help you find government schemes you're eligible for and guide you through applications.",
    welcomeMessageMalayalam:
      "നിങ്ങൾക്ക് യോഗ്യതയുള്ള സർക്കാർ പദ്ധതികൾ കണ്ടെത്താനും അപേക്ഷകളിലൂടെ നിങ്ങളെ നയിക്കാനും എനിക്ക് സഹായിക്കാനാകും.",
  },
  employment: {
    title: "Employment",
    titleMalayalam: "തൊഴിൽ സഹായം",
    icon: Briefcase,
    domain: "employment",
    welcomeMessage:
      "I can help you find jobs, check requirements, and guide you through applications.",
    welcomeMessageMalayalam:
      "ജോലികൾ കണ്ടെത്താനും ആവശ്യകതകൾ പരിശോധിക്കാനും അപേക്ഷകളിലൂടെ നിങ്ങളെ നയിക്കാനും എനിക്ക് സഹായിക്കാനാകും.",
  },
};

// Simple intent detection (in production, use NLP/LLM)
function detectIntent(input: string, domain: ServiceDomain): string {
  const lower = input.toLowerCase();

  switch (domain) {
    case "healthcare":
      if (lower.includes("book") || lower.includes("appointment"))
        return "book_appointment";
      if (
        lower.includes("hospital") ||
        lower.includes("find") ||
        lower.includes("near")
      )
        return "find_hospital";
      if (lower.includes("doctor")) return "find_doctor";
      return "healthcare_general";
    case "emergency":
      if (lower.includes("police")) return "call_police";
      if (lower.includes("ambulance") || lower.includes("medical"))
        return "call_ambulance";
      if (lower.includes("fire")) return "call_fire";
      return "emergency_general";
    case "legal":
      if (lower.includes("lawyer") || lower.includes("advocate"))
        return "find_legal_aid";
      if (lower.includes("ngo") || lower.includes("help")) return "connect_ngo";
      if (lower.includes("complaint") || lower.includes("file"))
        return "file_complaint";
      return "get_guidance";
    case "government":
      if (lower.includes("pension")) return "find_pension_scheme";
      if (lower.includes("health") || lower.includes("ayushman"))
        return "find_health_scheme";
      if (lower.includes("house") || lower.includes("housing"))
        return "find_housing_scheme";
      if (lower.includes("apply")) return "apply_scheme";
      return "find_schemes";
    case "employment":
      if (lower.includes("apply")) return "apply_job";
      return "find_jobs";
    default:
      return "general_query";
  }
}

// Extract entities from input
function extractEntities(input: string): Record<string, unknown> {
  const entities: Record<string, unknown> = {};
  const lower = input.toLowerCase();

  const conditions = ["chest pain", "fever", "cough", "headache", "injury"];
  for (const c of conditions) {
    if (lower.includes(c)) {
      entities.symptoms = c;
      break;
    }
  }

  const specialties = ["cardiology", "orthopedic", "general", "emergency"];
  for (const s of specialties) {
    if (lower.includes(s)) {
      entities.specialty = s;
      break;
    }
  }

  if (lower.includes("urgent") || lower.includes("emergency"))
    entities.urgency = "immediate";
  if (lower.includes("free") || lower.includes("government"))
    entities.cost = "free";

  return entities;
}

export default function ConversationPage() {
  const { serviceType } = useParams<{ serviceType: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Store state
  const {
    status,
    currentSpeech,
    pendingClarification,
    events,
    startTask,
    provideAnswer,
    cancelTask,
    reset,
  } = useExecutionStore();

  // Voice bridge
  const {
    isListening,
    transcript,
    interimTranscript,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    isSupported,
    error: voiceError,
  } = useVoiceBridge({
    locale: "en-IN",
    onResult: (result) => handleVoiceInput(result.transcript),
  });

  // Local state
  const [locale] = useState<Locale>("en-IN");
  const [hasGreeted, setHasGreeted] = useState(false);
  const [textInput, setTextInput] = useState("");

  const service = serviceType ? serviceDetails[serviceType] : null;

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  // Speak welcome message on mount
  useEffect(() => {
    if (service && !hasGreeted && isSupported) {
      const timer = setTimeout(() => {
        const message =
          locale === "ml-IN"
            ? service.welcomeMessageMalayalam
            : service.welcomeMessage;
        speak(message, locale);
        setHasGreeted(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [service, hasGreeted, isSupported, locale, speak]);

  const lastSpokenId = useRef<string | null>(null);

  // Speak when there's new speech content
  useEffect(() => {
    if (
      currentSpeech &&
      currentSpeech.id !== lastSpokenId.current &&
      !isSpeaking &&
      !isListening
    ) {
      const text =
        locale === "ml-IN" ? currentSpeech.textMalayalam : currentSpeech.text;
      speak(text, locale);
      if (currentSpeech.id) {
        lastSpokenId.current = currentSpeech.id;
      }
    }
  }, [currentSpeech, locale, speak, isSpeaking, isListening]);

  // Handle voice input
  const handleVoiceInput = useCallback(
    async (input: string) => {
      if (!service || !input.trim()) return;

      if (status === "waiting_input" && pendingClarification) {
        await provideAnswer(pendingClarification.field, input.trim());
        return;
      }

      const intent = detectIntent(input, service.domain);
      const entities = extractEntities(input);
      await startTask(service.domain, intent, entities, locale);
    },
    [service, status, pendingClarification, provideAnswer, startTask, locale],
  );

  // Handle text submit
  const handleTextSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!textInput.trim()) return;

      const input = textInput;
      setTextInput("");
      await handleVoiceInput(input);
    },
    [textInput, handleVoiceInput],
  );

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      if (isSpeaking) stopSpeaking();
      startListening();
    }
  }, [isListening, isSpeaking, startListening, stopListening, stopSpeaking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      reset();
      stopSpeaking();
    };
  }, [reset, stopSpeaking]);

  if (!service) {
    return (
      <div className="min-h-screen bg-[#0B1624] flex items-center justify-center">
        <div className="text-center p-8 max-w-sm">
          <div className="w-18 h-18 mx-auto mb-5 rounded-full bg-[#132238] border border-[#2FB7B3]/20 flex items-center justify-center">
            <span className="text-2xl">🔍</span>
          </div>
          <p className="text-white text-lg mb-1">Service not found</p>
          <p className="text-[#6FE3D6]/55 mb-5 text-sm">
            The service you're looking for doesn't exist
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2.5 bg-gradient-to-r from-[#2FB7B3] to-[#6FE3D6] text-[#0B1624] font-semibold rounded-lg hover:opacity-90 transition-opacity text-sm"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const Icon = service.icon;
  const getStatusInfo = () => {
    switch (status) {
      case "running":
        return { text: "Processing", color: "text-[#F2A24B]", icon: Loader2 };
      case "waiting_input":
        return { text: "Waiting", color: "text-[#6FE3D6]", icon: Activity };
      case "completed":
        return { text: "Done", color: "text-[#A8E6A1]", icon: CheckCircle };
      case "failed":
        return { text: "Error", color: "text-red-400", icon: AlertCircle };
      default:
        return { text: "Ready", color: "text-[#6FE3D6]/60", icon: Activity };
    }
  };
  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-[#0B1624] flex flex-col relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-[-12%] left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-[#2FB7B3]/8 rounded-full blur-[130px] animate-breathe" />
        <div className="absolute bottom-[-18%] left-[-12%] w-[320px] h-[320px] bg-[#6FE3D6]/7 rounded-full blur-[90px] animate-pulse-soft" />
        <div
          className="absolute top-[50%] right-[-8%] w-[240px] h-[240px] bg-[#F2A24B]/7 rounded-full blur-[70px] animate-breathe"
          style={{ animationDelay: "1s" }}
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(47,183,179,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(47,183,179,0.02)_1px,transparent_1px)] bg-[size:44px_44px]" />

      {/* Header */}
      <header className="relative z-10 p-4 border-b border-[#2FB7B3]/10 backdrop-blur-sm bg-[#0B1624]/85">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => {
              reset();
              navigate("/");
            }}
            className="p-3 rounded-xl bg-[#132238]/80 border border-[#2FB7B3]/20 text-[#6FE3D6]/70 hover:text-[#6FE3D6] hover:border-[#2FB7B3]/40 transition-all duration-300"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#2FB7B3] via-[#6FE3D6] to-[#A8E6A1] opacity-30" />
            <div className="absolute inset-[2px] rounded-xl bg-[#0B1624] flex items-center justify-center">
              <Icon className="w-5 h-5 text-[#6FE3D6]" strokeWidth={1.5} />
            </div>
          </div>
          <div>
            <h1 className="text-base md:text-lg font-semibold text-white/90 leading-tight">
              {service.title}
            </h1>
            <p className="text-[11px] md:text-xs text-[#6FE3D6]/55">
              {service.titleMalayalam}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#132238]/60 border border-[#2FB7B3]/10">
            <StatusIcon
              className={`w-3 h-3 ${statusInfo.color} ${status === "running" ? "animate-spin" : ""}`}
            />
            <span className={`text-xs ${statusInfo.color}`}>
              {statusInfo.text}
            </span>
          </div>
        </div>
      </header>

      {/* Conversation Area */}
      <main className="relative z-10 flex-1 flex flex-col p-4 overflow-hidden">
        <div className="flex-1 overflow-y-auto mb-4 space-y-3 max-w-2xl mx-auto w-full">
          {/* Welcome message */}
          {events.length === 0 && (
            <div className="bg-[#132238]/60 rounded-2xl p-4 border border-[#2FB7B3]/10">
              <p className="text-white/90 text-sm">
                {locale === "ml-IN"
                  ? service.welcomeMessageMalayalam
                  : service.welcomeMessage}
              </p>
            </div>
          )}

          {/* Event messages */}
          {events.map((event, index) => (
            <div
              key={`${event.timestamp}-${index}`}
              className={`rounded-2xl p-4 border ${event.type === "clarify" || event.type === "step_completed"
                ? "bg-[#132238]/60 border-[#2FB7B3]/10"
                : event.type === "task_failed" || event.type === "step_failed"
                  ? "bg-red-500/10 border-red-500/20"
                  : event.type === "task_completed"
                    ? "bg-[#A8E6A1]/10 border-[#A8E6A1]/20"
                    : "bg-[#132238]/40 border-[#2FB7B3]/5"
                }`}
            >
              <p className="text-white/90 text-sm">
                {locale === "ml-IN" ? event.messageMalayalam : event.message}
              </p>

              {/* Render Schemes */}
              {Array.isArray(event.data?.schemes) && (
                <div className="mt-4 space-y-3">
                  {(event.data?.schemes as any[]).map((scheme: any, idx: number) => (
                    <a
                      key={idx}
                      href={scheme.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 rounded-xl bg-[#0B1624]/50 border border-[#2FB7B3]/20 hover:border-[#2FB7B3]/50 transition-colors group"
                    >
                      <h3 className="text-[#6FE3D6] font-semibold text-sm mb-1 group-hover:text-[#2FB7B3] transition-colors">
                        {scheme.title}
                      </h3>
                      <p className="text-white/60 text-xs line-clamp-2 leading-relaxed">
                        {scheme.snippet}
                      </p>
                    </a>
                  ))}
                  {!!event.data.disclaimer && (
                    <p className="text-[10px] text-white/40 mt-3 italic border-t border-white/5 pt-2">
                      {event.data.disclaimer as string}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Current user input */}
          {(transcript || interimTranscript) && (
            <div className="bg-[#2FB7B3]/10 rounded-2xl p-4 border border-[#2FB7B3]/20 ml-auto max-w-[80%]">
              <p className="text-white/90 text-sm">
                {transcript}
                <span className="text-[#6FE3D6]/50">{interimTranscript}</span>
              </p>
            </div>
          )}

          {status === "waiting_input" &&
            pendingClarification &&
            !isListening && (
              <div className="text-center py-2">
                <p className="text-[#F2A24B]/80 text-xs animate-pulse">
                  Tap the mic to answer
                </p>
              </div>
            )}
          <div ref={messagesEndRef} />
        </div>

        {/* Voice Input Section */}
        <div className="text-center max-w-sm mx-auto w-full">
          <div className="relative w-36 h-36 mx-auto mb-6">
            <div
              className={`absolute inset-0 rounded-full border-2 border-[#2FB7B3]/20 ${isListening ? "animate-ping" : "animate-breathe"}`}
              style={{ animationDuration: isListening ? "1.5s" : "4s" }}
            />
            <div
              className={`absolute inset-3 rounded-full border border-[#6FE3D6]/20 ${isListening ? "animate-pulse" : "animate-breathe"}`}
              style={{
                animationDelay: "0.5s",
                animationDuration: isListening ? "1s" : "4s",
              }}
            />
            <div
              className={`absolute inset-6 rounded-full border border-[#A8E6A1]/15 ${isListening ? "animate-pulse" : "animate-breathe"}`}
              style={{
                animationDelay: "1s",
                animationDuration: isListening ? "1.2s" : "4s",
              }}
            />
            <div className="absolute inset-9 rounded-full bg-[#132238]/80 border border-[#2FB7B3]/20 flex items-center justify-center backdrop-blur-sm">
              {isListening ? (
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-gradient-to-t from-[#2FB7B3] via-[#6FE3D6] to-[#A8E6A1] rounded-full"
                      style={{
                        animation: `wave 0.8s ease-in-out infinite`,
                        animationDelay: `${i * 0.1}s`,
                        height: "20px",
                      }}
                    />
                  ))}
                </div>
              ) : isSpeaking ? (
                <Volume2
                  className="w-8 h-8 text-[#F2A24B]/70 animate-pulse"
                  strokeWidth={1.5}
                />
              ) : (
                <Mic className="w-8 h-8 text-[#6FE3D6]/50" strokeWidth={1.5} />
              )}
            </div>
          </div>

          <p className="text-white/80 text-sm mb-1">
            {isListening
              ? "Listening..."
              : isSpeaking
                ? "Speaking..."
                : status === "waiting_input"
                  ? pendingClarification?.question || "Your turn"
                  : "Tap to speak"}
          </p>
          <p className="text-[#6FE3D6]/40 text-xs mb-4">
            {isListening
              ? "സംസാരിക്കൂ, ഞാൻ കേൾക്കുന്നു"
              : isSpeaking
                ? "സംസാരിക്കുന്നു..."
                : "സംസാരിക്കാൻ ടാപ്പ് ചെയ്യുക"}
          </p>
          {voiceError && (
            <p className="text-red-400/80 text-xs mb-3">{voiceError}</p>
          )}
        </div>
      </main>

      {/* Voice Input Button */}
      <div className="relative z-10 p-6 flex justify-center gap-4">
        {isSpeaking && (
          <button
            onClick={stopSpeaking}
            className="w-14 h-14 rounded-full bg-[#132238]/80 border border-[#2FB7B3]/20 flex items-center justify-center text-[#6FE3D6]/70 hover:text-[#6FE3D6] transition-colors"
            aria-label="Stop speaking"
          >
            <VolumeX className="w-6 h-6" strokeWidth={1.5} />
          </button>
        )}
        <button
          onClick={toggleListening}
          disabled={!isSupported}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ease-out focus:outline-none focus:ring-4 focus:ring-[#2FB7B3]/30 disabled:opacity-50 disabled:cursor-not-allowed ${isListening ? "bg-[#F2A24B] shadow-[0_0_40px_rgba(242,162,75,0.3)]" : "bg-gradient-to-br from-[#2FB7B3] via-[#6FE3D6] to-[#A8E6A1] shadow-[0_0_40px_rgba(47,183,179,0.25)]"}`}
          aria-label={isListening ? "Stop listening" : "Start voice input"}
        >
          {isListening && (
            <>
              <span className="absolute inset-0 rounded-full bg-[#F2A24B] animate-ping opacity-20" />
              <span className="absolute inset-[-8px] rounded-full border-2 border-[#F2A24B]/30 animate-pulse" />
            </>
          )}
          {isListening ? (
            <MicOff
              className="w-8 h-8 text-[#0B1624] relative z-10"
              strokeWidth={1.5}
            />
          ) : (
            <Mic
              className="w-8 h-8 text-[#0B1624] relative z-10"
              strokeWidth={1.5}
            />
          )}
        </button>
        {(status === "running" || status === "waiting_input") && (
          <button
            onClick={cancelTask}
            className="w-14 h-14 rounded-full bg-[#132238]/80 border border-red-500/20 flex items-center justify-center text-red-400/70 hover:text-red-400 transition-colors"
            aria-label="Cancel task"
          >
            <AlertCircle className="w-6 h-6" strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Text Input */}
      <div className="relative z-10 px-4 pb-2">
        <form
          onSubmit={handleTextSubmit}
          className="max-w-xl mx-auto flex items-center gap-2"
        >
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={
              locale === "ml-IN"
                ? "അല്ലെങ്കിൽ ഇവിടെ ടൈപ്പ് ചെയ്യുക..."
                : "Or type here..."
            }
            className="flex-1 bg-[#132238]/80 border border-[#2FB7B3]/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#2FB7B3]/50 transition-colors text-sm"
          />
          <button
            type="submit"
            disabled={!textInput.trim() || status === "running"}
            className="p-3 rounded-xl bg-[#2FB7B3]/10 border border-[#2FB7B3]/20 text-[#6FE3D6] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2FB7B3]/20 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Bottom hint */}
      <div className="relative z-10 pb-5 text-center px-4">
        <p className="text-[#6FE3D6]/25 text-xs leading-relaxed">
          {!isSupported
            ? "Voice not supported in this browser"
            : "Your voice, securely processed with care"}
        </p>
      </div>
    </div>
  );
}
