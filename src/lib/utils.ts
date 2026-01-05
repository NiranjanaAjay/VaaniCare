import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format phone number for display
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
}

// Delay utility for voice timing
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Check if device supports speech
export function isSpeechSupported(): {
  recognition: boolean;
  synthesis: boolean;
} {
  const recognition =
    "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
  const synthesis = "speechSynthesis" in window;
  return { recognition, synthesis };
}
