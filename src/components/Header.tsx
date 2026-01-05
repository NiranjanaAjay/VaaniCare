import { ArrowLeft, Home as HomeIcon, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "./LanguageSelector";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showHome?: boolean;
  onHome?: () => void;
  showLanguage?: boolean;
  showMute?: boolean;
  isMuted?: boolean;
  onMuteToggle?: () => void;
  className?: string;
}

export function Header({
  title,
  showBack = false,
  onBack,
  showHome = false,
  onHome,
  showLanguage = true,
  showMute = false,
  isMuted = false,
  onMuteToggle,
  className,
}: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "border-b px-4 py-3 safe-area-top",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
        {/* Left side - Navigation */}
        <div className="flex items-center gap-2">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-12 w-12"
              aria-label="Go back"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          )}
          {showHome && !showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onHome}
              className="h-12 w-12"
              aria-label="Go home"
            >
              <HomeIcon className="h-6 w-6" />
            </Button>
          )}
        </div>

        {/* Center - Title */}
        {title && (
          <h1 className="flex-1 text-xl sm:text-2xl font-bold text-center truncate">
            {title}
          </h1>
        )}

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {showMute && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMuteToggle}
              className="h-12 w-12"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="h-6 w-6" />
              ) : (
                <Volume2 className="h-6 w-6" />
              )}
            </Button>
          )}
          {showLanguage && <LanguageToggle />}
        </div>
      </div>
    </header>
  );
}
