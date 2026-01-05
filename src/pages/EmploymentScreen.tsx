import { useEffect, useState, useRef } from "react";
import { Header } from "@/components/Header";
import { VoiceIndicator } from "@/components/VoiceButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/contexts/TranslationContext";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import {
  Briefcase,
  Search,
  FileText,
  GraduationCap,
  ChevronRight,
  MapPin,
  IndianRupee,
  Clock,
  Building,
  CheckCircle2,
  Mic,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EmploymentScreenProps {
  onBack: () => void;
}

type EmpOption = "findJobs" | "createResume" | "learnSkills";

interface Job {
  id: string;
  title: { en: string; ml: string };
  company: string;
  location: { en: string; ml: string };
  salary: string;
  type: "fullTime" | "partTime" | "contract";
}

const jobs: Job[] = [
  {
    id: "1",
    title: { en: "Security Guard", ml: "സെക്യൂരിറ്റി ഗാർഡ്" },
    company: "SafeSecure Services",
    location: { en: "Kochi", ml: "കൊച്ചി" },
    salary: "₹15,000-18,000",
    type: "fullTime",
  },
  {
    id: "2",
    title: { en: "Delivery Person", ml: "ഡെലിവറി പാർട്ട്ണർ" },
    company: "QuickDeliver",
    location: { en: "Trivandrum", ml: "തിരുവനന്തപുരം" },
    salary: "₹12,000-20,000",
    type: "fullTime",
  },
  {
    id: "3",
    title: { en: "Helper/Assistant", ml: "ഹെൽപ്പർ/അസിസ്റ്റന്റ്" },
    company: "Local Stores",
    location: { en: "Multiple Locations", ml: "പല സ്ഥലങ്ങൾ" },
    salary: "₹10,000-15,000",
    type: "fullTime",
  },
  {
    id: "4",
    title: { en: "Cleaning Staff", ml: "ക്ലീനിംഗ് സ്റ്റാഫ്" },
    company: "CleanPro Services",
    location: { en: "Calicut", ml: "കോഴിക്കോട്" },
    salary: "₹12,000-15,000",
    type: "fullTime",
  },
  {
    id: "5",
    title: { en: "Driver", ml: "ഡ്രൈവർ" },
    company: "Transport Co.",
    location: { en: "Thrissur", ml: "തൃശൂർ" },
    salary: "₹18,000-25,000",
    type: "fullTime",
  },
];

const skills = [
  {
    id: "computer",
    name: { en: "Basic Computer", ml: "അടിസ്ഥാന കമ്പ്യൂട്ടർ" },
  },
  { id: "english", name: { en: "English Speaking", ml: "ഇംഗ്ലീഷ് സംസാരം" } },
  { id: "mobile", name: { en: "Mobile Usage", ml: "മൊബൈൽ ഉപയോഗം" } },
  { id: "driving", name: { en: "Driving", ml: "ഡ്രൈവിംഗ്" } },
];

export function EmploymentScreen({ onBack }: EmploymentScreenProps) {
  const { t, currentLanguage } = useTranslation();
  const [selectedOption, setSelectedOption] = useState<EmpOption | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applied, setApplied] = useState(false);
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
      if (selectedJob) {
        setSelectedJob(null);
        setApplied(false);
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
      normalized.includes("find") ||
      normalized.includes("job") ||
      normalized.includes("search") ||
      normalized.includes("ജോലി") ||
      normalized.includes("കണ്ടെത്തുക")
    ) {
      handleOptionSelect("findJobs");
      return;
    }

    if (
      normalized.includes("resume") ||
      normalized.includes("cv") ||
      normalized.includes("റെസ്യൂം")
    ) {
      handleOptionSelect("createResume");
      return;
    }

    if (
      normalized.includes("skill") ||
      normalized.includes("learn") ||
      normalized.includes("training") ||
      normalized.includes("കഴിവ്") ||
      normalized.includes("പഠിക്കുക")
    ) {
      handleOptionSelect("learnSkills");
      return;
    }

    // Number-based selection for jobs
    if (selectedOption === "findJobs" && !selectedJob) {
      for (let i = 0; i < jobs.length; i++) {
        if (normalized.includes(String(i + 1))) {
          handleJobSelect(jobs[i]);
          return;
        }
      }
    }

    // Apply command
    if (
      selectedJob &&
      (normalized.includes("apply") ||
        normalized.includes("yes") ||
        normalized.includes("അപേക്ഷിക്കുക") ||
        normalized.includes("അതെ"))
    ) {
      handleApply();
      return;
    }

    setStatusText(t("voice.tryAgain"));
    speak(t("voice.tryAgain"));
  }

  // Speak initial prompt
  useEffect(() => {
    const timer = setTimeout(() => {
      speak(t("services.employment.voicePrompt"));
      setStatusText(t("services.employment.voicePrompt"));
    }, 300);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOptionSelect = (option: EmpOption) => {
    setSelectedOption(option);
    const optionName = t(`services.employment.${option}`);
    speak(optionName);
    setStatusText(optionName);
  };

  const handleJobSelect = (job: Job) => {
    setSelectedJob(job);
    const jobTitle = job.title[currentLanguage as "en" | "ml"] || job.title.en;
    speak(jobTitle);
    setStatusText(jobTitle);
  };

  const handleApply = () => {
    setApplied(true);
    const msg =
      currentLanguage === "ml"
        ? "അപേക്ഷ സമർപ്പിച്ചു!"
        : "Application submitted!";
    speak(msg);
    setStatusText(msg);
  };

  const options = [
    { id: "findJobs" as EmpOption, icon: Search },
    { id: "createResume" as EmpOption, icon: FileText },
    { id: "learnSkills" as EmpOption, icon: GraduationCap },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-background dark:from-green-950/20">
      <Header
        title={t("services.employment.name")}
        showBack
        onBack={
          selectedJob
            ? () => {
                setSelectedJob(null);
                setApplied(false);
              }
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
                      <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <Icon className="w-8 h-8 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xl font-bold">
                          {t(`services.employment.${option.id}`)}
                        </p>
                      </div>
                      <ChevronRight className="w-6 h-6 text-muted-foreground" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Jobs List */}
          {selectedOption === "findJobs" && !selectedJob && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">{t("jobs.title")}</h2>
              {jobs.map((job, index) => (
                <Card
                  key={job.id}
                  className="cursor-pointer transition-all hover:shadow-lg"
                  onClick={() => handleJobSelect(job)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-lg">
                          {index + 1}.{" "}
                          {job.title[currentLanguage as "en" | "ml"] ||
                            job.title.en}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          {job.company}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.location[currentLanguage as "en" | "ml"] ||
                              job.location.en}
                          </span>
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            <IndianRupee className="w-4 h-4" />
                            {job.salary}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Job Details */}
          {selectedJob && (
            <div className="space-y-4">
              {!applied ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="w-6 h-6 text-green-600" />
                      {selectedJob.title[currentLanguage as "en" | "ml"] ||
                        selectedJob.title.en}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="flex items-center gap-2">
                        <Building className="w-5 h-5 text-muted-foreground" />
                        {selectedJob.company}
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-muted-foreground" />
                        {selectedJob.location[currentLanguage as "en" | "ml"] ||
                          selectedJob.location.en}
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                        {t(`jobs.${selectedJob.type}`)}
                      </p>
                    </div>

                    <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-xl">
                      <p className="text-sm text-muted-foreground">
                        {t("jobs.salary")}
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {selectedJob.salary}/month
                      </p>
                    </div>

                    <Button
                      variant="employment"
                      className="w-full h-14 text-lg"
                      onClick={handleApply}
                    >
                      {t("jobs.apply")}
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
                      ? "അപേക്ഷ സമർപ്പിച്ചു!"
                      : "Application Submitted!"}
                  </h3>
                  <p className="text-muted-foreground">
                    {currentLanguage === "ml"
                      ? "ഞങ്ങൾ ഉടൻ ബന്ധപ്പെടും"
                      : "We will contact you soon"}
                  </p>
                  <Button
                    variant="employment"
                    className="w-full"
                    onClick={() => {
                      setSelectedJob(null);
                      setApplied(false);
                    }}
                  >
                    {currentLanguage === "ml"
                      ? "കൂടുതൽ ജോലികൾ കാണുക"
                      : "View More Jobs"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Resume Builder */}
          {selectedOption === "createResume" && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-6 h-6 text-green-600" />
                    {t("services.employment.createResume")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg text-muted-foreground">
                    {currentLanguage === "ml"
                      ? "റെസ്യൂം ബിൽഡർ ഉടൻ വരുന്നു..."
                      : "Resume builder coming soon..."}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Skills Training */}
          {selectedOption === "learnSkills" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">
                {t("services.employment.learnSkills")}
              </h2>
              {skills.map((skill) => (
                <Card key={skill.id} className="cursor-pointer hover:shadow-lg">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-lg font-medium flex-1">
                      {skill.name[currentLanguage as "en" | "ml"] ||
                        skill.name.en}
                    </p>
                    <Button variant="outline" size="sm">
                      {currentLanguage === "ml" ? "പഠിക്കുക" : "Learn"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
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
