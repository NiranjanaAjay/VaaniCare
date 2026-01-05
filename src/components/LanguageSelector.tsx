import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/contexts/TranslationContext";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  onLanguageChange?: (language: string) => void;
  className?: string;
}

export function LanguageSelector({
  onLanguageChange,
  className,
}: LanguageSelectorProps) {
  const { currentLanguage, setLanguage, languages } = useTranslation();

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode);
    onLanguageChange?.(langCode);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Globe className="w-5 h-5 text-muted-foreground" />
      <div className="flex gap-2">
        {languages.map((lang) => (
          <Button
            key={lang.code}
            variant={currentLanguage === lang.code ? "default" : "outline"}
            size="sm"
            onClick={() => handleLanguageChange(lang.code)}
            className={cn(
              "min-w-[80px] text-base font-medium",
              currentLanguage === lang.code && "ring-2 ring-offset-2",
            )}
            aria-pressed={currentLanguage === lang.code}
            aria-label={`Switch to ${lang.name}`}
          >
            {lang.native}
          </Button>
        ))}
      </div>
    </div>
  );
}

// Compact language toggle for header
export function LanguageToggle({ className }: { className?: string }) {
  const { currentLanguage, setLanguage, languages } = useTranslation();

  const toggleLanguage = () => {
    const currentIndex = languages.findIndex((l) => l.code === currentLanguage);
    const nextIndex = (currentIndex + 1) % languages.length;
    setLanguage(languages[nextIndex].code);
  };

  const currentLang = languages.find((l) => l.code === currentLanguage);

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={toggleLanguage}
      className={cn("gap-2 text-lg", className)}
      aria-label="Toggle language"
    >
      <Globe className="w-5 h-5" />
      <span>{currentLang?.native}</span>
    </Button>
  );
}
