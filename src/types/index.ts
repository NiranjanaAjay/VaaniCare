// Basic types for VaaniCare

export type Locale = "en-IN" | "ml-IN";

export interface VoiceResult {
  transcript: string;
  confidence: number;
  locale: Locale;
  isFinal: boolean;
}

export type ServiceDomain =
  | "healthcare"
  | "emergency"
  | "legal"
  | "government"
  | "employment";
