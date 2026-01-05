import { useEffect, useState, useRef } from "react";
import { Header } from "@/components/Header";
import { VoiceIndicator } from "@/components/VoiceButton";
import { ServiceGrid } from "@/components/ServiceCard";
import { useTranslation } from "@/contexts/TranslationContext";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import {
  routeFromTranscript,
  getFullGreetingWithOptions,
  ServiceId,
} from "@/lib/voiceNavigation";
import { cn } from "@/lib/utils";
import { Mic, Volume2 } from "lucide-react";

interface HomeScreenProps {
  onServiceSelect: (serviceId: ServiceId) => void;
}

export function HomeScreen({ onServiceSelect }: HomeScreenProps) {
  const { t, currentLanguage } = useTranslation();
  const [hasGreeted, setHasGreeted] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const shouldListenAfterSpeakRef = useRef(true);

  const {
    isListening,
    startListening,
    stopListening,
    isSupported: sttSupported,
  } = useVoiceRecognition({
    language: currentLanguage,
    onResult: handleVoiceResult,
    onStart: () => {
      setStatusText(t("app.listening"));
    },
    onEnd: () => {
      // Will auto-start listening after speak ends
    },
    onError: (error) => {
      console.error("Voice recognition error:", error);
      setStatusText(t("voice.tryAgain"));
      // Retry listening after error
      setTimeout(() => {
        if (shouldListenAfterSpeakRef.current && !isMuted) {
          startListening();
        }
      }, 1000);
    },
  });

  const {
    speak,
    isSpeaking,
    stop: stopSpeaking,
    isSupported: ttsSupported,
  } = useSpeechSynthesis({
    language: currentLanguage,
    rate: 0.9,
    onEnd: () => {
      // Auto-start listening after speaking ends
      if (shouldListenAfterSpeakRef.current && !isMuted && sttSupported) {
        setTimeout(() => {
          startListening();
        }, 300);
      }
    },
  });

  function handleVoiceResult(text: string, isFinal: boolean) {
    console.log("🎯 handleVoiceResult called:", {
      text,
      isFinal,
      currentLanguage,
    });
    setTranscript(text);

    if (isFinal && text.trim()) {
      console.log("🎯 Processing final transcript:", text);
      setStatusText(t("app.processing"));

      try {
        const decision = routeFromTranscript(text, currentLanguage);
        console.log("🎯 Decision:", decision);

        if (decision.action === "navigate" && decision.targetId) {
          console.log("🎯 Navigating to:", decision.targetId);
          shouldListenAfterSpeakRef.current = false; // Don't auto-listen, navigating away
          const serviceName = t(`services.${decision.targetId}.name`);
          if (!isMuted) {
            speak(serviceName);
          }
          setTimeout(() => {
            onServiceSelect(decision.targetId as ServiceId);
          }, 500);
        } else if (decision.action === "help") {
          // Announce all available service options for visually impaired users
          const serviceListText =
            t("app.serviceOptions") + " " + t("app.serviceList");
          if (!isMuted) {
            speak(serviceListText);
          }
          setStatusText(t("app.chooseService"));
        } else {
          console.log("🎯 No match, action was:", decision.action);
          const errorText = t("voice.tryAgain");
          if (!isMuted) {
            speak(errorText);
          }
          setStatusText(errorText);
        }
      } catch (error) {
        console.error("🎯 Error in routeFromTranscript:", error);
      }

      setTranscript("");
    }
  }

  // Auto-greet when app opens - announces all service options for visually impaired users
  useEffect(() => {
    if (!hasGreeted && ttsSupported && !isMuted) {
      const greetingKey = getFullGreetingWithOptions(currentLanguage);
      const greeting = t(`app.${greetingKey}`);

      // Small delay to ensure the page is rendered
      const timer = setTimeout(() => {
        speak(greeting);
        setHasGreeted(true);
        setStatusText(t("app.chooseService"));
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [hasGreeted, ttsSupported, currentLanguage, t, speak, isMuted]);

  // Re-greet when language changes - announces all options in new language
  useEffect(() => {
    if (hasGreeted && !isMuted) {
      shouldListenAfterSpeakRef.current = true;
      const greetingKey = getFullGreetingWithOptions(currentLanguage);
      const greeting = t(`app.${greetingKey}`);
      speak(greeting);
      setStatusText(t("app.chooseService"));
    }
  }, [currentLanguage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleServiceSelect = (serviceId: ServiceId) => {
    if (isSpeaking) {
      stopSpeaking();
    }
    if (isListening) {
      stopListening();
    }

    shouldListenAfterSpeakRef.current = false;
    const voicePrompt = t(`services.${serviceId}.voicePrompt`);
    if (!isMuted) {
      speak(voicePrompt);
    }

    onServiceSelect(serviceId);
  };

  // Handle mic button click - allows user to manually start listening
  const handleMicClick = () => {
    if (isMuted) return;
    
    if (isSpeaking) {
      stopSpeaking();
    }
    
    if (isListening) {
      stopListening();
    } else {
      shouldListenAfterSpeakRef.current = true;
      startListening();
    }
  };

  const handleMuteToggle = () => {
    if (!isMuted && isSpeaking) {
      stopSpeaking();
    }
    if (!isMuted && isListening) {
      stopListening();
    }
    setIsMuted(!isMuted);
  };

  const translations = {
    getName: (id: ServiceId) => t(`services.${id}.name`),
    getDescription: (id: ServiceId) => t(`services.${id}.description`),
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/20">
      <Header showMute isMuted={isMuted} onMuteToggle={handleMuteToggle} />

      <main className="flex-1 flex flex-col px-4 py-6 safe-area-bottom">
        <div className="max-w-lg mx-auto w-full flex flex-col items-center gap-6">
          {/* App Title */}
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-2">
              {t("app.name")}
            </h1>
            <p className="text-lg text-muted-foreground">{t("app.tagline")}</p>
          </div>

          {/* Status Text */}
          <div className="text-center min-h-[60px] flex items-center justify-center">
            <p
              className={cn(
                "text-lg sm:text-xl transition-all duration-300",
                isSpeaking && "text-green-600 font-medium",
                isListening && "text-primary font-medium",
              )}
            >
              {transcript || statusText || t("app.tapToSpeak")}
            </p>
          </div>

          {/* Voice Status Indicator - Clickable to restart listening */}
          <div className="py-4 flex flex-col items-center gap-3">
            <button
              onClick={handleMicClick}
              disabled={isMuted}
              aria-label={isListening ? t("app.tapToStop") : t("app.tapToSpeak")}
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer",
                "hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-primary/50",
                isListening && "bg-red-500 animate-pulse",
                isSpeaking && "bg-green-500",
                !isListening && !isSpeaking && "bg-primary/20 hover:bg-primary/30",
                isMuted && "opacity-50 cursor-not-allowed",
              )}
            >
              {isSpeaking ? (
                <Volume2 className="w-10 h-10 text-white animate-pulse" />
              ) : (
                <Mic
                  className={cn(
                    "w-10 h-10",
                    isListening ? "text-white" : "text-primary",
                  )}
                />
              )}
            </button>
            <span
              className={cn(
                "text-sm font-medium",
                isListening && "text-red-500",
                isSpeaking && "text-green-500",
              )}
            >
              {isListening
                ? t("app.listening")
                : isSpeaking
                  ? t("app.speaking")
                  : t("app.tapToSpeak")}
            </span>
          </div>

          {/* Voice Indicator */}
          <VoiceIndicator isActive={isListening || isSpeaking} />

          {/* Service Grid */}
          <div className="w-full">
            <p className="text-center text-lg text-muted-foreground mb-4">
              {t("app.chooseService")}
            </p>
            <ServiceGrid
              onServiceSelect={handleServiceSelect}
              translations={translations}
            />
          </div>

          {/* Voice Support Warning */}
          {(!sttSupported || !ttsSupported) && (
            <p className="text-center text-sm text-orange-600 mt-4">
              {t("voice.notSupported")}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
