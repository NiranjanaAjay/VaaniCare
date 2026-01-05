import React, { useEffect, useState, useRef } from "react";
import { Header } from "@/components/Header";
import { VoiceIndicator } from "@/components/VoiceButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useTranslation } from "@/contexts/TranslationContext";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import {
  Phone,
  Shield,
  Ambulance,
  Flame,
  Users,
  AlertTriangle,
  Mic,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EmergencyScreenProps {
  onBack: () => void;
}

type EmergencyService = "police" | "ambulance" | "fire" | "women";

interface EmergencyOption {
  id: EmergencyService;
  icon: React.ElementType;
  number: string;
  color: string;
  bgColor: string;
}

const emergencyOptions: EmergencyOption[] = [
  {
    id: "police",
    icon: Shield,
    number: "100",
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900",
  },
  {
    id: "ambulance",
    icon: Ambulance,
    number: "108",
    color: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-900",
  },
  {
    id: "fire",
    icon: Flame,
    number: "101",
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-900",
  },
  {
    id: "women",
    icon: Users,
    number: "181",
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900",
  },
];

export function EmergencyScreen({ onBack }: EmergencyScreenProps) {
  const { t, currentLanguage } = useTranslation();
  const [selectedService, setSelectedService] =
    useState<EmergencyOption | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [statusText, setStatusText] = useState("");
  const shouldListenAfterSpeakRef = useRef(true);

  const { isListening, startListening } = useVoiceRecognition({
    language: currentLanguage,
    onResult: handleVoiceResult,
    onStart: () => setStatusText(t("app.listening")),
    onError: () => {
      setTimeout(() => {
        if (shouldListenAfterSpeakRef.current) startListening();
      }, 1000);
    },
  });

  const { speak, isSpeaking } = useSpeechSynthesis({
    language: currentLanguage,
    rate: 0.9,
    onEnd: () => {
      if (shouldListenAfterSpeakRef.current) {
        setTimeout(() => startListening(), 300);
      }
    },
  });

  function handleVoiceResult(text: string, isFinal: boolean) {
    if (!isFinal) return;

    const normalized = text.toLowerCase();

    // Handle back
    if (
      normalized.includes("back") ||
      normalized.includes("cancel") ||
      normalized.includes("തിരികെ") ||
      normalized.includes("റദ്ദാക്കുക")
    ) {
      if (showConfirmDialog) {
        setShowConfirmDialog(false);
      } else {
        shouldListenAfterSpeakRef.current = false;
        onBack();
      }
      return;
    }

    // Handle yes/confirm in dialog
    if (
      showConfirmDialog &&
      (normalized.includes("yes") ||
        normalized.includes("call") ||
        normalized.includes("അതെ") ||
        normalized.includes("വിളിക്കുക"))
    ) {
      handleCall();
      return;
    }

    // Handle no in dialog
    if (
      showConfirmDialog &&
      (normalized.includes("no") || normalized.includes("ഇല്ല"))
    ) {
      setShowConfirmDialog(false);
      return;
    }

    // Detect emergency service
    for (const option of emergencyOptions) {
      const serviceName = t(`services.emergency.${option.id}`).toLowerCase();
      if (
        normalized.includes(serviceName) ||
        normalized.includes(option.id) ||
        normalized.includes(option.number)
      ) {
        handleServiceSelect(option);
        return;
      }
    }

    // Special keywords
    if (
      normalized.includes("help") ||
      normalized.includes("emergency") ||
      normalized.includes("സഹായം") ||
      normalized.includes("അടിയന്തരം")
    ) {
      speak(t("services.emergency.voicePrompt"));
      return;
    }

    setStatusText(t("voice.tryAgain"));
    speak(t("voice.tryAgain"));
  }

  // Handle mic button click
  const handleMicClick = () => {
    if (isSpeaking) return;
    
    if (!isListening) {
      shouldListenAfterSpeakRef.current = true;
      startListening();
    }
  };

  // Speak initial prompt with all options
  useEffect(() => {
    const timer = setTimeout(() => {
      // Build full options announcement
      const optionsList = emergencyOptions
        .map(opt => `${t(`services.emergency.${opt.id}`)}, ${opt.number}`)
        .join(". ");
      const fullPrompt = `${t("services.emergency.voicePrompt")} ${optionsList}`;
      speak(fullPrompt);
      setStatusText(t("services.emergency.voicePrompt"));
    }, 300);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleServiceSelect = (option: EmergencyOption) => {
    setSelectedService(option);
    const serviceName = t(`services.emergency.${option.id}`);
    const confirmText = `${t("emergency.confirmCall")} ${serviceName}?`;
    speak(confirmText);
    setStatusText(confirmText);
    setShowConfirmDialog(true);
  };

  const handleCall = () => {
    if (selectedService) {
      shouldListenAfterSpeakRef.current = false;
      const callingText = `${t("services.emergency.calling")} ${t(`services.emergency.${selectedService.id}`)}`;
      speak(callingText);
      setStatusText(callingText);
      setShowConfirmDialog(false);

      // Trigger phone call
      window.location.href = `tel:${selectedService.number}`;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-background dark:from-orange-950/20">
      <Header title={t("emergency.title")} showBack onBack={onBack} />

      <main className="flex-1 flex flex-col px-4 py-6">
        <div className="max-w-lg mx-auto w-full flex flex-col gap-6">
          {/* Warning Banner */}
          <Card className="bg-orange-100 dark:bg-orange-900/30 border-orange-300">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-orange-600 flex-shrink-0" />
              <p className="text-lg font-medium text-orange-800 dark:text-orange-200">
                {t("services.emergency.description")}
              </p>
            </CardContent>
          </Card>

          {/* Status and Mic Button */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleMicClick}
              aria-label={isListening ? t("app.tapToStop") : t("app.tapToSpeak")}
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer",
                "hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-primary/50",
                isListening && "bg-red-500 animate-pulse",
                isSpeaking && "bg-green-500",
                !isListening && !isSpeaking && "bg-primary/20 hover:bg-primary/30",
              )}
            >
              {isSpeaking ? (
                <Volume2 className="w-8 h-8 text-white animate-pulse" />
              ) : (
                <Mic
                  className={cn(
                    "w-8 h-8",
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
            <p
              className={cn(
                "text-lg sm:text-xl text-center",
                isSpeaking && "text-green-600 font-medium",
                isListening && "text-primary font-medium",
              )}
            >
              {statusText}
            </p>
          </div>

          {/* Emergency Options */}
          <div className="grid grid-cols-2 gap-4">
            {emergencyOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Card
                  key={option.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-xl active:scale-95",
                    selectedService?.id === option.id && "ring-4 ring-primary",
                  )}
                  onClick={() => handleServiceSelect(option)}
                >
                  <CardContent className="p-6 flex flex-col items-center gap-3">
                    <div
                      className={cn(
                        "w-20 h-20 rounded-full flex items-center justify-center",
                        option.bgColor,
                      )}
                    >
                      <Icon className={cn("w-10 h-10", option.color)} />
                    </div>
                    <p className="text-xl font-bold">
                      {t(`services.emergency.${option.id}`)}
                    </p>
                    <div className="flex items-center gap-2 text-2xl font-bold text-muted-foreground">
                      <Phone className="w-5 h-5" />
                      {option.number}
                    </div>
                    <Button
                      variant="emergency"
                      className="w-full mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleServiceSelect(option);
                      }}
                    >
                      {t("emergency.callNow")}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Voice Status Indicator */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            <div
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300",
                isListening && "bg-red-500 animate-pulse",
                isSpeaking && "bg-green-500",
                !isListening && !isSpeaking && "bg-primary/20",
              )}
            >
              {isSpeaking ? (
                <Volume2 className="w-8 h-8 text-white animate-pulse" />
              ) : (
                <Mic
                  className={cn(
                    "w-8 h-8",
                    isListening ? "text-white" : "text-primary",
                  )}
                />
              )}
            </div>
            <VoiceIndicator isActive={isListening || isSpeaking} />
          </div>
        </div>
      </main>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {t("emergency.confirmCall")}
            </DialogTitle>
            <DialogDescription className="text-lg">
              {selectedService && (
                <span className="flex items-center gap-2 justify-center text-xl font-bold mt-4">
                  <Phone className="w-6 h-6" />
                  {t(`services.emergency.${selectedService.id}`)} -{" "}
                  {selectedService.number}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1 h-14 text-lg"
              onClick={() => setShowConfirmDialog(false)}
            >
              {t("common.no")}
            </Button>
            <Button
              variant="emergency"
              className="flex-1 h-14 text-lg"
              onClick={handleCall}
            >
              <Phone className="w-5 h-5 mr-2" />
              {t("common.yes")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
