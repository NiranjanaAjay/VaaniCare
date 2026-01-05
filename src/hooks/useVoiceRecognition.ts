import { useState, useCallback, useRef, useEffect } from "react";

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export interface UseVoiceRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export interface UseVoiceRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useVoiceRecognition(
  options: UseVoiceRecognitionOptions = {},
): UseVoiceRecognitionReturn {
  const {
    language = "en-IN",
    continuous = false,
    interimResults = true,
    onResult,
    onError,
    onStart,
    onEnd,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isInitializedRef = useRef(false);

  // Store callbacks in refs to avoid stale closures
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  const onStartRef = useRef(onStart);
  const onEndRef = useRef(onEnd);

  // Update refs when callbacks change
  useEffect(() => {
    onResultRef.current = onResult;
    onErrorRef.current = onError;
    onStartRef.current = onStart;
    onEndRef.current = onEnd;
  }, [onResult, onError, onStart, onEnd]);

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // Map language codes to recognition language
  const getRecognitionLanguage = useCallback((lang: string): string => {
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

  // Initialize recognition only once
  useEffect(() => {
    if (!isSupported || isInitializedRef.current) return;

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognitionAPI();
    isInitializedRef.current = true;

    const recognition = recognitionRef.current;
    if (!recognition) return;

    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = getRecognitionLanguage(language);

    recognition.onstart = () => {
      console.log("🎤 Speech recognition started");
      setIsListening(true);
      onStartRef.current?.();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      console.log("📝 Speech recognition result received");
      let finalTranscript = "";
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const resultTranscript = result[0].transcript;
        console.log(
          "Result:",
          resultTranscript,
          "isFinal:",
          result.isFinal,
          "confidence:",
          result[0].confidence,
        );

        if (result.isFinal) {
          finalTranscript += resultTranscript;
        } else {
          interim += resultTranscript;
        }
      }

      if (finalTranscript) {
        console.log("✅ Final transcript:", finalTranscript);
        setTranscript((prev) => prev + finalTranscript);
        onResultRef.current?.(finalTranscript, true);
      }

      setInterimTranscript(interim);
      if (interim) {
        console.log("⏳ Interim transcript:", interim);
        onResultRef.current?.(interim, false);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Ignore abort errors as they're expected during cleanup
      if (event.error === "aborted") {
        console.log("⚠️ Speech recognition aborted (expected during cleanup)");
        return;
      }

      if (event.error === "no-speech") {
        console.warn("⚠️ No speech detected. Please try speaking again.");
      } else if (event.error === "audio-capture") {
        console.error("❌ Microphone error. Please check permissions.");
      } else if (event.error === "not-allowed") {
        console.error("❌ Microphone permission denied.");
      } else {
        console.error("❌ Speech recognition error:", event.error);
      }

      setIsListening(false);
      onErrorRef.current?.(event.error);
    };

    recognition.onend = () => {
      console.log("🛑 Speech recognition ended");
      setIsListening(false);
      setInterimTranscript("");
      onEndRef.current?.();
    };

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (error) {
          console.log("Error aborting recognition:", error);
        }
      }
    };
  }, [isSupported]); // Only depend on isSupported to prevent re-initialization

  // Update language dynamically
  useEffect(() => {
    if (recognitionRef.current && isInitializedRef.current) {
      recognitionRef.current.lang = getRecognitionLanguage(language);
      console.log("🌐 Language updated to:", getRecognitionLanguage(language));
    }
  }, [language, getRecognitionLanguage]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      console.warn("⚠️ Speech recognition not supported or not initialized");
      return;
    }

    if (isListening) {
      console.warn("⚠️ Already listening");
      return;
    }

    try {
      setTranscript("");
      setInterimTranscript("");
      console.log("▶️ Starting speech recognition...");
      recognitionRef.current.start();
    } catch (error) {
      console.error("❌ Error starting recognition:", error);
      if (error instanceof Error && error.message.includes("already started")) {
        // If already started, stop and restart
        console.log("🔄 Restarting recognition...");
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            recognitionRef.current?.start();
          }, 100);
        } catch (e) {
          console.error("Error restarting:", e);
        }
      }
    }
  }, [isSupported, isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;

    try {
      console.log("⏹️ Stopping speech recognition...");
      recognitionRef.current.stop();
    } catch (error) {
      console.error("❌ Error stopping recognition:", error);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
  };
}
