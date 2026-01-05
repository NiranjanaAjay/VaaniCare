import { Mic, MicOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  isListening: boolean;
  isSpeaking: boolean;
  onPress: () => void;
  size?: "default" | "large";
  className?: string;
  ariaLabel?: string;
}

export function VoiceButton({
  isListening,
  isSpeaking,
  onPress,
  size = "large",
  className,
  ariaLabel = "Press to speak",
}: VoiceButtonProps) {
  const sizeClasses =
    size === "large" ? "w-32 h-32 sm:w-40 sm:h-40" : "w-20 h-20";

  const iconSize = size === "large" ? "w-16 h-16 sm:w-20 sm:h-20" : "w-10 h-10";

  return (
    <div className="relative flex items-center justify-center">
      {/* Pulse rings when listening */}
      {isListening && (
        <>
          <span className="pulse-ring" style={{ animationDelay: "0s" }} />
          <span className="pulse-ring" style={{ animationDelay: "0.5s" }} />
          <span className="pulse-ring" style={{ animationDelay: "1s" }} />
        </>
      )}

      <Button
        onClick={onPress}
        className={cn(
          sizeClasses,
          "rounded-full relative z-10 transition-all duration-300",
          "shadow-2xl hover:shadow-3xl",
          isListening && "bg-red-500 hover:bg-red-600 animate-pulse",
          isSpeaking && "bg-green-500 hover:bg-green-600",
          !isListening && !isSpeaking && "bg-primary hover:bg-primary/90",
          className,
        )}
        aria-label={ariaLabel}
        aria-pressed={isListening}
      >
        {isSpeaking ? (
          <Volume2 className={cn(iconSize, "text-white animate-pulse")} />
        ) : isListening ? (
          <MicOff className={cn(iconSize, "text-white")} />
        ) : (
          <Mic className={cn(iconSize, "text-white")} />
        )}
      </Button>
    </div>
  );
}

// Voice wave indicator component
export function VoiceIndicator({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;

  return (
    <div className="voice-indicator h-12 flex items-center justify-center gap-1">
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className="w-1.5 bg-primary rounded-full"
          style={{
            height: "8px",
            animation: "voice-wave 1s ease-in-out infinite",
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}
