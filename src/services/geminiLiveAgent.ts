/**
 * Gemini Live Voice Agent for VaaniCare
 * Uses Google's Gemini 2.5 Flash with native audio for real-time voice conversations
 */

import { GoogleGenAI, Modality } from "@google/genai";
import type { ServiceDomain } from "../types";

// Speech Recognition types (Web Speech API)
interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionResultItem;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEventType extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventType) => void) | null;
  onerror: ((event: Event & { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

// Service keywords mapping for intent detection
const SERVICE_KEYWORDS: Record<ServiceDomain, string[]> = {
  healthcare: [
    "healthcare",
    "health",
    "doctor",
    "hospital",
    "medical",
    "medicine",
    "sick",
    "fever",
    "pain",
    "ആരോഗ്യം",
    "ഡോക്ടർ",
    "ആശുപത്രി",
  ],
  emergency: [
    "emergency",
    "urgent",
    "help",
    "police",
    "ambulance",
    "fire",
    "danger",
    "accident",
    "അടിയന്തരം",
    "സഹായം",
    "പോലീസ്",
  ],
  legal: [
    "legal",
    "lawyer",
    "law",
    "court",
    "rights",
    "ngo",
    "advocate",
    "നിയമം",
    "അഭിഭാഷകൻ",
    "കോടതി",
  ],
  government: [
    "government",
    "scheme",
    "benefit",
    "pension",
    "subsidy",
    "ration",
    "സർക്കാർ",
    "പദ്ധതി",
    "പെൻഷൻ",
  ],
  employment: [
    "employment",
    "job",
    "work",
    "career",
    "hire",
    "salary",
    "തൊഴിൽ",
    "ജോലി",
    "ജോലി",
  ],
};

export interface VoiceAgentCallbacks {
  onAgentSpeaking: (text: string) => void;
  onUserSpeech: (transcript: string) => void;
  onServiceDetected: (
    service: ServiceDomain,
    details: Record<string, unknown>,
  ) => void;
  onError: (error: string) => void;
  onStatusChange: (status: AgentStatus) => void;
  onAudioOutput?: (audioData: ArrayBuffer) => void;
}

export type AgentStatus =
  | "idle"
  | "connecting"
  | "listening"
  | "processing"
  | "speaking"
  | "error";

export interface DetectedService {
  domain: ServiceDomain;
  language: "en" | "ml";
  confidence: number;
  userRequest: string;
}

class GeminiLiveAgent {
  private ai: GoogleGenAI | null = null;
  private session: unknown = null;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private callbacks: VoiceAgentCallbacks | null = null;
  private status: AgentStatus = "idle";
  private conversationHistory: string[] = [];
  private detectedLanguage: "en" | "ml" = "en";

  private readonly MODEL = "gemini-2.5-flash-preview-native-audio-dialog";
  private readonly GREETING_EN =
    "Hi, I am your VaaniCare agent. What would you like help with today? You can say healthcare, emergency, legal aid, government schemes, or employment.";

  constructor() {
    // Constructor - initialization happens in initialize()
  }

  /**
   * Initialize the Gemini AI client
   */
  async initialize(apiKey: string): Promise<boolean> {
    try {
      this.ai = new GoogleGenAI({ apiKey });
      return true;
    } catch (error) {
      console.error("Failed to initialize Gemini AI:", error);
      return false;
    }
  }

  /**
   * Start the voice agent session
   */
  async start(callbacks: VoiceAgentCallbacks): Promise<void> {
    this.callbacks = callbacks;
    this.setStatus("connecting");

    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      // Connect to Gemini Live
      await this.connectToGemini();

      // Start listening and greet user
      this.setStatus("speaking");
      callbacks.onAgentSpeaking(this.GREETING_EN);

      // Use Web Speech API for TTS since Gemini audio output needs more setup
      await this.speakText(this.GREETING_EN);

      // Start listening for user input
      this.startListening();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to start voice agent";
      this.setStatus("error");
      callbacks.onError(errorMessage);
      console.error("Voice agent start error:", error);
    }
  }

  /**
   * Connect to Gemini Live API
   */
  private async connectToGemini(): Promise<void> {
    if (!this.ai) {
      throw new Error("Gemini AI not initialized. Call initialize() first.");
    }

    const config = {
      responseModalities: [Modality.AUDIO, Modality.TEXT],
      systemInstruction: `You are VaaniCare, a helpful voice assistant that helps users access services in India.
Your role is to:
1. Greet users warmly and ask what they need help with
2. Detect the language they speak (English or Malayalam) and respond in the same language
3. Help them choose from: Healthcare, Emergency, Legal Aid, Government Schemes, or Employment
4. Once they choose, confirm their choice and gather any initial details

Be concise, friendly, and supportive. Many users may be from rural areas and need simple, clear guidance.
If user speaks Malayalam, respond in Malayalam. If they speak English, respond in English.
Always confirm the service they want before proceeding.`,
    };

    try {
      this.session = await this.ai.live.connect({
        model: this.MODEL,
        callbacks: {
          onopen: () => {
            console.debug("Gemini Live session opened");
          },
          onmessage: (message: unknown) => {
            this.handleGeminiMessage(message);
          },
          onerror: (e: ErrorEvent) => {
            console.error("Gemini Live error:", e.message);
            this.callbacks?.onError(e.message);
          },
          onclose: (e: { reason: string }) => {
            console.debug("Gemini Live session closed:", e.reason);
          },
        },
        config: config,
      });
    } catch (error) {
      // If Live API fails, fall back to regular conversation mode
      console.warn(
        "Gemini Live API not available, using fallback mode:",
        error,
      );
      this.session = null;
    }
  }

  /**
   * Handle incoming messages from Gemini
   */
  private handleGeminiMessage(message: unknown): void {
    console.debug("Gemini message:", message);

    const msg = message as { text?: string; audio?: ArrayBuffer };

    if (msg.text) {
      this.callbacks?.onAgentSpeaking(msg.text);
      this.conversationHistory.push(`Agent: ${msg.text}`);

      // Check if the message contains service confirmation
      this.checkForServiceConfirmation(msg.text);
    }

    if (msg.audio && this.callbacks?.onAudioOutput) {
      this.callbacks.onAudioOutput(msg.audio);
    }
  }

  /**
   * Start listening for user speech using Web Speech API
   */
  private startListening(): void {
    if (typeof window === "undefined") return;

    // Check for secure context (HTTPS or localhost)
    if (!window.isSecureContext) {
      this.callbacks?.onError(
        "Voice input requires HTTPS. Please use localhost or a secure connection.",
      );
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Provide browser-specific guidance
      const isFirefox = navigator.userAgent.includes("Firefox");
      const isSafari =
        navigator.userAgent.includes("Safari") &&
        !navigator.userAgent.includes("Chrome");

      let errorMsg = "Speech recognition is not supported in this browser. ";
      if (isFirefox) {
        errorMsg += "Please use Chrome, Edge, or Brave for voice features.";
      } else if (isSafari) {
        errorMsg +=
          "Safari has limited support. Please use Chrome or Edge for best experience.";
      } else {
        errorMsg += "Please use Chrome, Edge, or Brave for voice features.";
      }

      this.callbacks?.onError(errorMsg);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN"; // Will also detect Malayalam

    recognition.onstart = () => {
      this.setStatus("listening");
    };

    recognition.onresult = (event: SpeechRecognitionEventType) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        this.handleUserSpeech(finalTranscript);
      } else if (interimTranscript) {
        this.callbacks?.onUserSpeech(interimTranscript);
      }
    };

    recognition.onerror = (event: Event & { error: string }) => {
      if (event.error !== "no-speech") {
        this.callbacks?.onError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      // Restart listening if still active
      if (this.status === "listening") {
        recognition.start();
      }
    };

    recognition.start();
    this.mediaRecorder = recognition as unknown as MediaRecorder;
  }

  /**
   * Handle user speech input
   */
  private async handleUserSpeech(transcript: string): Promise<void> {
    this.callbacks?.onUserSpeech(transcript);
    this.conversationHistory.push(`User: ${transcript}`);

    // Detect language
    const hasMalayalam =
      /[\u0D00-\u0D7F]/.test(transcript) ||
      this.containsMalayalamWords(transcript);
    if (hasMalayalam) {
      this.detectedLanguage = "ml";
    }

    // Detect service intent
    const detectedService = this.detectServiceIntent(transcript);

    if (detectedService) {
      this.setStatus("processing");

      // Log the details
      console.log("=== VaaniCare Service Detection ===");
      console.log("User Request:", transcript);
      console.log("Detected Service:", detectedService.domain);
      console.log(
        "Language:",
        this.detectedLanguage === "ml" ? "Malayalam" : "English",
      );
      console.log("Conversation History:", this.conversationHistory);
      console.log("================================");

      // Confirm with user
      const confirmMessage = this.getConfirmationMessage(
        detectedService.domain,
      );
      this.setStatus("speaking");
      this.callbacks?.onAgentSpeaking(confirmMessage);
      await this.speakText(confirmMessage);

      // Navigate to service page
      this.callbacks?.onServiceDetected(detectedService.domain, {
        language: this.detectedLanguage,
        userRequest: transcript,
        conversationHistory: this.conversationHistory,
      });
    } else {
      // Ask for clarification
      this.setStatus("processing");
      const clarifyMessage = this.getClarificationMessage();
      this.setStatus("speaking");
      this.callbacks?.onAgentSpeaking(clarifyMessage);
      await this.speakText(clarifyMessage);

      // Continue listening
      this.setStatus("listening");
    }
  }

  /**
   * Check if text contains Malayalam words
   */
  private containsMalayalamWords(text: string): boolean {
    const malayalamKeywords = [
      "ആരോഗ്യം",
      "സഹായം",
      "നിയമം",
      "സർക്കാർ",
      "തൊഴിൽ",
      "ഡോക്ടർ",
      "പോലീസ്",
    ];
    const lowerText = text.toLowerCase();
    return malayalamKeywords.some((word) =>
      lowerText.includes(word.toLowerCase()),
    );
  }

  /**
   * Detect which service the user wants
   */
  private detectServiceIntent(transcript: string): DetectedService | null {
    const lowerTranscript = transcript.toLowerCase();

    for (const [domain, keywords] of Object.entries(SERVICE_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerTranscript.includes(keyword.toLowerCase())) {
          return {
            domain: domain as ServiceDomain,
            language: this.detectedLanguage,
            confidence: 0.8,
            userRequest: transcript,
          };
        }
      }
    }

    return null;
  }

  /**
   * Get confirmation message for detected service
   */
  private getConfirmationMessage(service: ServiceDomain): string {
    const messages: Record<ServiceDomain, { en: string; ml: string }> = {
      healthcare: {
        en: "Great! Taking you to healthcare services. I'll help you find doctors, hospitals, and medical guidance.",
        ml: "നല്ലത്! ആരോഗ്യ സേവനങ്ങളിലേക്ക് കൊണ്ടുപോകുന്നു. ഡോക്ടർമാരെയും ആശുപത്രികളെയും കണ്ടെത്താൻ ഞാൻ സഹായിക്കാം.",
      },
      emergency: {
        en: "I understand this is urgent. Taking you to emergency services right away.",
        ml: "ഇത് അടിയന്തരമാണെന്ന് മനസ്സിലായി. ഉടൻ തന്നെ അടിയന്തര സേവനങ്ങളിലേക്ക് കൊണ്ടുപോകുന്നു.",
      },
      legal: {
        en: "Taking you to legal aid services. I can help you find lawyers, NGOs, and legal guidance.",
        ml: "നിയമ സഹായ സേവനങ്ങളിലേക്ക് കൊണ്ടുപോകുന്നു. അഭിഭാഷകരെയും എൻജിഒകളെയും കണ്ടെത്താൻ സഹായിക്കാം.",
      },
      government: {
        en: "Taking you to government schemes. I'll help you find benefits and schemes you may be eligible for.",
        ml: "സർക്കാർ പദ്ധതികളിലേക്ക് കൊണ്ടുപോകുന്നു. നിങ്ങൾക്ക് യോഗ്യതയുള്ള ആനുകൂല്യങ്ങൾ കണ്ടെത്താൻ സഹായിക്കാം.",
      },
      employment: {
        en: "Taking you to employment services. I'll help you find jobs and career opportunities.",
        ml: "തൊഴിൽ സേവനങ്ങളിലേക്ക് കൊണ്ടുപോകുന്നു. ജോലികളും കരിയർ അവസരങ്ങളും കണ്ടെത്താൻ സഹായിക്കാം.",
      },
    };

    return this.detectedLanguage === "ml"
      ? messages[service].ml
      : messages[service].en;
  }

  /**
   * Get clarification message
   */
  private getClarificationMessage(): string {
    if (this.detectedLanguage === "ml") {
      return "ക്ഷമിക്കണം, എനിക്ക് മനസ്സിലായില്ല. ആരോഗ്യം, അടിയന്തരം, നിയമ സഹായം, സർക്കാർ പദ്ധതികൾ, അല്ലെങ്കിൽ തൊഴിൽ എന്ന് പറയാമോ?";
    }
    return "I didn't quite catch that. Could you say healthcare, emergency, legal aid, government, or employment?";
  }

  /**
   * Check if agent's response confirms a service
   */
  private checkForServiceConfirmation(_text: string): void {
    // This would be used when processing Gemini's response
    // to detect if it has confirmed a service selection
    // Reserved for future implementation
  }

  /**
   * Speak text using Web Speech API
   */
  private async speakText(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.detectedLanguage === "ml" ? "ml-IN" : "en-IN";
      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      // Find appropriate voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find((v) =>
        v.lang.startsWith(this.detectedLanguage === "ml" ? "ml" : "en"),
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        this.setStatus("listening");
        resolve();
      };

      utterance.onerror = () => {
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Set agent status
   */
  private setStatus(status: AgentStatus): void {
    this.status = status;
    this.callbacks?.onStatusChange(status);
  }

  /**
   * Stop the voice agent
   */
  stop(): void {
    // Stop speech recognition
    if (this.mediaRecorder) {
      try {
        (this.mediaRecorder as unknown as SpeechRecognitionInstance).stop();
      } catch {
        // Ignore errors
      }
      this.mediaRecorder = null;
    }

    // Stop media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    // Close Gemini session
    if (this.session) {
      try {
        (this.session as { close: () => void }).close();
      } catch {
        // Ignore errors
      }
      this.session = null;
    }

    // Stop TTS
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    this.setStatus("idle");
    this.conversationHistory = [];
  }

  /**
   * Get current status
   */
  getStatus(): AgentStatus {
    return this.status;
  }
}

// Singleton instance
export const geminiLiveAgent = new GeminiLiveAgent();
