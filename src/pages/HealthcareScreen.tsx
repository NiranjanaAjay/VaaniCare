import React, { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { VoiceIndicator } from "@/components/VoiceButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/contexts/TranslationContext";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import {
  User,
  Calendar,
  Clock,
  Star,
  IndianRupee,
  Stethoscope,
  Heart,
  Brain,
  Bone,
  Baby,
  Ear,
  CheckCircle2,
  Mic,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthcareScreenProps {
  onBack: () => void;
}

type Specialty =
  | "general"
  | "cardio"
  | "derma"
  | "ortho"
  | "pediatric"
  | "gynec"
  | "neuro"
  | "ent";

interface Doctor {
  id: string;
  name: string;
  specialty: Specialty;
  experience: number;
  rating: number;
  fee: number;
  available: string[];
}

const specialtyIcons: Record<Specialty, React.ElementType> = {
  general: Stethoscope,
  cardio: Heart,
  derma: User,
  ortho: Bone,
  pediatric: Baby,
  gynec: User,
  neuro: Brain,
  ent: Ear,
};

// Mock doctor data
const mockDoctors: Doctor[] = [
  {
    id: "1",
    name: "Dr. Priya Sharma",
    specialty: "general",
    experience: 15,
    rating: 4.8,
    fee: 300,
    available: ["10:00 AM", "11:00 AM", "2:00 PM"],
  },
  {
    id: "2",
    name: "Dr. Rajesh Kumar",
    specialty: "cardio",
    experience: 20,
    rating: 4.9,
    fee: 500,
    available: ["9:00 AM", "12:00 PM", "4:00 PM"],
  },
  {
    id: "3",
    name: "Dr. Anitha Menon",
    specialty: "pediatric",
    experience: 12,
    rating: 4.7,
    fee: 350,
    available: ["10:00 AM", "3:00 PM", "5:00 PM"],
  },
  {
    id: "4",
    name: "Dr. Suresh Nair",
    specialty: "ortho",
    experience: 18,
    rating: 4.6,
    fee: 450,
    available: ["11:00 AM", "2:00 PM"],
  },
  {
    id: "5",
    name: "Dr. Lakshmi Iyer",
    specialty: "derma",
    experience: 10,
    rating: 4.5,
    fee: 400,
    available: ["9:00 AM", "1:00 PM", "4:00 PM"],
  },
];

export function HealthcareScreen({ onBack }: HealthcareScreenProps) {
  const { t, currentLanguage } = useTranslation();
  const [step, setStep] = useState<
    "specialty" | "doctors" | "time" | "confirm" | "success"
  >("specialty");
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(
    null,
  );
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
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

  // Comprehensive number word mappings for English and Malayalam
  const numberWords: Record<string, number> = {
    // English number words
    'one': 1, 'first': 1, '1': 1, 'won': 1,
    'two': 2, 'second': 2, '2': 2, 'to': 2, 'too': 2,
    'three': 3, 'third': 3, '3': 3, 'tree': 3,
    'four': 4, 'fourth': 4, '4': 4, 'for': 4, 'fore': 4,
    'five': 5, 'fifth': 5, '5': 5,
    'six': 6, 'sixth': 6, '6': 6,
    'seven': 7, 'seventh': 7, '7': 7,
    'eight': 8, 'eighth': 8, '8': 8, 'ate': 8,
    'nine': 9, 'ninth': 9, '9': 9,
    'ten': 10, 'tenth': 10, '10': 10,
    // Malayalam number words (transliterated)
    'onnu': 1, 'onne': 1, 'oru': 1, 'onnaam': 1,
    'randu': 2, 'rand': 2, 'randaam': 2,
    'moonnu': 3, 'moonu': 3, 'munnaam': 3,
    'naalu': 4, 'naal': 4, 'nalaam': 4,
    'anchu': 5, 'anju': 5, 'anchaam': 5,
    'aaru': 6, 'aar': 6,
    'ezhu': 7, 'elu': 7,
    'ettu': 8, 'ett': 8,
    'onpathu': 9, 'onpatu': 9,
    'pathu': 10, 'patu': 10,
    // Malayalam script
    'ഒന്ന്': 1, 'ഒന്നാമത്തെ': 1, 'ഒരു': 1,
    'രണ്ട്': 2, 'രണ്ടാമത്തെ': 2,
    'മൂന്ന്': 3, 'മൂന്നാമത്തെ': 3,
    'നാല്': 4, 'നാലാമത്തെ': 4,
    'അഞ്ച്': 5, 'അഞ്ചാമത്തെ': 5,
    'ആറ്': 6, 'ആറാമത്തെ': 6,
    'ഏഴ്': 7, 'ഏഴാമത്തെ': 7,
    'എട്ട്': 8, 'എട്ടാമത്തെ': 8,
    'ഒൻപത്': 9, 'ഒൻപതാമത്തെ': 9,
    'പത്ത്': 10, 'പത്താമത്തെ': 10,
  };

  // Extract number from speech
  const extractNumberFromSpeech = (text: string): number | null => {
    const normalized = text.toLowerCase().trim();
    
    // Check direct number words
    for (const [word, num] of Object.entries(numberWords)) {
      if (normalized.includes(word)) {
        return num;
      }
    }
    
    // Check for digit patterns
    const digitMatch = normalized.match(/\d+/);
    if (digitMatch) {
      return parseInt(digitMatch[0], 10);
    }
    
    return null;
  };

  // Extract time from speech
  const extractTimeFromSpeech = (text: string, availableTimes: string[]): string | null => {
    const normalized = text.toLowerCase().replace(/\s+/g, '');
    
    for (const time of availableTimes) {
      const normalizedTime = time.toLowerCase().replace(/\s+/g, '');
      
      // Direct match
      if (normalized.includes(normalizedTime)) {
        return time;
      }
      
      // Extract hour from time (e.g., "9:00 AM" -> "9")
      const hourMatch = time.match(/(\d+)/);
      if (hourMatch) {
        const hour = hourMatch[1];
        // Check if user said just the hour
        if (normalized.includes(hour) || normalized.includes(`${hour}am`) || normalized.includes(`${hour}pm`)) {
          // Verify it's the right time (morning vs afternoon)
          const isPM = time.toLowerCase().includes('pm');
          const isAM = time.toLowerCase().includes('am');
          const userSaidMorning = normalized.includes('morning') || normalized.includes('am') || normalized.includes('രാവിലെ');
          const userSaidAfternoon = normalized.includes('afternoon') || normalized.includes('pm') || normalized.includes('വൈകുന്നേരം') || normalized.includes('ഉച്ച');
          
          if ((isAM && !userSaidAfternoon) || (isPM && !userSaidMorning) || (!userSaidMorning && !userSaidAfternoon)) {
            if (normalized.includes(hour)) {
              return time;
            }
          }
        }
      }
    }
    
    // Check for time by position number
    const posNum = extractNumberFromSpeech(text);
    if (posNum && posNum >= 1 && posNum <= availableTimes.length) {
      return availableTimes[posNum - 1];
    }
    
    return null;
  };

  // Find doctor by name or number
  const findDoctorFromSpeech = (text: string, doctors: Doctor[]): Doctor | null => {
    const normalized = text.toLowerCase();
    
    // First try to match by number
    const num = extractNumberFromSpeech(text);
    if (num && num >= 1 && num <= doctors.length) {
      return doctors[num - 1];
    }
    
    // Try to match doctor by name
    for (const doctor of doctors) {
      const nameParts = doctor.name.toLowerCase().split(/[\s.]+/).filter(p => p.length > 2);
      
      // Check if any significant part of the doctor's name is in the speech
      for (const part of nameParts) {
        if (part !== 'dr' && normalized.includes(part)) {
          return doctor;
        }
      }
      
      // Also check full name match
      if (normalized.includes(doctor.name.toLowerCase().replace('dr. ', ''))) {
        return doctor;
      }
    }
    
    return null;
  };

  function handleVoiceResult(text: string, isFinal: boolean) {
    if (!isFinal) return;

    const normalized = text.toLowerCase();

    // Handle home navigation (especially after success)
    if (
      normalized.includes("home") ||
      normalized.includes("main") ||
      normalized.includes("ഹോം") ||
      normalized.includes("മെയിൻ") ||
      normalized.includes("പ്രധാന")
    ) {
      shouldListenAfterSpeakRef.current = false;
      onBack();
      return;
    }

    // Handle back/cancel
    if (
      normalized.includes("back") ||
      normalized.includes("cancel") ||
      normalized.includes("go back") ||
      normalized.includes("return") ||
      normalized.includes("തിരികെ") ||
      normalized.includes("റദ്ദാക്കുക") ||
      normalized.includes("പിന്നിലേക്ക്")
    ) {
      if (step === "specialty" || step === "success") {
        shouldListenAfterSpeakRef.current = false;
        onBack();
      } else if (step === "doctors") {
        setStep("specialty");
      } else if (step === "time") {
        setStep("doctors");
      } else if (step === "confirm") {
        setStep("time");
      }
      return;
    }

    // Handle yes/confirm
    if (
      step === "confirm" &&
      (normalized.includes("yes") ||
        normalized.includes("confirm") ||
        normalized.includes("book") ||
        normalized.includes("okay") ||
        normalized.includes("ok") ||
        normalized.includes("അതെ") ||
        normalized.includes("ശരി") ||
        normalized.includes("ബുക്ക്"))
    ) {
      handleBooking();
      return;
    }

    // Handle specialty selection
    if (step === "specialty") {
      const specialties: Specialty[] = [
        "general",
        "cardio",
        "derma",
        "ortho",
        "pediatric",
        "gynec",
        "neuro",
        "ent",
      ];
      
      // Check by number first
      const num = extractNumberFromSpeech(text);
      if (num && num >= 1 && num <= specialties.length) {
        handleSpecialtySelect(specialties[num - 1]);
        return;
      }
      
      // Then check by name
      for (const spec of specialties) {
        const specName = t(`doctor.specialties.${spec}`).toLowerCase();
        if (normalized.includes(specName) || normalized.includes(spec)) {
          handleSpecialtySelect(spec);
          return;
        }
      }
      
      // Additional keyword matching
      const specialtyKeywords: Record<string, Specialty> = {
        'general': 'general', 'gp': 'general', 'family': 'general', 'ജനറൽ': 'general',
        'cardio': 'cardio', 'heart': 'cardio', 'cardiac': 'cardio', 'ഹൃദയം': 'cardio',
        'derma': 'derma', 'skin': 'derma', 'ത്വക്ക്': 'derma',
        'ortho': 'ortho', 'bone': 'ortho', 'joint': 'ortho', 'എല്ല്': 'ortho',
        'pediatric': 'pediatric', 'child': 'pediatric', 'kids': 'pediatric', 'കുട്ടികൾ': 'pediatric',
        'gynec': 'gynec', 'women': 'gynec', 'lady': 'gynec', 'സ്ത്രീ': 'gynec',
        'neuro': 'neuro', 'brain': 'neuro', 'nerve': 'neuro', 'തലച്ചോറ്': 'neuro',
        'ent': 'ent', 'ear': 'ent', 'nose': 'ent', 'throat': 'ent', 'ചെവി': 'ent', 'മൂക്ക്': 'ent',
      };
      
      for (const [keyword, spec] of Object.entries(specialtyKeywords)) {
        if (normalized.includes(keyword)) {
          handleSpecialtySelect(spec);
          return;
        }
      }
    }

    // Handle doctor selection - IMPROVED
    if (step === "doctors") {
      const filtered = mockDoctors.filter(
        (d) => d.specialty === selectedSpecialty,
      );
      
      const doctor = findDoctorFromSpeech(text, filtered);
      if (doctor) {
        handleDoctorSelect(doctor);
        return;
      }
    }

    // Handle time selection - IMPROVED
    if (step === "time" && selectedDoctor) {
      const time = extractTimeFromSpeech(text, selectedDoctor.available);
      if (time) {
        handleTimeSelect(time);
        return;
      }
    }

    setStatusText(t("voice.tryAgain"));
    speak(t("voice.tryAgain"));
  }

  // Handle mic button click - allows user to manually start listening
  const handleMicClick = () => {
    if (isSpeaking) {
      return; // Don't interrupt speaking
    }
    
    if (isListening) {
      // Already listening, do nothing
      return;
    } else {
      shouldListenAfterSpeakRef.current = true;
      startListening();
    }
  };

  // Speak instructions when step changes - with full option lists
  useEffect(() => {
    let instruction = "";
    
    if (step === "specialty") {
      instruction = t("doctor.selectSpecialty");
    } else if (step === "doctors") {
      // Build doctor list announcement
      const filtered = mockDoctors.filter(d => d.specialty === selectedSpecialty);
      const doctorNames = filtered.map((d, i) => `${i + 1}. ${d.name}`).join(". ");
      instruction = `${t("doctor.availableDoctors")} ${doctorNames}`;
    } else if (step === "time" && selectedDoctor) {
      // Announce available times
      const times = selectedDoctor.available.join(", ");
      instruction = `${t("doctor.selectTime")} ${times}`;
    } else if (step === "confirm") {
      instruction = t("doctor.confirmBooking");
    } else if (step === "success") {
      instruction = `${t("doctor.bookingConfirmed")}. ${t("doctor.sayHomeToReturn")}`;
    }

    if (instruction) {
      // Ensure auto-listen is enabled for all steps
      shouldListenAfterSpeakRef.current = true;
      setTimeout(() => {
        speak(instruction);
        setStatusText(instruction);
      }, 300);
    }
  }, [step, selectedSpecialty, selectedDoctor]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSpecialtySelect = (specialty: Specialty) => {
    shouldListenAfterSpeakRef.current = true; // Ensure auto-listen stays on
    setSelectedSpecialty(specialty);
    setStep("doctors");
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    shouldListenAfterSpeakRef.current = true; // Ensure auto-listen stays on
    setSelectedDoctor(doctor);
    setStep("time");
  };

  const handleTimeSelect = (time: string) => {
    shouldListenAfterSpeakRef.current = true; // Ensure auto-listen stays on
    setSelectedTime(time);
    setStep("confirm");
  };

  const handleBooking = () => {
    shouldListenAfterSpeakRef.current = true; // Keep listening for "home" command
    setStep("success");
  };

  const filteredDoctors = mockDoctors.filter(
    (d) => d.specialty === selectedSpecialty,
  );

  const specialties: Specialty[] = [
    "general",
    "cardio",
    "derma",
    "ortho",
    "pediatric",
    "gynec",
    "neuro",
    "ent",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-red-50 to-background dark:from-red-950/20">
      <Header title={t("doctor.title")} showBack onBack={onBack} />

      <main className="flex-1 flex flex-col px-4 py-6">
        <div className="max-w-lg mx-auto w-full flex flex-col gap-6">
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

          {/* Step: Select Specialty */}
          {step === "specialty" && (
            <div className="grid grid-cols-2 gap-3">
              {specialties.map((spec) => {
                const Icon = specialtyIcons[spec];
                return (
                  <Button
                    key={spec}
                    variant="outline"
                    className="h-24 flex-col gap-2 text-base"
                    onClick={() => handleSpecialtySelect(spec)}
                  >
                    <Icon className="w-8 h-8 text-red-500" />
                    <span>{t(`doctor.specialties.${spec}`)}</span>
                  </Button>
                );
              })}
            </div>
          )}

          {/* Step: Select Doctor */}
          {step === "doctors" && (
            <div className="space-y-3">
              {filteredDoctors.map((doctor, index) => (
                <Card
                  key={doctor.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lg",
                    selectedDoctor?.id === doctor.id && "ring-2 ring-primary",
                  )}
                  onClick={() => handleDoctorSelect(doctor)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                        <User className="w-8 h-8 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-lg">
                          {index + 1}. {doctor.name}
                        </p>
                        <p className="text-muted-foreground">
                          {t(`doctor.specialties.${doctor.specialty}`)}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-sm">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {doctor.experience} {t("doctor.experience")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            {doctor.rating}
                          </span>
                          <span className="flex items-center gap-1">
                            <IndianRupee className="w-4 h-4" />
                            {doctor.fee}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Step: Select Time */}
          {step === "time" && selectedDoctor && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <User className="w-10 h-10 text-red-600" />
                    <div>
                      <p className="font-semibold">{selectedDoctor.name}</p>
                      <p className="text-muted-foreground">
                        {t(`doctor.specialties.${selectedDoctor.specialty}`)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                {selectedDoctor.available.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    className="h-16 text-lg"
                    onClick={() => handleTimeSelect(time)}
                  >
                    <Clock className="w-5 h-5 mr-2" />
                    {time}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Step: Confirm */}
          {step === "confirm" && selectedDoctor && selectedTime && (
            <div className="space-y-4">
              <Card className="bg-red-50 dark:bg-red-950/30">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-xl font-bold text-center">
                    {t("doctor.confirmBooking")}
                  </h3>
                  <div className="space-y-2 text-lg">
                    <p>
                      <strong>Doctor:</strong> {selectedDoctor.name}
                    </p>
                    <p>
                      <strong>Specialty:</strong>{" "}
                      {t(`doctor.specialties.${selectedDoctor.specialty}`)}
                    </p>
                    <p>
                      <strong>Time:</strong> {selectedTime}
                    </p>
                    <p>
                      <strong>Fee:</strong> ₹{selectedDoctor.fee}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-14 text-lg"
                  onClick={() => setStep("time")}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  variant="healthcare"
                  className="flex-1 h-14 text-lg"
                  onClick={handleBooking}
                >
                  {t("common.confirm")}
                </Button>
              </div>
            </div>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <div className="text-center space-y-6 py-8">
              <div className="w-24 h-24 mx-auto rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <CheckCircle2 className="w-16 h-16 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-600">
                {t("doctor.bookingConfirmed")}
              </h2>
              <p className="text-lg text-muted-foreground">
                {t("doctor.appointmentDetails")}
              </p>
              <Card>
                <CardContent className="p-4 text-left">
                  <p>
                    <strong>Doctor:</strong> {selectedDoctor?.name}
                  </p>
                  <p>
                    <strong>Time:</strong> {selectedTime}
                  </p>
                </CardContent>
              </Card>
              <Button
                variant="healthcare"
                className="w-full h-14 text-lg"
                onClick={onBack}
              >
                {t("common.home")}
              </Button>
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
