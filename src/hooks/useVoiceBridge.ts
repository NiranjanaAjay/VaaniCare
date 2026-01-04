/**
 * Voice Bridge Hook for VaaniCare
 * Handles speech recognition (ASR) and text-to-speech (TTS)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { Locale, VoiceResult } from "../types";

// Speech Recognition types (Web Speech API)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event & { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface UseVoiceBridgeOptions {
  locale?: Locale;
  continuous?: boolean;
  onResult?: (result: VoiceResult) => void;
  onError?: (error: string) => void;
  autoSpeak?: boolean;
  speakRate?: number;
}

interface UseVoiceBridgeReturn {
  // Recognition state
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  confidence: number;

  // TTS state
  isSpeaking: boolean;

  // Actions
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string, locale?: Locale) => Promise<void>;
  stopSpeaking: () => void;

  // Support flags
  isSupported: boolean;
  error: string | null;
}

/**
 * Custom hook for voice input/output
 */
export function useVoiceBridge(
  options: UseVoiceBridgeOptions = {},
): UseVoiceBridgeReturn {
  const {
    locale = "en-IN",
    continuous = false,
    onResult,
    onError,
    // autoSpeak reserved for future use
    speakRate = 0.9,
  } = options;

  // State
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Check browser support
  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) &&
    "speechSynthesis" in window;

  // Initialize speech recognition
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = locale === "ml-IN" ? "ml-IN" : "en-IN";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
          setConfidence(result[0].confidence);
        } else {
          interimText += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript);
        setInterimTranscript("");

        if (onResult) {
          onResult({
            transcript: finalTranscript.trim(),
            confidence: event.results[event.results.length - 1][0].confidence,
            locale: locale,
            isFinal: true,
          });
        }
      } else {
        setInterimTranscript(interimText);
      }
    };

    recognition.onerror = (event) => {
      const errorMessage = getErrorMessage(event.error);
      setError(errorMessage);
      setIsListening(false);
      if (onError) {
        onError(errorMessage);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognitionRef.current = recognition;
    synthRef.current = window.speechSynthesis;

    return () => {
      recognition.abort();
    };
  }, [isSupported, locale, continuous, onResult, onError]);

  // Update language when locale changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = locale === "ml-IN" ? "ml-IN" : "en-IN";
    }
  }, [locale]);

  /**
   * Start listening for speech
   */
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError("Speech recognition not supported");
      return;
    }

    // Stop any ongoing speech
    if (synthRef.current?.speaking) {
      synthRef.current.cancel();
    }

    setTranscript("");
    setInterimTranscript("");
    setError(null);

    try {
      recognitionRef.current.start();
    } catch (e) {
      // Already started, ignore
      console.log("Recognition already started");
    }
  }, []);

  /**
   * Stop listening
   */
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  /**
   * Speak text using TTS
   */
  const speak = useCallback(
    async (text: string, speakLocale?: Locale): Promise<void> => {
      if (!synthRef.current) {
        setError("Text-to-speech not supported");
        return;
      }

      return new Promise((resolve) => {
        // Cancel any ongoing speech
        synthRef.current!.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = speakLocale === "ml-IN" ? "ml-IN" : "en-IN";
        utterance.rate = speakRate;
        utterance.pitch = 1;
        utterance.volume = 1;

        // Try to find a suitable voice
        const voices = synthRef.current!.getVoices();
        const targetLang = speakLocale === "ml-IN" ? "ml" : "en";
        const voice = voices.find(
          (v) =>
            v.lang.startsWith(targetLang) ||
            v.lang.includes(speakLocale === "ml-IN" ? "Malayalam" : "India"),
        );
        if (voice) {
          utterance.voice = voice;
        }

        utterance.onstart = () => {
          setIsSpeaking(true);
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          resolve();
        };

        utterance.onerror = () => {
          setIsSpeaking(false);
          resolve();
        };

        synthRef.current!.speak(utterance);
      });
    },
    [speakRate],
  );

  /**
   * Stop speaking
   */
  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    confidence,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    isSupported,
    error,
  };
}

/**
 * Get user-friendly error message
 */
function getErrorMessage(error: string): string {
  switch (error) {
    case "no-speech":
      return "No speech detected. Please try again.";
    case "audio-capture":
      return "Microphone not accessible. Please check permissions.";
    case "not-allowed":
      return "Microphone permission denied. Please enable it in settings.";
    case "network":
      return "Network error. Please check your connection.";
    case "aborted":
      return "Listening stopped.";
    case "language-not-supported":
      return "Language not supported.";
    default:
      return "An error occurred. Please try again.";
  }
}
