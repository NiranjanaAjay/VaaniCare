import { useParams, useNavigate } from "react-router-dom";
import {
  Heart,
  ShieldAlert,
  Landmark,
  ArrowLeft,
  Mic,
  MicOff,
  Activity,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";

interface ServiceDetail {
  title: string;
  titleMalayalam: string;
  icon: LucideIcon;
}

const serviceDetails: Record<string, ServiceDetail> = {
  healthcare: {
    title: "Healthcare",
    titleMalayalam: "ആരോഗ്യ സേവനങ്ങൾ",
    icon: Heart,
  },
  emergency: {
    title: "Emergency",
    titleMalayalam: "അടിയന്തര സേവനങ്ങൾ",
    icon: ShieldAlert,
  },
  government: {
    title: "Government",
    titleMalayalam: "സർക്കാർ പദ്ധതികൾ",
    icon: Landmark,
  },
};

export default function ConversationPage() {
  const { serviceType } = useParams<{ serviceType: string }>();
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);

  const service = serviceType ? serviceDetails[serviceType] : null;

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
            className="px-5 py-2.5 bg-linear-to-r from-[#2FB7B3] to-[#6FE3D6] text-[#0B1624] font-semibold rounded-lg hover:opacity-90 transition-opacity text-sm"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const Icon = service.icon;

  return (
    <div className="min-h-screen bg-[#0B1624] flex flex-col relative overflow-hidden">
      {/* Organic Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-[-12%] left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-[#2FB7B3]/8 rounded-full blur-[130px] animate-breathe" />
        <div className="absolute bottom-[-18%] left-[-12%] w-[320px] h-[320px] bg-[#6FE3D6]/7 rounded-full blur-[90px] animate-pulse-soft" />
        <div
          className="absolute top-[50%] right-[-8%] w-[240px] h-[240px] bg-[#F2A24B]/7 rounded-full blur-[70px] animate-breathe"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(47,183,179,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(47,183,179,0.02)_1px,transparent_1px)] bg-[size:44px_44px]" />

      {/* Header */}
      <header className="relative z-10 p-4 border-b border-[#2FB7B3]/10 backdrop-blur-sm bg-[#0B1624]/85">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="p-3 rounded-xl bg-[#132238]/80 border border-[#2FB7B3]/20 text-[#6FE3D6]/70 hover:text-[#6FE3D6] hover:border-[#2FB7B3]/40 transition-all duration-300"
            aria-label="Go back to home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Icon badge */}
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-xl bg-linear-to-br from-[#2FB7B3] via-[#6FE3D6] to-[#A8E6A1] opacity-30" />
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

          {/* Status indicator */}
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#132238]/60 border border-[#2FB7B3]/10">
            <Activity className="w-3 h-3 text-[#6FE3D6]" />
            <span className="text-xs text-[#6FE3D6]/60">Ready</span>
          </div>
        </div>
      </header>

      {/* Conversation Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-sm">
          {/* Breathing Pulse Visualization */}
          <div className="relative w-44 h-44 mx-auto mb-9">
            {/* Outer breathing rings */}
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

            {/* Center circle */}
            <div className="absolute inset-9 rounded-full bg-[#132238]/80 border border-[#2FB7B3]/20 flex items-center justify-center backdrop-blur-sm">
              {isListening ? (
                /* Waveform visualization */
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
              ) : (
                <Mic
                  className="w-10 h-10 text-[#6FE3D6]/50"
                  strokeWidth={1.5}
                />
              )}
            </div>
          </div>

          <h2 className="text-xl md:text-2xl font-semibold text-white/90 mb-2.5 leading-tight">
            {isListening ? "Listening..." : "Ready to Help"}
          </h2>
          <p className="text-[#6FE3D6]/65 mb-1.5 text-sm md:text-base">
            {isListening
              ? "Speak naturally, I'm here for you"
              : "Tap the button to start speaking"}
          </p>
          <p className="text-[#6FE3D6]/40 text-xs md:text-sm">
            {isListening
              ? "സംസാരിക്കൂ, ഞാൻ കേൾക്കുന്നു"
              : "സംസാരിക്കാൻ ബട്ടൺ ടാപ്പ് ചെയ്യുക"}
          </p>
        </div>
      </main>

      {/* Voice Input Button */}
      <div className="relative z-10 p-7 flex justify-center">
        <button
          onClick={() => setIsListening(!isListening)}
          className={`
            relative w-20 h-20 rounded-full
            flex items-center justify-center
            transition-all duration-500 ease-out
            focus:outline-none focus:ring-4 focus:ring-[#2FB7B3]/30
            ${
              isListening
                ? "bg-[#F2A24B] shadow-[0_0_40px_rgba(242,162,75,0.3)]"
                : "bg-gradient-to-br from-[#2FB7B3] via-[#6FE3D6] to-[#A8E6A1] shadow-[0_0_40px_rgba(47,183,179,0.25)]"
            }
          `}
          aria-label={isListening ? "Stop listening" : "Start voice input"}
        >
          {/* Breathing effect when listening */}
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
      </div>

      {/* Bottom hint */}
      <div className="relative z-10 pb-6 text-center px-4">
        <p className="text-[#6FE3D6]/25 text-xs leading-relaxed">
          Your voice, securely processed with care
        </p>
      </div>
    </div>
  );
}
