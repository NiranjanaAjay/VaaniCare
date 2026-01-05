import React, { useEffect, useState, useRef } from "react";
import { Header } from "@/components/Header";
import { VoiceIndicator } from "@/components/VoiceButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/contexts/TranslationContext";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import {
  Building2,
  Search,
  CheckCircle2,
  FileSearch,
  ChevronRight,
  IndianRupee,
  Users,
  Heart,
  GraduationCap,
  Home,
  Mic,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GovernmentScreenProps {
  onBack: () => void;
}

type GovOption = "schemes" | "eligibility" | "track";

interface Scheme {
  id: string;
  name: { en: string; ml: string };
  description: { en: string; ml: string };
  benefit: string;
  category: string;
  icon: React.ElementType;
}

const schemes: Scheme[] = [
  {
    id: "pmkisan",
    name: { en: "PM-KISAN", ml: "പിഎം-കിസാൻ" },
    description: {
      en: "Income support for farmers",
      ml: "കർഷകർക്ക് വരുമാന പിന്തുണ",
    },
    benefit: "₹6,000/year",
    category: "agriculture",
    icon: Users,
  },
  {
    id: "ayushman",
    name: { en: "Ayushman Bharat", ml: "ആയുഷ്മാൻ ഭാരത്" },
    description: {
      en: "Health insurance coverage",
      ml: "ആരോഗ്യ ഇൻഷുറൻസ് പരിരക്ഷ",
    },
    benefit: "₹5 Lakhs",
    category: "health",
    icon: Heart,
  },
  {
    id: "pmay",
    name: { en: "PM Awas Yojana", ml: "പിഎം ആവാസ് യോജന" },
    description: { en: "Housing for all scheme", ml: "എല്ലാവർക്കും വീട്" },
    benefit: "₹1.2-2.5 Lakhs",
    category: "housing",
    icon: Home,
  },
  {
    id: "scholarship",
    name: { en: "National Scholarship", ml: "ദേശീയ സ്കോളർഷിപ്പ്" },
    description: {
      en: "Education support for students",
      ml: "വിദ്യാർത്ഥികൾക്ക് വിദ്യാഭ്യാസ പിന്തുണ",
    },
    benefit: "Up to ₹50,000",
    category: "education",
    icon: GraduationCap,
  },
];

export function GovernmentScreen({ onBack }: GovernmentScreenProps) {
  const { t, currentLanguage } = useTranslation();
  const [selectedOption, setSelectedOption] = useState<GovOption | null>(null);
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [eligibilityChecked, setEligibilityChecked] = useState(false);
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
    if (normalized.includes("back") || normalized.includes("തിരികെ")) {
      if (selectedScheme) {
        setSelectedScheme(null);
      } else if (selectedOption) {
        setSelectedOption(null);
      } else {
        shouldListenAfterSpeakRef.current = false;
        onBack();
      }
      return;
    }

    // Detect option
    if (
      normalized.includes("scheme") ||
      normalized.includes("find") ||
      normalized.includes("പദ്ധതി") ||
      normalized.includes("കണ്ടെത്തുക")
    ) {
      handleOptionSelect("schemes");
      return;
    }

    if (
      normalized.includes("eligib") ||
      normalized.includes("check") ||
      normalized.includes("അർഹത") ||
      normalized.includes("പരിശോധിക്കുക")
    ) {
      handleOptionSelect("eligibility");
      return;
    }

    if (
      normalized.includes("track") ||
      normalized.includes("application") ||
      normalized.includes("ട്രാക്ക്") ||
      normalized.includes("അപേക്ഷ")
    ) {
      handleOptionSelect("track");
      return;
    }

    // Detect scheme names
    for (const scheme of schemes) {
      if (
        normalized.includes(scheme.name.en.toLowerCase()) ||
        normalized.includes(scheme.name.ml.toLowerCase()) ||
        normalized.includes(scheme.id)
      ) {
        handleSchemeSelect(scheme);
        return;
      }
    }

    // Number-based selection
    if (selectedOption === "schemes") {
      const numbers = [
        "one",
        "two",
        "three",
        "four",
        "ഒന്ന്",
        "രണ്ട്",
        "മൂന്ന്",
        "നാല്",
      ];
      for (let i = 0; i < schemes.length; i++) {
        if (
          normalized.includes(String(i + 1)) ||
          normalized.includes(numbers[i])
        ) {
          handleSchemeSelect(schemes[i]);
          return;
        }
      }
    }

    setStatusText(t("voice.tryAgain"));
    speak(t("voice.tryAgain"));
  }

  // Speak initial prompt
  useEffect(() => {
    const timer = setTimeout(() => {
      speak(t("services.government.voicePrompt"));
      setStatusText(t("services.government.voicePrompt"));
    }, 300);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOptionSelect = (option: GovOption) => {
    setSelectedOption(option);
    const optionName = t(`services.government.${option}`);
    speak(optionName);
    setStatusText(optionName);
  };

  const handleSchemeSelect = (scheme: Scheme) => {
    setSelectedScheme(scheme);
    const schemeName =
      scheme.name[currentLanguage as "en" | "ml"] || scheme.name.en;
    speak(schemeName);
    setStatusText(schemeName);
  };

  const handleCheckEligibility = () => {
    setEligibilityChecked(true);
    const msg = t("schemes.eligible");
    speak(msg);
    setStatusText(msg);
  };

  const options = [
    { id: "schemes" as GovOption, icon: Search },
    { id: "eligibility" as GovOption, icon: CheckCircle2 },
    { id: "track" as GovOption, icon: FileSearch },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-background dark:from-blue-950/20">
      <Header
        title={t("services.government.name")}
        showBack
        onBack={
          selectedScheme
            ? () => setSelectedScheme(null)
            : selectedOption
              ? () => setSelectedOption(null)
              : onBack
        }
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
              {options.map((option) => {
                const Icon = option.icon;
                return (
                  <Card
                    key={option.id}
                    className="cursor-pointer transition-all hover:shadow-lg active:scale-[0.98]"
                    onClick={() => handleOptionSelect(option.id)}
                  >
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <Icon className="w-8 h-8 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xl font-bold">
                          {t(`services.government.${option.id}`)}
                        </p>
                      </div>
                      <ChevronRight className="w-6 h-6 text-muted-foreground" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Schemes List */}
          {selectedOption === "schemes" && !selectedScheme && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">{t("schemes.title")}</h2>
              {schemes.map((scheme, index) => {
                const Icon = scheme.icon;
                return (
                  <Card
                    key={scheme.id}
                    className="cursor-pointer transition-all hover:shadow-lg"
                    onClick={() => handleSchemeSelect(scheme)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <Icon className="w-7 h-7 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-lg">
                          {index + 1}.{" "}
                          {scheme.name[currentLanguage as "en" | "ml"] ||
                            scheme.name.en}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {scheme.description[currentLanguage as "en" | "ml"] ||
                            scheme.description.en}
                        </p>
                        <p className="text-sm font-medium text-blue-600 flex items-center gap-1 mt-1">
                          <IndianRupee className="w-4 h-4" />
                          {scheme.benefit}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Scheme Details */}
          {selectedScheme && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-blue-600" />
                    {selectedScheme.name[currentLanguage as "en" | "ml"] ||
                      selectedScheme.name.en}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-lg">
                    {selectedScheme.description[
                      currentLanguage as "en" | "ml"
                    ] || selectedScheme.description.en}
                  </p>
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                    <p className="text-sm text-muted-foreground">
                      {t("schemes.benefits")}
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedScheme.benefit}
                    </p>
                  </div>

                  {!eligibilityChecked ? (
                    <Button
                      variant="government"
                      className="w-full h-14 text-lg"
                      onClick={handleCheckEligibility}
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      {t("schemes.checkEligibility")}
                    </Button>
                  ) : (
                    <div className="text-center py-4">
                      <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-3">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                      </div>
                      <p className="text-xl font-bold text-green-600">
                        {t("schemes.eligible")}
                      </p>
                      <Button
                        variant="government"
                        className="w-full h-14 text-lg mt-4"
                      >
                        {t("schemes.apply")}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Eligibility Check */}
          {selectedOption === "eligibility" && !selectedScheme && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t("schemes.checkEligibility")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg text-muted-foreground mb-4">
                    {currentLanguage === "ml"
                      ? "അർഹത പരിശോധിക്കാൻ ഒരു പദ്ധതി തിരഞ്ഞെടുക്കുക"
                      : "Select a scheme to check your eligibility"}
                  </p>
                  <Button
                    variant="government"
                    className="w-full"
                    onClick={() => setSelectedOption("schemes")}
                  >
                    {t("services.government.schemes")}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Track Application */}
          {selectedOption === "track" && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSearch className="w-6 h-6 text-blue-600" />
                    {t("services.government.track")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg text-muted-foreground">
                    {currentLanguage === "ml"
                      ? "അപേക്ഷ ട്രാക്കിംഗ് ഉടൻ വരുന്നു..."
                      : "Application tracking coming soon..."}
                  </p>
                </CardContent>
              </Card>
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
