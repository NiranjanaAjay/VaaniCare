import { useCallback, useRef, useState, useEffect } from "react";
import { groqTTS } from "@/services/groqTTS";

export interface UseSpeechSynthesisOptions {
  language?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export interface UseSpeechSynthesisReturn {
  isSpeaking: boolean;
  isSupported: boolean;
  speak: (text: string) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  voices: SpeechSynthesisVoice[];
}

// Check if Groq API key is available
const hasGroqKey = !!import.meta.env.VITE_GROQ_API_KEY;

export function useSpeechSynthesis(
  options: UseSpeechSynthesisOptions = {},
): UseSpeechSynthesisReturn {
  const {
    language = "en-IN",
    rate = 0.9,
    pitch = 1,
    volume = 1,
    onStart,
    onEnd,
    onError,
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  // Map language codes to synthesis language
  const getSynthesisLanguage = useCallback((lang: string): string => {
    const languageMap: Record<string, string> = {
      en: "en-IN",
      ml: "ml-IN",
      hi: "hi-IN",
      ta: "ta-IN",
      te: "te-IN",
      kn: "kn-IN",
      bn: "bn-IN",
      mr: "mr-IN",
    };
    return languageMap[lang] || lang;
  }, []);

  // Load available voices
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();

    // Some browsers load voices asynchronously
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [isSupported]);

  // Find the best voice for a language
  const findVoice = useCallback(
    (lang: string): SpeechSynthesisVoice | null => {
      const targetLang = getSynthesisLanguage(lang);

      // Try to find an exact match first
      let voice = voices.find((v) => v.lang === targetLang);

      // If not found, try to find a voice that starts with the language code
      if (!voice) {
        const langPrefix = targetLang.split("-")[0];
        voice = voices.find((v) => v.lang.startsWith(langPrefix));
      }

      // If still not found for Malayalam, try Google's voice
      if (!voice && lang === "ml") {
        voice = voices.find((v) => v.name.toLowerCase().includes("malayalam"));
      }

      // Fallback to default
      if (!voice && voices.length > 0) {
        voice = voices.find((v) => v.default) || voices[0];
      }

      return voice || null;
    },
    [voices, getSynthesisLanguage],
  );

  // Stop function - stops both Groq and browser TTS
  const stop = useCallback(() => {
    // Stop Groq TTS
    groqTTS.stop();

    // Stop browser TTS
    if (isSupported) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [isSupported]);

  // Browser-native TTS
  const speakWithBrowser = useCallback(
    (text: string) => {
      if (!isSupported || !text) return;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      const voice = findVoice(language);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.lang = getSynthesisLanguage(language);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      utterance.onstart = () => {
        setIsSpeaking(true);
        onStart?.();
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        onEnd?.();
      };

      utterance.onerror = (event) => {
        setIsSpeaking(false);
        onError?.(event.error);
      };

      // Workaround for Chrome bug where speech stops after ~15 seconds
      const resumeSpeech = () => {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      };

      const interval = setInterval(resumeSpeech, 10000);

      utterance.onend = () => {
        clearInterval(interval);
        setIsSpeaking(false);
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    },
    [
      isSupported,
      language,
      rate,
      pitch,
      volume,
      findVoice,
      getSynthesisLanguage,
      onStart,
      onEnd,
      onError,
    ],
  );

  // Use Groq TTS for Malayalam when API key is available
  const speakWithGroq = useCallback(
    (text: string) => {
      console.log(
        "🎤 Using Groq TTS for Malayalam:",
        text.substring(0, 50) + "...",
      );

      setIsSpeaking(true);
      onStart?.();

      groqTTS.speak({
        text,
        language: "ml",
        onStart: () => {
          // Already called above
        },
        onEnd: () => {
          setIsSpeaking(false);
          onEnd?.();
        },
        onError: (error) => {
          console.warn(
            "⚠️ Groq TTS failed, falling back to browser TTS:",
            error,
          );
          setIsSpeaking(false);
          // Fallback to browser TTS
          speakWithBrowser(text);
        },
      });
    },
    [onStart, onEnd, speakWithBrowser],
  );

  // Main speak function - routes to Groq for Malayalam, browser for others
  const speak = useCallback(
    (text: string) => {
      if (!text) return;

      // Stop any ongoing speech first
      stop();

      // Use Groq TTS for Malayalam if API key is available
      const isMalayalam = language === "ml" || language === "ml-IN";

      if (isMalayalam && hasGroqKey) {
        speakWithGroq(text);
      } else {
        speakWithBrowser(text);
      }
    },
    [language, speakWithGroq, speakWithBrowser, stop],
  );

  const pause = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.pause();
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.resume();
  }, [isSupported]);

  return {
    isSpeaking,
    isSupported,
    speak,
    stop,
    pause,
    resume,
    voices,
  };
}
