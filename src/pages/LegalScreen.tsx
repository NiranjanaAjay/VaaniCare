import React, { useEffect, useState, useRef } from "react";
import { Header } from "@/components/Header";
import { VoiceIndicator } from "@/components/VoiceButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/contexts/TranslationContext";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import {
  Scale,
  MessageSquare,
  FileText,
  BookOpen,
  Phone,
  ChevronRight,
  CheckCircle2,
  Mic,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LegalScreenProps {
  onBack: () => void;
}

type LegalOption = "consultation" | "rights" | "complaint";

interface LegalService {
  id: LegalOption;
  icon: React.ElementType;
}

const legalServices: LegalService[] = [
  { id: "consultation", icon: MessageSquare },
  { id: "rights", icon: BookOpen },
  { id: "complaint", icon: FileText },
];

// Mock rights data
const rightsData = {
  en: [
    {
      title: "Right to Legal Aid",
      description: "Free legal services for those who cannot afford",
    },
    {
      title: "Right to Fair Trial",
      description: "Every person has right to fair hearing",
    },
    {
      title: "Right Against Exploitation",
      description: "Protection from forced labor and trafficking",
    },
    {
      title: "Right to Property",
      description: "Right to acquire, hold and dispose of property",
    },
  ],
  ml: [
    {
      title: "നിയമ സഹായത്തിനുള്ള അവകാശം",
      description: "കഴിയാത്തവർക്ക് സൗജന്യ നിയമ സേവനങ്ങൾ",
    },
    {
      title: "നീതിയുക്തമായ വിചാരണയ്ക്കുള്ള അവകാശം",
      description: "എല്ലാവർക്കും നീതിയുക്തമായ വിചാരണ",
    },
    {
      title: "ചൂഷണത്തിനെതിരെയുള്ള അവകാശം",
      description: "നിർബന്ധിത തൊഴിലിൽ നിന്ന് സംരക്ഷണം",
    },
    {
      title: "സ്വത്ത് അവകാശം",
      description: "സ്വത്ത് സ്വന്തമാക്കാനുള്ള അവകാശം",
    },
  ],
};

export function LegalScreen({ onBack }: LegalScreenProps) {
  const { t, currentLanguage } = useTranslation();
  const [selectedOption, setSelectedOption] = useState<LegalOption | null>(
    null,
  );
  const [statusText, setStatusText] = useState("");
  const [complaintSubmitted, setComplaintSubmitted] = useState(false);
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
      if (!shouldListenAfterSpeakRef.current) return;

      let shouldListen = false;
      if (mode === 'select') {
        shouldListen = true;
      } else if (mode === 'lawyer' || mode === 'ai') {
        if (currentQuestionIndex < QUESTIONS[mode].length) {
          shouldListen = true;
        }
      }

      if (shouldListen) {
        setTimeout(() => startListening(), 500);
      }
    },
  });

  function handleVoiceResult(text: string, isFinal: boolean) {
    if (!isFinal) return;

    const normalized = text.toLowerCase();

    // Handle back
    if (normalized.includes("back") || normalized.includes("തിരികെ")) {
      if (selectedOption) {
        setSelectedOption(null);
      } else {
        if (currentMode === 'lawyer') {
          performFindLawyers(currentData || queryData);
        } else {
          performGetAIAdvice(currentData || queryData);
        }
      }
      return;
    }
  }

  const handleMessageSubmit = async (text: string) => {
    if (!text.trim() || isProcessing) return;

    if (mode === 'select') {
      const normalized = text.toLowerCase().trim();

      // Ignore very short transcriptions (noise/filler) to prevent jumping or retries
      if (normalized.length < 3) return;

      const capturesLawyer = normalized.includes('lawyer') || normalized.includes('vakkil') || normalized.includes('വക്കീൽ') ||
        normalized.includes('find') || normalized.includes('കാണണം');
      const capturesAI = normalized.includes('ai') || normalized.includes('advice') || normalized.includes('ഉപദേശം') ||
        normalized.includes('ask') || normalized.includes('ചോദിക്കണം');

      if (capturesLawyer && !capturesAI) {
        handleSelection('lawyer');
        return;
      } else if (capturesAI && !capturesLawyer) {
        handleSelection('ai');
        return;
      }
    }

    // Additional keywords
    if (
      normalized.includes("lawyer") ||
      normalized.includes("advocate") ||
      normalized.includes("വക്കീൽ") ||
      normalized.includes("അഭിഭാഷകൻ")
    ) {
      handleOptionSelect("consultation");
      return;
    }

    if (normalized.includes("rights") || normalized.includes("അവകാശം")) {
      handleOptionSelect("rights");
      return;
    }

    if (normalized.includes("complaint") || normalized.includes("പരാതി")) {
      handleOptionSelect("complaint");
      return;
    }

    setStatusText(t("voice.tryAgain"));
    speak(t("voice.tryAgain"));
  }

  // Speak initial prompt
  useEffect(() => {
    setMessages([]);
    setQueryData({});
    setMode('select');
    setCurrentQuestionIndex(-1);

    const timer = setTimeout(() => {
      speak(t("services.legal.voicePrompt"));
      setStatusText(t("services.legal.voicePrompt"));
    }, 300);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOptionSelect = (option: LegalOption) => {
    setSelectedOption(option);
    const serviceName = t(`services.legal.${option}`);
    speak(serviceName);
    setStatusText(serviceName);
  };

  const handleSubmitComplaint = () => {
    setComplaintSubmitted(true);
    speak(
      currentLanguage === "ml"
        ? "പരാതി രജിസ്റ്റർ ചെയ്തു"
        : "Complaint registered successfully",
    );
  };

  const rights = rightsData[currentLanguage as "en" | "ml"] || rightsData.en;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-violet-50 to-background dark:from-violet-950/20">
      <Header
        title={t("services.legal.name")}
        showBack
        onBack={selectedOption ? () => setSelectedOption(null) : onBack}
      />

      <main className="flex-1 flex flex-col px-4 py-6 pb-32">
        <div className="max-w-lg mx-auto w-full flex flex-col gap-6">
          {/* Status */}
          <div className="text-center">
            <p
              className={cn(
                "text-lg sm:text-xl",
                isSpeaking && "text-green-600 font-medium",
                isListening && "text-primary font-medium",
              )}
            >
              {statusText}
            </p>
          </div>

          {/* Main Menu */}
          {!selectedOption && (
            <div className="space-y-4">
              {legalServices.map((service) => {
                const Icon = service.icon;
                return (
                  <Card
                    key={service.id}
                    className="cursor-pointer transition-all hover:shadow-lg active:scale-[0.98]"
                    onClick={() => handleOptionSelect(service.id)}
                  >
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
                        <Icon className="w-8 h-8 text-violet-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xl font-bold">
                          {t(`services.legal.${service.id}`)}
                        </p>
                      </div>
                      <ChevronRight className="w-6 h-6 text-muted-foreground" />
                    </CardContent>
                  </Card>
                );
              })}

              {/* Legal Helpline */}
              <Card className="bg-violet-100 dark:bg-violet-900/30">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-medium">Legal Helpline</p>
                    <p className="text-2xl font-bold text-violet-600">15100</p>
                  </div>
                  <Button
                    variant="legal"
                    onClick={() => (window.location.href = "tel:15100")}
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    {t("common.call")}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Consultation View */}
          {selectedOption === "consultation" && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-violet-600" />
                    {t("services.legal.consultation")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-lg text-muted-foreground">
                    {currentLanguage === "ml"
                      ? "സൗജന്യ നിയമ ഉപദേശത്തിന് ലീഗൽ എയ്ഡ് സെന്ററുമായി ബന്ധപ്പെടുക"
                      : "Contact Legal Aid Center for free legal consultation"}
                  </p>
                  <Button
                    variant="legal"
                    className="w-full h-14 text-lg"
                    onClick={() => (window.location.href = "tel:15100")}
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    {currentLanguage === "ml" ? "ഇപ്പോൾ വിളിക്കുക" : "Call Now"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Rights View */}
          {selectedOption === "rights" && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-violet-600" />
                    {t("services.legal.rights")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {rights.map((right, index) => (
                    <div key={index} className="p-4 bg-secondary rounded-xl">
                      <p className="font-semibold text-lg">{right.title}</p>
                      <p className="text-muted-foreground">
                        {right.description}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Complaint View */}
          {selectedOption === "complaint" && (
            <div className="space-y-4">
              {!complaintSubmitted ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-6 h-6 text-violet-600" />
                      {t("services.legal.complaint")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-lg text-muted-foreground">
                      {currentLanguage === "ml"
                        ? "പരാതി രജിസ്റ്റർ ചെയ്യാൻ ചുവടെയുള്ള ബട്ടൺ അമർത്തുക"
                        : "Press the button below to register your complaint"}
                    </p>
                    <Button
                      variant="legal"
                      className="w-full h-14 text-lg"
                      onClick={handleSubmitComplaint}
                    >
                      <Scale className="w-5 h-5 mr-2" />
                      {currentLanguage === "ml"
                        ? "പരാതി രജിസ്റ്റർ ചെയ്യുക"
                        : "Register Complaint"}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-green-600">
                    {currentLanguage === "ml"
                      ? "പരാതി രജിസ്റ്റർ ചെയ്തു!"
                      : "Complaint Registered!"}
                  </h3>
                  <p className="text-muted-foreground">
                    {currentLanguage === "ml"
                      ? "ഞങ്ങൾ ഉടൻ ബന്ധപ്പെടും"
                      : "We will contact you soon"}
                  </p>
                </div>
              )}
            </div>
          )}

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
    </div>
  );
}
